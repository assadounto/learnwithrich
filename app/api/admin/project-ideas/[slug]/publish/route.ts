import {revalidatePath} from 'next/cache';
import {database} from '@/lib/server/database';
import {authoringHeaders as headers, authoringJson} from '@/lib/server/admin/authoring-json';
import {resourceApiAccess, ResourceTokenError} from '@/lib/server/identity/resource-token';
import {ideaFields, ideaSlug, IdeaInputError} from '@/lib/server/project-ideas';
import {ResourceInputError} from '@/lib/server/resources/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = {params: Promise<{slug: string}>};

function failure(error: unknown) {
  if (error instanceof ResourceTokenError) return Response.json({error: error.message}, {status: error.status, headers});
  if (error instanceof IdeaInputError || error instanceof ResourceInputError) return Response.json({error: error.message}, {status: 400, headers});
  return Response.json({error: 'Could not process this idea.'}, {status: 500, headers});
}

export async function GET(request: Request, {params}: Context) {
  try {
    await resourceApiAccess(request, 'publish-ideas');
    const slug = ideaSlug('', (await params).slug);
    const idea = await database().projectIdea.findUnique({where: {slug, status: 'DRAFT'}});
    return idea ? Response.json({idea}, {headers}) : Response.json({error: 'Draft not found.'}, {status: 404, headers});
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, {params}: Context) {
  try {
    const owner = await resourceApiAccess(request, 'publish-ideas');
    if (!owner.automation) throw new ResourceTokenError('Use a publishing token.');
    const authorize = owner.automation;
    const slug = ideaSlug('', (await params).slug);
    const {updatedAt} = await authoringJson(request);
    if (typeof updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(updatedAt) || !Number.isFinite(Date.parse(updatedAt))) {
      throw new IdeaInputError('Send updatedAt from the draft response.');
    }
    const expected = new Date(updatedAt);
    const changed = await database().$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.id}, 18427653))`;
      await authorize(tx);
      const current = await tx.projectIdea.findUnique({where: {slug, status: 'DRAFT', updatedAt: expected}});
      if (!current) return false;
      ideaFields(current);
      return (await tx.projectIdea.updateMany({where: {slug, status: 'DRAFT', updatedAt: expected}, data: {status: 'PUBLISHED'}})).count === 1;
    });
    if (!changed) return Response.json({error: 'This draft changed or is no longer available. Fetch the draft before trying again.'}, {status: 409, headers});
    revalidatePath('/project-ideas');
    revalidatePath(`/project-ideas/${slug}`);
    return Response.json({slug, status: 'PUBLISHED', url: `/project-ideas/${slug}`}, {headers});
  } catch (error) { return failure(error); }
}
