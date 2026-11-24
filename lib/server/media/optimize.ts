import 'server-only';
import {execFile} from 'node:child_process';
import {mkdtemp, readFile, rm, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {promisify} from 'node:util';
import {GetObjectCommand} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import {MAX_MEDIA_BYTES, mediaBucket, mediaS3Client} from './library';

const run = promisify(execFile);
export type OptimizationMode = 'lossless' | 'high-quality';
type Media = {mimeType: string; sizeBytes: number; storageKey: string; originalName: string};
export class MediaOptimizationError extends Error {}
const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
const videoTypes = ['video/mp4', 'video/webm'];

async function sourceBytes(asset: Media) {
  const object = await mediaS3Client().send(new GetObjectCommand({
    Bucket: mediaBucket(), Key: asset.storageKey, Range: `bytes=0-${MAX_MEDIA_BYTES}`,
  }), {abortSignal: AbortSignal.timeout(12_000)});
  if (!object.Body) throw new Error('Media is unavailable');
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of object.Body as NodeJS.ReadableStream) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += part.length;
    if (bytes > MAX_MEDIA_BYTES || bytes > asset.sizeBytes) throw new MediaOptimizationError('The source file exceeds the optimization limit.');
    chunks.push(part);
  }
  if (bytes !== asset.sizeBytes) throw new Error('Incomplete source file');
  return Buffer.concat(chunks);
}

async function imageVariant(input: Buffer, mimeType: string, mode: OptimizationMode) {
  const image = sharp(input, {limitInputPixels: 25_000_000}).timeout({seconds: 25});
  const metadata = await image.metadata();
  if ((metadata.pages ?? 1) > 1) throw new MediaOptimizationError('Animated images are kept as originals.');
  if (mode === 'lossless' && metadata.depth !== 'uchar') throw new MediaOptimizationError('This image uses a higher bit depth. Keep the original to preserve it.');
  const normalized = image.autoOrient();
  if (metadata.icc) normalized.keepIccProfile();
  const png = mode === 'lossless' && mimeType === 'image/png';
  const output = png ? normalized.png({compressionLevel: 9, adaptiveFiltering: true})
    : normalized.webp({lossless: mode === 'lossless', quality: mode === 'lossless' ? 100 : 92, effort: 4});
  return {bytes: await output.toBuffer(), extension: png ? 'png' : 'webp'};
}

async function videoVariant(input: Buffer, asset: Media, mode: OptimizationMode) {
  const directory = await mkdtemp(join(tmpdir(), 'lwr-media-'));
  const webm = asset.mimeType === 'video/webm';
  const extension = mode === 'lossless' && webm ? 'webm' : 'mp4';
  try {
    const source = join(directory, 'source');
    const output = join(directory, `optimized.${extension}`);
    await writeFile(source, input);
    const encode = mode === 'lossless' ? ['-map', '0', '-c', 'copy']
      : ['-map', '0:v:0', '-map', '0:a?', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-threads', '2', '-c:a', 'aac', '-b:a', '160k'];
    await run('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-protocol_whitelist', 'file',
      '-threads', '2', '-max_pixels', '16777216', '-f', webm ? 'matroska' : 'mov', '-i', source,
      ...encode, '-map_metadata', '-1', ...(mode === 'high-quality' ? ['-map_chapters', '-1'] : []),
      ...(extension === 'mp4' ? ['-movflags', '+faststart'] : []),
      '-fs', String(asset.sizeBytes + 1024 * 1024), output,
    ], {timeout: 90_000, maxBuffer: 128 * 1024, killSignal: 'SIGKILL'});
    const {size} = await stat(output);
    if (size >= asset.sizeBytes) return null;
    return {bytes: await readFile(output), extension};
  } finally { await rm(directory, {force: true, recursive: true}); }
}

export async function optimizeMedia(asset: Media, mode: OptimizationMode) {
  if (!asset.sizeBytes || asset.sizeBytes > MAX_MEDIA_BYTES) throw new MediaOptimizationError('Choose a file between 1 byte and 50 MB.');
  const image = imageTypes.includes(asset.mimeType);
  if (!image && !videoTypes.includes(asset.mimeType)) throw new MediaOptimizationError('Choose a JPEG, PNG, WebP, AVIF, MP4, or WebM file.');
  const input = await sourceBytes(asset);
  const variant = image ? await imageVariant(input, asset.mimeType, mode) : await videoVariant(input, asset, mode);
  if (!variant?.bytes.length || variant.bytes.length >= asset.sizeBytes) return null;
  const stem = asset.originalName.replace(/\.[^.]+$/, '').slice(0, 140);
  return new File([new Uint8Array(variant.bytes)], `${stem}-optimized.${variant.extension}`);
}
