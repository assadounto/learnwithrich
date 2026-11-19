import {database} from '@/lib/server/database';
import {readMedia} from '@/lib/server/media/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: {params: Promise<{id: string}>}) {
  const {id} = await context.params;
  if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) return new Response('Not found', {status: 404});
  try {
    const asset = await database().mediaAsset.findUnique({where: {id}, select: {storageKey: true, mimeType: true, originalName: true}});
    if (!asset) return new Response('Not found', {status: 404});
    const bytes = await readMedia(asset.storageKey);
    const inline = asset.mimeType.startsWith('image/') || asset.mimeType.startsWith('audio/');
    const filename = encodeURIComponent(asset.originalName).replace(/['()]/g, escape);
    return new Response(bytes, {headers: {
      'Content-Type': asset.mimeType,
      'Content-Length': String(bytes.byteLength),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${filename}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    }});
  } catch { return new Response('Not found', {status: 404}); }
}
