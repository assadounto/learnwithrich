import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {jsonObject} from '@/lib/server/community/submissions';
export const dynamic = 'force-dynamic';

export async function GET() {
  const reviews = await database().review.findMany({where: {status: 'APPROVED'}, orderBy: {createdAt: 'desc'}, take: 6, select: {id: true, displayName: true, message: true, rating: true, createdAt: true}});
  return Response.json({reviews}, {headers: {'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'}});
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({error: 'Sign in to leave a review.'}, {status: 401});
  try {
    const value = jsonObject(await request.json());
    if (!value) return Response.json({error: 'Check the review and try again.'}, {status: 400});
    const displayName = typeof value.displayName === 'string' ? value.displayName.trim() : '';
    const message = typeof value.message === 'string' ? value.message.trim() : '';
    const rating = Number(value.rating);
    if (displayName.length < 2 || displayName.length > 100 || message.length < 15 || message.length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({error: 'Add a name, a rating from 1 to 5, and a review between 15 and 1000 characters.'}, {status: 400});
    await database().review.upsert({where: {userId: user.id}, create: {userId: user.id, displayName, message, rating}, update: {displayName, message, rating, status: 'PENDING'}});
    return Response.json({received: true, message: 'Thanks for sharing. Your review will appear after approval.'}, {status: 201});
  } catch {return Response.json({error: 'We could not save your review right now. Please try again.'}, {status: 500});}
}
