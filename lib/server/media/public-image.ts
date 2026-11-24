import 'server-only';
import sharp from 'sharp';
import {GetObjectCommand} from '@aws-sdk/client-s3';
import {mediaBucket, mediaS3Client} from './library';
import {publicImageWidths, type PublicImageWidth} from '@/lib/image-sizes';

const maxInputBytes = 12 * 1024 * 1024;
const cacheBytesLimit = 24 * 1024 * 1024;
const maxConcurrent = 2;
const cache = new Map<string, Buffer>();
const inFlight = new Map<string, Promise<Buffer | null>>();
let cacheBytes = 0;

async function resizeImage(storageKey: string, width: PublicImageWidth) {
  const object = await mediaS3Client().send(new GetObjectCommand({
    Bucket: mediaBucket(), Key: storageKey, Range: `bytes=0-${maxInputBytes}`,
  }), {abortSignal: AbortSignal.timeout(3500)});
  if (!object.Body) return null;

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const value of object.Body as NodeJS.ReadableStream) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
    size += chunk.length;
    if (size > maxInputBytes) return null;
    chunks.push(chunk);
  }

  const image = sharp(Buffer.concat(chunks), {limitInputPixels: 25_000_000});
  const {pages} = await image.metadata();
  // Keep animated formats intact through the original media route.
  if (pages && pages > 1) return null;
  return image.rotate().resize({width, height: width * 2, fit: 'inside', withoutEnlargement: true})
    .webp({quality: 78, effort: 2}).timeout({seconds: 3}).toBuffer();
}

async function imageVariant(asset: {storageKey: string; sizeBytes: number; mimeType: string}, width: PublicImageWidth) {
  if (asset.sizeBytes > maxInputBytes || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(asset.mimeType)) return null;
  const key = `${asset.storageKey}:${width}`;
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const existing = inFlight.get(key);
  if (existing) return existing;
  if (inFlight.size >= maxConcurrent) return null;

  const pending = resizeImage(asset.storageKey, width).then(buffer => {
    if (!buffer || buffer.length > cacheBytesLimit) return buffer;
    while (cacheBytes + buffer.length > cacheBytesLimit || cache.size >= 256) {
      const oldest = cache.keys().next().value!;
      cacheBytes -= cache.get(oldest)!.length;
      cache.delete(oldest);
    }
    cache.set(key, buffer);
    cacheBytes += buffer.length;
    return buffer;
  }).catch(() => null).finally(() => {inFlight.delete(key);});
  inFlight.set(key, pending);
  return pending;
}

export function imageWidth(value: string | null) {
  return publicImageWidths.find(width => String(width) === value);
}

// Call only after checking access to the source asset. Buffered variants are
// shared inside the server process, but private responses cannot be cached by clients.
export async function resizedMediaResponse(
  asset: {storageKey: string; sizeBytes: number; mimeType: string},
  width: PublicImageWidth | undefined,
  cacheControl: 'public, max-age=60' | 'private, no-store',
) {
  if (!width) return null;
  const image = await imageVariant(asset, width);
  if (!image) return null;
  return new Response(new Uint8Array(image), {headers: {
    'Content-Type': 'image/webp', 'Content-Length': String(image.length),
    'Cache-Control': cacheControl, 'X-Content-Type-Options': 'nosniff',
  }});
}
