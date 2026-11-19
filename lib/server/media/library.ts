import 'server-only';
import {mkdir, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import type {Database} from '../database-client';

export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const storageRoot = () => path.resolve(process.env.MEDIA_STORAGE_DIR || '.media');
const extForMime: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif',
  'application/pdf': '.pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc', 'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/wav': '.wav',
  'audio/ogg': '.ogg', 'audio/webm': '.webm',
};

export function detectMediaMime(bytes: Uint8Array, name: string) {
  const b = Buffer.from(bytes);
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
  }
  if (b.subarray(0, 3).toString('ascii') === 'ID3' || (b.length > 1 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WAVE') return 'audio/wav';
  if (b.subarray(0, 4).toString('ascii') === 'OggS') return 'audio/ogg';
  if (b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'audio/webm';
  if (b.toString('ascii', 4, 8) === 'ftyp' && /\.(m4a|mp4)$/i.test(name)) return 'audio/mp4';
  return null;
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
  if (!mimeType || !extForMime[mimeType]) throw new Error('Use an image (JPG, PNG, WebP, GIF, AVIF), PDF, Word document, or audio file (MP3, M4A, WAV, OGG, WebM).');
  if (folderId && !await db.mediaFolder.findUnique({where: {id: folderId}, select: {id: true}})) throw new Error('That folder no longer exists.');
  await mkdir(storageRoot(), {recursive: true});
  const id = randomUUID(), storageKey = `${id}${extForMime[mimeType]}`;
  const fullPath = path.join(storageRoot(), storageKey);
  await writeFile(fullPath, bytes, {flag: 'wx', mode: 0o640});
  try {
    return await db.mediaAsset.create({data: {id, folderId, originalName, storageKey, mimeType, sizeBytes: bytes.byteLength}, select: {id: true, folderId: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true}});
  } catch (error) { await unlink(fullPath).catch(() => undefined); throw error; }
}

export async function readMedia(storageKey: string) {
  if (!/^[a-f\d-]{36}\.(jpg|png|webp|gif|avif|pdf|docx|doc|mp3|m4a|wav|ogg|webm)$/.test(storageKey)) throw new Error('Invalid storage key.');
  return readFile(path.join(storageRoot(), storageKey));
}
