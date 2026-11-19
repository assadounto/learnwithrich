import {currentUser} from '@/lib/server/identity/current-user';
export const dynamic = 'force-dynamic';
export async function GET() {const user = await currentUser(); return user ? Response.json({user}, {headers: {'Cache-Control': 'no-store'}}) : Response.json({user: null}, {status: 401, headers: {'Cache-Control': 'no-store'}});}
