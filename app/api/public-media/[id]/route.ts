import {database} from '@/lib/server/database';
import {signedMediaUrl} from '@/lib/server/media/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: {params: Promise<{id: string}>}) {
  const {id} = await context.params;
  if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) return new Response('Not found', {status: 404});
  const url = `/api/public-media/${id}`;
  try {
    const row = await database().resource.findFirst({where: {status: 'PUBLISHED', publishedAt: {lte: new Date()}, coverUrl: url}, select: {id: true}});
    const asset = row && await database().mediaAsset.findUnique({where: {id}, select: {storageKey: true, originalName: true, mimeType: true}});
    if (!asset || !asset.mimeType.startsWith('image/')) return new Response('Not found', {status: 404});
    return new Response(null, {status: 302, headers: {'Location': await signedMediaUrl(asset.storageKey, asset.originalName, asset.mimeType, 'inline', 300), 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer'}});
  } catch { return new Response('Not found', {status: 404}); }
}
