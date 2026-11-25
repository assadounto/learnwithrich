import {pageWindow, requestedPage, studioPageSize} from '@/lib/pagination';
import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {MAX_MEDIA_BYTES, saveMedia} from '@/lib/server/media/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try { await requireOwner(); } catch { return Response.json({error: 'Sign in to the creator studio.'}, {status: 401}); }
  const params = new URL(request.url).searchParams;
  const folderId = params.get('folderId');
  const query = params.get('q')?.trim().slice(0, 180);
  try {
    const db = database();
    const where = {...(folderId === 'all' ? {} : {folderId: folderId || null}), ...(query ? {originalName: {contains: query, mode: 'insensitive' as const}} : {})};
    const select = {createdAt: true, folderId: true, id: true, mimeType: true, originalName: true, sizeBytes: true} as const;
    const orderBy = [{createdAt: 'desc' as const}, {id: 'asc' as const}];
    const list = params.has('per') ? db.$transaction(async tx => {
      const total = await tx.mediaAsset.count({where});
      const size = studioPageSize(params.get('per'));
      const {page, pages, skip} = pageWindow(total, size, requestedPage(params.get('page')));
      const assets = await tx.mediaAsset.findMany({where, orderBy, skip, take: size, select});
      return {assets, page, pages};
    }, {isolationLevel: 'RepeatableRead'})
      : db.mediaAsset.findMany({where, orderBy, take: 120, select}).then(assets => ({assets}));
    const [folders, result] = await Promise.all([
      db.mediaFolder.findMany({orderBy: {name: 'asc'}, select: {_count: {select: {assets: true}}, createdAt: true, id: true, name: true}}),
      list,
    ]);
    return Response.json({folders, ...result}, {headers: {'Cache-Control': 'no-store'}});
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
