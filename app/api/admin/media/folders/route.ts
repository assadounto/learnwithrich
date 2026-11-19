import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try { await requireOwner(); } catch { return Response.json({error: 'Sign in to the creator studio.'}, {status: 401}); }
  try {
    const input = await request.json();
    const name = typeof input?.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
    if (!name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name)) return Response.json({error: 'Folder names must be 1–80 characters.'}, {status: 400});
    const folder = await database().mediaFolder.create({data: {name}, select: {_count: {select: {assets: true}}, createdAt: true, id: true, name: true}});
    return Response.json({folder}, {status: 201, headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return Response.json({error: 'A folder with this name already exists.'}, {status: 409});
    return Response.json({error: 'Could not create this folder.'}, {status: 500});
  }
}
