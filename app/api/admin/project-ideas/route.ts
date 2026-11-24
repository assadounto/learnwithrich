import {database} from '@/lib/server/database';
import {resourceApiAccess, ResourceTokenError} from '@/lib/server/identity/resource-token';
import {ideaFields, ideaSlug, IdeaInputError} from '@/lib/server/project-ideas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'no-store'};
const maxBody = 512 * 1024;

async function jsonBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new IdeaInputError('Send a JSON body.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBody) {
        await reader.cancel();
        throw new ResourceTokenError('The request exceeds 512 KiB.', 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new IdeaInputError('Send valid JSON.'); }
}

export async function POST(request: Request) {
  try {
    const owner = await resourceApiAccess(request, 'ideas');
    if (!owner.automation) throw new ResourceTokenError('Use a resource API token with idea creation enabled.');
    const assertActive = owner.automation;
    const body: unknown = await jsonBody(request);
    const items: unknown = body && typeof body === 'object' && 'ideas' in body ? body.ideas : null;
    if (!Array.isArray(items) || !items.length || items.length > 25) throw new IdeaInputError('Send an ideas array with 1 to 25 entries.');
    const data = items.map((item: unknown) => {
      const fields = ideaFields(item);
      const slug = ideaSlug(fields.title, (item as Record<string, unknown>).slug);
      return {...fields, slug};
    });
    if (new Set(data.map(item => item.slug)).size !== data.length) throw new IdeaInputError('Each idea in the batch needs a unique slug.');
    const ideas = await database().$transaction(async transaction => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.id}, 18427653))`;
      await assertActive(transaction);
      return transaction.projectIdea.createManyAndReturn({data, select: {slug: true, title: true, status: true, updatedAt: true}});
    });
    return Response.json({ideas}, {status: 201, headers});
  } catch (error) {
    if (error instanceof ResourceTokenError) return Response.json({error: error.message}, {status: error.status, headers});
    if (error instanceof IdeaInputError) return Response.json({error: error.message}, {status: 400, headers});
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      return Response.json({error: 'An idea already uses one of these slugs. No drafts were added.'}, {status: 409, headers});
    }
    return Response.json({error: 'Could not save these ideas.'}, {status: 500, headers});
  }
}
