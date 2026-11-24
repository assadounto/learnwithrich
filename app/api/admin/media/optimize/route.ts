import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {saveMedia} from '@/lib/server/media/library';
import {MediaOptimizationError, optimizeMedia} from '@/lib/server/media/optimize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'private, no-store'};
let busy = false;

export async function POST(request: Request) {
  try { await requireOwner(); }
  catch { return Response.json({error: 'Sign in to the creator studio.'}, {status: 401, headers}); }
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') return Response.json({error: 'Open the tool in the creator studio.'}, {status: 403, headers});
  const params = new URL(request.url).searchParams;
  const id = params.get('id') ?? '';
  const mode = params.get('mode');
  if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) || (mode !== 'lossless' && mode !== 'high-quality')) {
    return Response.json({error: 'Choose a file and an optimization mode.'}, {status: 400, headers});
  }
  if (busy) return Response.json({error: 'Wait for the current optimization to finish.'}, {status: 429, headers});
  busy = true;
  try {
    const db = database();
    const source = await db.mediaAsset.findUnique({where: {id}, select: {
      storageKey: true, mimeType: true, originalName: true, sizeBytes: true, folderId: true,
    }});
    if (!source) return Response.json({error: 'File not found.'}, {status: 404, headers});
    const file = await optimizeMedia(source, mode);
    if (!file) return Response.json({asset: null}, {headers});
    const asset = await saveMedia(db, file, source.folderId);
    return Response.json({asset}, {status: 201, headers});
  } catch (error) {
    if (error instanceof MediaOptimizationError) return Response.json({error: error.message}, {status: 422, headers});
    console.error('Could not optimize media', error instanceof Error ? error.name : 'UnknownError');
    return Response.json({error: 'This file could not be optimized. Try the other mode or a smaller source.'}, {status: 422, headers});
  } finally { busy = false; }
}
