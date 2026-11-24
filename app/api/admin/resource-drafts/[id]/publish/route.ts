import {revalidatePath} from 'next/cache';
import {database} from '@/lib/server/database';
import {adminRepository, EditConflictError} from '@/lib/server/admin/repository';
import {authoringHeaders as headers, authoringJson} from '@/lib/server/admin/authoring-json';
import {resourceApiAccess, ResourceTokenError} from '@/lib/server/identity/resource-token';
import {resourceId, ResourceInputError} from '@/lib/server/resources/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const owner = await resourceApiAccess(request, 'publish-resources');
    const id = resourceId((await params).id);
    const {version, updatedAt} = await authoringJson(request);
    const resource = await adminRepository(database(), owner.id, owner.sessionId, owner.automation).transition(id, version, updatedAt, 'PUBLISH');
    revalidatePath('/resources');
    revalidatePath(`/resources/${resource.slug}`);
    return Response.json({id: resource.id, slug: resource.slug, status: resource.status, url: `/resources/${resource.slug}`}, {headers});
  } catch (error) {
    if (error instanceof ResourceTokenError) return Response.json({error: error.message}, {status: error.status, headers});
    if (error instanceof ResourceInputError) return Response.json({error: error.message}, {status: 400, headers});
    if (error instanceof EditConflictError) return Response.json({error: error.message}, {status: 409, headers});
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') return Response.json({error: 'Draft not found.'}, {status: 404, headers});
    return Response.json({error: 'Could not publish this resource.'}, {status: 500, headers});
  }
}
