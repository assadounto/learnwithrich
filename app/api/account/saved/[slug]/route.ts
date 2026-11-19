import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
export const dynamic = 'force-dynamic';
async function resolve(userRequest: Request, slug: string) {
  const user = await currentUser();
  if (!user) return {error: Response.json({error: 'Sign in to sync saved resources.'}, {status: 401})};
  const db = database();
  const resource = await db.resource.findFirst({where: {slug, status: 'PUBLISHED', publishedAt: {lte: new Date()}}, select: {id: true}});
  if (!resource) return {error: Response.json({error: 'Resource not found.'}, {status: 404})};
  return {user, db, resource};
}
export async function GET(request: Request, context: {params: Promise<{slug: string}>}) {
  const {slug} = await context.params, resolved = await resolve(request, slug);
  if (resolved.error) return resolved.error;
  const saved = await resolved.db.savedResource.findUnique({where: {userId_resourceId: {userId: resolved.user.id, resourceId: resolved.resource.id}}, select: {resourceId: true}});
  return Response.json({saved: Boolean(saved)}, {headers: {'Cache-Control': 'no-store'}});
}
export async function PUT(request: Request, context: {params: Promise<{slug: string}>}) {
  const {slug} = await context.params, resolved = await resolve(request, slug);
  if (resolved.error) return resolved.error;
  await resolved.db.savedResource.upsert({where: {userId_resourceId: {userId: resolved.user.id, resourceId: resolved.resource.id}}, create: {userId: resolved.user.id, resourceId: resolved.resource.id}, update: {}});
  return Response.json({saved: true});
}
export async function DELETE(request: Request, context: {params: Promise<{slug: string}>}) {
  const {slug} = await context.params, resolved = await resolve(request, slug);
  if (resolved.error) return resolved.error;
  await resolved.db.savedResource.deleteMany({where: {userId: resolved.user.id, resourceId: resolved.resource.id}});
  return Response.json({saved: false});
}
