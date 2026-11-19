import {database} from '@/lib/server/database';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await database().resource.count();
    await database().user.count();
    return Response.json({status: 'ready'}, {headers: {'Cache-Control': 'no-store'}});
  } catch {
    return Response.json({status: 'unavailable'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
