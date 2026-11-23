import 'server-only';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import type {Database} from '../database-client';

export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const extForMime: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif',
  'application/pdf': '.pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc', 'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/wav': '.wav',
  'audio/ogg': '.ogg', 'video/mp4': '.mp4', 'video/webm': '.webm',
  'application/zip': '.zip', 'text/plain': '.txt', 'text/markdown': '.md', 'text/csv': '.csv',
  'application/json': '.json', 'application/yaml': '.yaml', 'application/xml': '.xml',
  'text/x-python': '.py', 'text/javascript': '.js', 'text/typescript': '.ts', 'text/html': '.html',
  'text/css': '.css', 'text/x-c': '.c', 'text/x-c-header': '.h', 'text/x-c++': '.cpp',
  'text/x-c++-header': '.hpp', 'text/x-shellscript': '.sh', 'application/toml': '.toml',
  'application/octet-stream': '.svg',
};
const textMimeForExtension: Record<string, string> = {
  '.txt': 'text/plain', '.md': 'text/markdown', '.csv': 'text/csv', '.json': 'application/json',
  '.yaml': 'application/yaml', '.yml': 'application/yaml', '.xml': 'application/xml',
  '.py': 'text/x-python', '.js': 'text/javascript', '.ts': 'text/typescript', '.html': 'text/html',
  '.css': 'text/css', '.c': 'text/x-c', '.h': 'text/x-c-header', '.cpp': 'text/x-c++',
  '.hpp': 'text/x-c++-header', '.ino': 'text/x-c++', '.sh': 'text/x-shellscript', '.toml': 'application/toml',
};

let client: S3Client | undefined;
export function mediaBucket() {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket || bucket.length < 3 || bucket.length > 63 || !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucket)) throw new Error('S3_BUCKET must be a valid bucket name.');
  return bucket;
}
export function mediaS3Client() {
  const {S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT_URL, S3_FORCE_PATH_STYLE} = process.env;
  const region = S3_REGION?.trim();
  if (!region || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) throw new Error('Configure S3_REGION, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.');
  if (S3_ENDPOINT_URL) {
    const endpoint = new URL(S3_ENDPOINT_URL);
    if ((endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error('S3_ENDPOINT_URL must be a clean HTTPS endpoint.');
  }
  return client ??= new S3Client({region, ...(S3_ENDPOINT_URL ? {endpoint: S3_ENDPOINT_URL} : {}), forcePathStyle: S3_FORCE_PATH_STYLE === 'true', credentials: {accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY}});
}
export async function putMediaObject(key: string, body: Buffer, mimeType: string) {
  await mediaS3Client().send(new PutObjectCommand({Bucket: mediaBucket(), Key: key, Body: body, ContentLength: body.byteLength, ContentType: mimeType}));
}
export async function deleteMediaObject(key: string) {
  await mediaS3Client().send(new DeleteObjectCommand({Bucket: mediaBucket(), Key: key}));
}
export async function signedMediaUrl(key: string, filename: string, mimeType: string, disposition: 'inline' | 'attachment', expiresIn = 60) {
  return getSignedUrl(mediaS3Client(), new GetObjectCommand({Bucket: mediaBucket(), Key: key, ResponseContentType: mimeType, ResponseContentDisposition: `${disposition}; filename*=UTF-8''${encodeURIComponent(filename).replace(/[']/g, '%27')}`, ResponseCacheControl: 'private, no-store'}), {expiresIn});
}
export async function checkMediaStorage() {
  mediaBucket();
  mediaS3Client();
}
export function mediaExtension(mimeType: string) { return extForMime[mimeType] ?? null; }

export function detectMediaMime(bytes: Uint8Array, name: string) {
  const b = Buffer.from(bytes);
  const extension = path.extname(name).toLowerCase();
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (b.subarray(0, 6).toString('ascii').match(/^GIF8[79]a$/)) return 'image/gif';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (b.toString('ascii', 4, 12) === 'ftypavif' || b.toString('ascii', 4, 12) === 'ftypavis') return 'image/avif';
  if (b.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return 'application/msword';
  if (b.subarray(0, 4).toString('ascii') === 'PK\x03\x04') {
    const zipText = b.toString('latin1');
    if (zipText.includes('word/document.xml') && zipText.includes('[Content_Types].xml')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (extension === '.zip' && b.subarray(Math.max(0, b.length - 65_557)).lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])) >= 0) return 'application/zip';
  }
  // Empty ZIPs consist only of the end-of-central-directory record.
  if (extension === '.zip' && b.length >= 22 && b.subarray(Math.max(0, b.length - 65_557)).lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])) >= 0) return 'application/zip';
  if (b.subarray(0, 3).toString('ascii') === 'ID3' || (b.length > 1 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WAVE') return 'audio/wav';
  if (b.subarray(0, 4).toString('ascii') === 'OggS') return 'audio/ogg';
  if (b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) && /\.webm$/i.test(name)) return 'video/webm';
  if (b.toString('ascii', 4, 8) === 'ftyp' && /\.(mp4|m4v)$/i.test(name)) return 'video/mp4';
  if (b.toString('ascii', 4, 8) === 'ftyp' && /\.m4a$/i.test(name)) return 'audio/mp4';
  if (extension === '.svg' && isSafeTextFile(b) && /<svg(?:\s|>)/i.test(b.toString('utf8', 0, Math.min(b.length, 8192)))) return 'application/octet-stream';
  const textMime = textMimeForExtension[extension];
  if (textMime && isSafeTextFile(b)) return textMime;
  return null;
}

function isSafeTextFile(bytes: Buffer) {
  try {
    const value = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
    return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
  } catch { return false; }
}

export function cleanOriginalName(value: string) {
  const base = path.basename(value).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 180);
  if (!base || base === '.' || base === '..') throw new Error('Choose a file with a valid name.');
  return base;
}

export async function saveMedia(db: Database, file: File, folderId: string | null) {
  if (!file.size || file.size > MAX_MEDIA_BYTES) throw new Error('Files must be between 1 byte and 50 MB.');
  const originalName = cleanOriginalName(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectMediaMime(bytes, originalName);
  if (!mimeType || !extForMime[mimeType]) throw new Error('Use an image (JPG, PNG, WebP, GIF, AVIF), PDF, Word document, ZIP archive, text/source file, audio file, or video file in a supported format.');
  if (folderId && !await db.mediaFolder.findUnique({where: {id: folderId}, select: {id: true}})) throw new Error('That folder no longer exists.');
  const id = randomUUID(), storageKey = `assets/${id}${extForMime[mimeType]}`;
  await putMediaObject(storageKey, bytes, mimeType);
  try {
    return await db.mediaAsset.create({data: {id, folderId, originalName, storageKey, mimeType, sizeBytes: bytes.byteLength}, select: {id: true, folderId: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true}});
  } catch (error) { await deleteMediaObject(storageKey).catch(() => undefined); throw error; }
}
