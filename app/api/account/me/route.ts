import {currentUser} from '@/lib/server/identity/current-user';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({user: await currentUser()}, {headers: {'Cache-Control': 'private, no-store'}});
}
