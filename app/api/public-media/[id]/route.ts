import {imageWidth, resizedMediaResponse} from '@/lib/server/media/public-image';
import {database} from '@/lib/server/database';
import {signedMediaUrl} from '@/lib/server/media/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: {params: Promise<{id: string}>}) {
  const {id} = await context.params;
  if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) return new Response('Not found', {status: 404});
  const url = `/api/public-media/${id}`;
  const width = new URL(request.url).searchParams.get('width');
  const requestedWidth = imageWidth(width);
  if (width !== null && !requestedWidth) return new Response('Unsupported image size', {status: 400});
  try {
    const db = database();
    const [resource, guestbookEntry, review, homepageSettings] = await Promise.all([
      db.resource.findFirst({where: {status: 'PUBLISHED', publishedAt: {lte: new Date()}, coverUrl: url}, select: {id: true}}),
      db.guestbookEntry.findFirst({where: {status: 'APPROVED', imageAssetId: id}, select: {id: true}}),
      db.review.findFirst({where: {status: 'APPROVED', imageAssetId: id}, select: {id: true}}),
      db.homepageSettings.findFirst({where: {id: 1, OR: [{heroImageAssetId: id}, {heroMobileImageAssetId: id}]}, select: {id: true}}),
    ]);
    const asset = (resource || guestbookEntry || review || homepageSettings) && await db.mediaAsset.findUnique({where: {id}, select: {storageKey: true, originalName: true, mimeType: true, sizeBytes: true}});
    if (!asset || !asset.mimeType.startsWith('image/')) return new Response('Not found', {status: 404});
    const resized = await resizedMediaResponse(asset, requestedWidth, 'public, max-age=60');
    if (resized) return resized;
    return new Response(null, {status: 302, headers: {'Location': await signedMediaUrl(asset.storageKey, asset.originalName, asset.mimeType, 'inline', 300), 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer'}});
  } catch { return new Response('Not found', {status: 404}); }
}
