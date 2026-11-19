import {identity, identityReady} from '@/lib/server/identity';
import {NextResponse} from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
async function handler(request: Request) {
  if (!identityReady()) return NextResponse.json({error: 'Sign-in is not configured yet.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  try { return await identity().handler(request); }
  catch { return NextResponse.json({error: 'Sign-in is temporarily unavailable.'}, {status: 503, headers: {'Cache-Control': 'no-store'}}); }
}
export const GET = handler;
export const POST = handler;
