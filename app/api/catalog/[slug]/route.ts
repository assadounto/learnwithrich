import {NextResponse} from 'next/server';
import {resources} from '@/lib/server/resources';
import {ResourceInputError} from '@/lib/server/resources/validation';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, {params}: {params: Promise<{slug: string}>}) {
  try {
    const item = await resources().getPublic((await params).slug);
    return NextResponse.json(item ? {item} : {error: 'Resource not found.'}, {status: item ? 200 : 404, headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    if (error instanceof ResourceInputError) return NextResponse.json({error: 'Resource not found.'}, {status: 404});
    console.error('Resource unavailable', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({error: 'This resource is temporarily unavailable.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
