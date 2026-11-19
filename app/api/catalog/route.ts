import {NextResponse} from 'next/server';
import {resources} from '@/lib/server/resources';
import {ResourceInputError} from '@/lib/server/resources/validation';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    return NextResponse.json(await resources().listPublic(new URL(request.url).searchParams), {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    if (error instanceof ResourceInputError) return NextResponse.json({error: error.message}, {status: 400});
    console.error('Resource catalog unavailable', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({error: 'The resource catalog is temporarily unavailable.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
