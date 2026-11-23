import {packageSlugConflictMessage, packageSlugConflicts} from '@/lib/server/admin/repository';
import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {MAX_RESOURCE_PACKAGE_BYTES, previewResourcePackage} from '@/lib/server/resources/package-import';
import {ResourceInputError} from '@/lib/server/resources/validation';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try { await requireOwner(); } catch { return Response.json({error: 'Sign in to the creator studio.'}, {status: 401}); }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_RESOURCE_PACKAGE_BYTES + 1024 * 1024) return Response.json({error: 'ZIP packages must be 100 MB or smaller.'}, {status: 413});
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return Response.json({error: 'Choose a ZIP package to preview.'}, {status: 400});
    if (!file.size || file.size > MAX_RESOURCE_PACKAGE_BYTES) return Response.json({error: 'ZIP packages must be between 1 byte and 100 MB.'}, {status: 413});
    if (!/\.zip$/i.test(file.name)) return Response.json({error: 'Choose a file with a .zip extension.'}, {status: 400});

    const preview = previewResourcePackage(Buffer.from(await file.arrayBuffer()));
    const slugs = preview.resources.map(resource => resource.slug).filter(Boolean);
    if (slugs.length) {
      const conflicts = await packageSlugConflicts(database(), slugs);
      if (conflicts.length) preview.errors.push(packageSlugConflictMessage(conflicts));
    }
    preview.errors = [...new Set(preview.errors)];
    preview.valid = preview.errors.length === 0;
    return Response.json({preview}, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    if (error instanceof ResourceInputError) return Response.json({error: error.message}, {status: 400, headers: {'Cache-Control': 'no-store'}});
    console.error('Resource package preview failed', error instanceof Error ? error.name : 'UnknownError');
    return Response.json({error: 'Could not preview this package. Please try again.'}, {status: 500, headers: {'Cache-Control': 'no-store'}});
  }
}
