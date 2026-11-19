import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {MAX_MEDIA_BYTES, saveMedia} from '@/lib/server/media/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try { await requireOwner(); } catch { return Response.json({error: 'Sign in to the creator studio.'}, {status: 401}); }
  const folderId = new URL(request.url).searchParams.get('folderId');
  try {
    const db = database();
    const [folders, assets] = await Promise.all([
      db.mediaFolder.findMany({orderBy: {name: 'asc'}, select: {_count: {select: {assets: true}}, createdAt: true, id: true, name: true}}),
      db.mediaAsset.findMany({where: folderId === 'all' ? {} : {folderId: folderId || null}, orderBy: {createdAt: 'desc'}, take: 120, select: {createdAt: true, folderId: true, id: true, mimeType: true, originalName: true, sizeBytes: true}}),
    ]);
    return Response.json({folders, assets}, {headers: {'Cache-Control': 'no-store'}});
  } catch { return Response.json({error: 'Could not load the media library.'}, {status: 500}); }
}

export async function POST(request: Request) {
  try { await requireOwner(); } catch { return Response.json({error: 'Sign in to the creator studio.'}, {status: 401}); }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_MEDIA_BYTES + 1024 * 1024) return Response.json({error: 'Files must be 50 MB or smaller.'}, {status: 413});
  try {
    const form = await request.formData();
    const file = form.get('file');
    const folderIdValue = form.get('folderId');
    if (!(file instanceof File)) return Response.json({error: 'Choose a file to upload.'}, {status: 400});
    const folderId = typeof folderIdValue === 'string' && folderIdValue ? folderIdValue : null;
    const asset = await saveMedia(database(), file, folderId);
    return Response.json({asset}, {status: 201, headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not upload the file.';
    const status = /must be|use an image|choose a file|folder/.test(message.toLowerCase()) ? 400 : 500;
    return Response.json({error: message}, {status});
  }
}
