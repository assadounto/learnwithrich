import {imageWidth, resizedMediaResponse} from '@/lib/server/media/public-image';
import {database} from '@/lib/server/database';
import {currentUser} from '@/lib/server/identity/current-user';
import {signedMediaUrl} from '@/lib/server/media/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: {params: Promise<{id: string}>}) {
  const {id} = await context.params;
  if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) return new Response('Not found', {status: 404});
  const params = new URL(request.url).searchParams;
  const resourceId = params.get('resourceId');
  const width = params.get('width');
  const requestedWidth = imageWidth(width);
  if (width !== null && !requestedWidth) return new Response('Unsupported image size', {status: 400});
  if (!resourceId || !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(resourceId)) return new Response('Not found', {status: 404});
  try {
    const db = database();
    const item = await db.resourceMedia.findFirst({where: {id, resourceId, resource: {status: 'PUBLISHED', publishedAt: {lte: new Date()}}}, select: {id: true, priceMinor: true, resource: {select: {id: true, access: true}}, mediaAsset: {select: {storageKey: true, originalName: true, mimeType: true, sizeBytes: true}}}});
    if (!item) return new Response('Not found', {status: 404});
    const user = item.resource.access === 'PUBLIC' && item.priceMinor === 0 ? null : await currentUser();
    if (item.resource.access === 'PAID' || item.resource.access === 'FREE_ACCOUNT') {
      if (!user) return new Response('Sign in to access this resource.', {status: 401});
    }
    if (item.resource.access === 'PAID') {
      const bundle = await db.purchase.findFirst({where: {userId: user!.id, resourceId: item.resource.id, status: 'PAID'}, select: {id: true}});
      if (!bundle) return new Response('Purchase the resource bundle to download this file.', {status: 403});
    } else if (item.priceMinor > 0) {
      if (!user) return new Response('Sign in to purchase this file.', {status: 401});
      const purchase = await db.purchase.findFirst({where: {userId: user.id, resourceMediaId: item.id, status: 'PAID'}, select: {id: true}});
      if (!purchase) return new Response('Purchase this file to download it.', {status: 403});
    }
    const resized = await resizedMediaResponse(item.mediaAsset, requestedWidth, 'private, no-store');
    if (resized) return resized;
    const disposition = item.mediaAsset.mimeType.startsWith('audio/') || item.mediaAsset.mimeType.startsWith('image/') ? 'inline' : 'attachment';
    return new Response(null, {status: 302, headers: {'Location': await signedMediaUrl(item.mediaAsset.storageKey, item.mediaAsset.originalName, item.mediaAsset.mimeType, disposition, 60), 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer'}});
  } catch { return new Response('File delivery is temporarily unavailable.', {status: 503}); }
}
