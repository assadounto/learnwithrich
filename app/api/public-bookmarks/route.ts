import {resources} from '@/lib/server/resources';
import {resourceSlug, ResourceInputError} from '@/lib/server/resources/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const values = new URL(request.url).searchParams.getAll('slug');
  if (values.length > 40) return Response.json({error: 'Choose up to 40 bookmarks.'}, {status: 400});
  try {
    const slugs = [...new Set(values.map(resourceSlug))];
    return Response.json({items: slugs.length ? await resources().publicBookmarks(slugs) : []}, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    if (error instanceof ResourceInputError) return Response.json({error: error.message}, {status: 400});
    return Response.json({error: 'Could not load bookmarks.'}, {status: 503});
  }
}
