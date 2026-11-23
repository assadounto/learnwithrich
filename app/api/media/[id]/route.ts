import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {signedMediaUrl} from '@/lib/server/media/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: {params: Promise<{id: string}>}) {
  try { await requireOwner(); } catch { return new Response('Unauthorized', {status: 401}); }
  const {id} = await context.params;
  if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) return new Response('Not found', {status: 404});
  try {
    const asset = await database().mediaAsset.findUnique({where: {id}, select: {storageKey: true, originalName: true, mimeType: true}});
    if (!asset) return new Response('Not found', {status: 404});
    const options = new URL(request.url).searchParams;
    const previewable = /^(?:image|audio|video)\//.test(asset.mimeType) || asset.mimeType === 'application/pdf';
    const inline = !options.has('download') && (asset.mimeType.startsWith('image/') || options.has('preview') && previewable);
    return new Response(null, {status: 302, headers: {'Location': await signedMediaUrl(asset.storageKey, asset.originalName, asset.mimeType, inline ? 'inline' : 'attachment', 60), 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer'}});
  } catch { return new Response('Could not open this file.', {status: 503}); }
}
