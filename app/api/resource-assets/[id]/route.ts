import {database} from '@/lib/server/database';
import {currentUser} from '@/lib/server/identity/current-user';
import {signedMediaUrl} from '@/lib/server/media/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: {params: Promise<{id: string}>}) {
  const {id} = await context.params;
  if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) return new Response('Not found', {status: 404});
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug || slug.length > 120) return new Response('Not found', {status: 404});
  try {
    const db = database();
    const resource = await db.resource.findFirst({where: {slug, status: 'PUBLISHED', publishedAt: {lte: new Date()}}, select: {id: true, access: true}});
    if (!resource) return new Response('Not found', {status: 404});
    const item = await db.resourceMedia.findUnique({where: {resourceId_mediaAssetId: {resourceId: resource.id, mediaAssetId: id}}, select: {id: true, priceMinor: true, mediaAsset: {select: {storageKey: true, originalName: true, mimeType: true}}}});
    if (!item) return new Response('Not found', {status: 404});
    const user = await currentUser();
    if (resource.access !== 'PUBLIC' && !user) return new Response('Sign in to access this resource.', {status: 401});
    if (resource.access === 'PAID') {
      const purchase = await db.purchase.findFirst({where: {userId: user!.id, resourceId: resource.id, status: 'PAID'}, select: {id: true}});
      if (!purchase) return new Response('Purchase the resource bundle to view this media.', {status: 403});
    } else if (item.priceMinor > 0) {
      if (!user) return new Response('Sign in to purchase this file.', {status: 401});
      const purchase = await db.purchase.findFirst({where: {userId: user!.id, resourceMediaId: item.id, status: 'PAID'}, select: {id: true}});
      if (!purchase) return new Response('Purchase this file to view it.', {status: 403});
    }
    const inline = /^(image|audio|video)\//.test(item.mediaAsset.mimeType);
    return new Response(null, {status: 302, headers: {'Location': await signedMediaUrl(item.mediaAsset.storageKey, item.mediaAsset.originalName, item.mediaAsset.mimeType, inline ? 'inline' : 'attachment', 60), 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer'}});
  } catch {return new Response('Media delivery is temporarily unavailable.', {status: 503});}
}
