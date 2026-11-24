import {packageSlugConflictMessage, packageSlugConflicts} from '@/lib/server/admin/repository';
import {resourceApiAccess, ResourceTokenError} from '@/lib/server/identity/resource-token';
import {database} from '@/lib/server/database';
import {MAX_RESOURCE_PACKAGE_BYTES, readPackageUpload} from '@/lib/server/resources/package-import';
import {ResourceInputError} from '@/lib/server/resources/validation';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_RESOURCE_PACKAGE_BYTES + 1024 * 1024) return Response.json({error: 'ZIP packages must be 100 MB or smaller.'}, {status: 413});
  try {
    await resourceApiAccess(request, 'upload', true);
    const form = await request.formData();
    const {parsed: {preview}} = await readPackageUpload(form.get('file'), false);
    const slugs = preview.resources.map(resource => resource.slug).filter(Boolean);
    if (slugs.length) {
      const conflicts = await packageSlugConflicts(database(), slugs);
      if (conflicts.length) preview.errors.push(packageSlugConflictMessage(conflicts));
    }
    preview.errors = [...new Set(preview.errors)];
    preview.valid = preview.errors.length === 0;
    return Response.json({preview}, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    if (error instanceof ResourceTokenError) return Response.json({error: error.message}, {status: error.status, headers: {'Cache-Control': 'no-store'}});
    if (error instanceof ResourceInputError) return Response.json({error: error.message}, {status: 400, headers: {'Cache-Control': 'no-store'}});
    console.error('Resource package preview failed', error instanceof Error ? error.name : 'UnknownError');
    return Response.json({error: 'Could not preview this package. Please try again.'}, {status: 500, headers: {'Cache-Control': 'no-store'}});
  }
}
