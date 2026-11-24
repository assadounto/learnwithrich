import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {resourceSlug, ResourceInputError} from '@/lib/server/resources/validation';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'private, no-store'};

export async function POST(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json' ||
      ['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') ?? '')) {
    return Response.json({error: 'Send a same-origin JSON request.'}, {status: 403, headers});
  }
  const user = await currentUser();
  if (!user) return Response.json({error: 'Sign in to import bookmarks.'}, {status: 401, headers});
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error('Missing data');
    const decoder = new TextDecoder();
    let size = 0, json = '';
    try {
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 20_000) {
          await reader.cancel();
          return Response.json({error: 'Bookmark batch is too large.'}, {status: 413, headers});
        }
        json += decoder.decode(value, {stream: true});
      }
      json += decoder.decode();
    } finally { reader.releaseLock(); }
    const body = JSON.parse(json);
    if (body?.accountId !== user.id) return Response.json({error: 'The active account changed.'}, {status: 409, headers});
    if (!Array.isArray(body.slugs) || body.slugs.length > 100) throw new Error('Invalid bookmark list');
    const slugs = [...new Set<string>(body.slugs.map((slug: unknown) => resourceSlug(slug)))];
    const db = database();
    const imported = await db.$transaction(async tx => {
      const resources = await tx.resource.findMany({
        where: {slug: {in: slugs}, status: 'PUBLISHED', publishedAt: {lte: new Date()}},
        select: {id: true, slug: true},
      });
      if (resources.length) await tx.savedResource.createMany({
        data: resources.map(resource => ({userId: user.id, resourceId: resource.id})), skipDuplicates: true,
      });
      return resources.map(resource => resource.slug);
    });
    return Response.json({imported}, {headers});
  } catch (error) {
    if (error instanceof ResourceInputError || error instanceof SyntaxError || error instanceof TypeError || (error instanceof Error && ['Missing data', 'Invalid bookmark list'].includes(error.message))) {
      return Response.json({error: 'Send up to 100 valid resource slugs.'}, {status: 400, headers});
    }
    return Response.json({error: 'Could not import bookmarks.'}, {status: 500, headers});
  }
}
