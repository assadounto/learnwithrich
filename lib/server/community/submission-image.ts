import 'server-only';
import type {Database} from '@/lib/server/database-client';
import {deleteMediaObject, detectMediaMime, saveMedia} from '@/lib/server/media/library';

export const MAX_COMMUNITY_IMAGE_BYTES = 2 * 1024 * 1024;
const COMMUNITY_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function saveCommunityImage(db: Database, file: File) {
  if (!file.size || file.size > MAX_COMMUNITY_IMAGE_BYTES) throw new Error('Choose a JPG, PNG or WebP image under 2 MB.');
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectMediaMime(bytes, file.name);
  if (!mimeType || !COMMUNITY_IMAGE_TYPES.has(mimeType)) throw new Error('Choose a JPG, PNG or WebP image under 2 MB.');
  const asset = await saveMedia(db, file, null);
  const extension = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : '.webp';
  return {id: asset.id, storageKey: `assets/${asset.id}${extension}`};
}

export async function discardCommunityImage(db: Database, image: {id: string; storageKey: string}) {
  await deleteMediaObject(image.storageKey).catch(() => undefined);
  await db.mediaAsset.delete({where: {id: image.id}}).catch(() => undefined);
}
