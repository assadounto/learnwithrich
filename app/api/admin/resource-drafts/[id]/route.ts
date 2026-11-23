import {database} from '@/lib/server/database';
import {adminRepository, EditConflictError} from '@/lib/server/admin/repository';
import {resourceApiAccess, ResourceTokenError} from '@/lib/server/identity/resource-token';
import {ResourceInputError, resourceId} from '@/lib/server/resources/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {'Cache-Control': 'no-store'};
const maxBody = 2 * 1024 * 1024;
type Context = {params: Promise<{id: string}>};
type DraftRow = NonNullable<Awaited<ReturnType<ReturnType<typeof adminRepository>['getAutomationDraft']>>>;

function response(row: DraftRow | null) {
  if (!row || row.status !== 'DRAFT') return Response.json({error: 'Draft not found.'}, {status: 404, headers});
  return Response.json({draft: {
    id: row.id, slug: row.slug, type: row.type, title: row.title, summary: row.summary,
    bodyMarkdown: row.content?.bodyMarkdown ?? '', details: row.content?.details ?? {},
    tags: row.tags.map(link => link.tag.name), version: row.version, updatedAt: row.updatedAt,
  }}, {headers});
}

async function jsonBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new ResourceInputError('Send a JSON body.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBody) {
        await reader.cancel();
        throw new ResourceTokenError('The edit request exceeds 2 MiB.', 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ResourceInputError('Send valid JSON.'); }
}

function failed(error: unknown) {
  if (error instanceof ResourceTokenError) return Response.json({error: error.message}, {status: error.status, headers});
  if (error instanceof ResourceInputError) return Response.json({error: error.message}, {status: 400, headers});
  if (error instanceof EditConflictError) return Response.json({error: error.message}, {status: 409, headers});
  console.error('Resource draft API failed', error instanceof Error ? error.name : 'UnknownError');
  return Response.json({error: 'Could not process this draft.'}, {status: 500, headers});
}

export async function GET(request: Request, context: Context) {
  try {
    const owner = await resourceApiAccess(request, 'edit');
    const id = resourceId((await context.params).id);
    return response(await adminRepository(database(), owner.id, owner.sessionId, owner.automation).getAutomationDraft(id));
  } catch (error) { return failed(error); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const owner = await resourceApiAccess(request, 'edit');
    const id = resourceId((await context.params).id);
    return response(await adminRepository(database(), owner.id, owner.sessionId, owner.automation).patchAutomationDraft(id, await jsonBody(request)));
  } catch (error) { return failed(error); }
}
