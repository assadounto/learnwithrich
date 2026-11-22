import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {isCommunityCountry} from '@/lib/community-countries';
import {discardCommunityImage, MAX_COMMUNITY_IMAGE_BYTES, saveCommunityImage} from '@/lib/server/community/submission-image';
export const dynamic = 'force-dynamic';

export async function GET() {
  const reviews = await database().review.findMany({where: {status: 'APPROVED'}, orderBy: {createdAt: 'desc'}, take: 6, select: {id: true, displayName: true, title: true, country: true, imageAssetId: true, message: true, rating: true, createdAt: true}});
  return Response.json({reviews}, {headers: {'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'}});
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({error: 'Sign in to leave a review.'}, {status: 401});
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_COMMUNITY_IMAGE_BYTES + 512 * 1024) return Response.json({error: 'Images must be 2 MB or smaller.'}, {status: 413});
  let image: Awaited<ReturnType<typeof saveCommunityImage>> | null = null;
  try {
    const value = await request.formData();
    const field = (key: string) => typeof value.get(key) === 'string' ? String(value.get(key)).trim() : '';
    const displayName = field('displayName'), message = field('message'), title = field('title'), country = field('country');
    const rating = Number(field('rating'));
    const file = value.get('image');
    if (displayName.length < 2 || displayName.length > 100 || message.length < 15 || message.length > 1000 || title.length > 120 || (country && !isCommunityCountry(country)) || !Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({error: 'Check your name, optional title and country, rating, and review.'}, {status: 400});
    if (file !== null && !(file instanceof File)) return Response.json({error: 'Choose a valid image file.'}, {status: 400});
    if (file instanceof File && file.size > MAX_COMMUNITY_IMAGE_BYTES) return Response.json({error: 'Images must be 2 MB or smaller.'}, {status: 400});
    const db = database();
    if (file instanceof File && file.size) image = await saveCommunityImage(db, file);
    await db.review.upsert({where: {userId: user.id}, create: {userId: user.id, displayName, title: title || null, country: country || null, imageAssetId: image?.id, message, rating}, update: {displayName, title: title || null, country: country || null, imageAssetId: image?.id, message, rating, status: 'PENDING'}});
    return Response.json({received: true, message: 'Thanks for sharing. Your review will appear after approval.'}, {status: 201});
  } catch (error) {
    if (image) await discardCommunityImage(database(), image);
    const message = error instanceof Error ? error.message : '';
    if (/choose a jpg|images must|valid name|use an image/i.test(message)) return Response.json({error: message}, {status: 400});
    return Response.json({error: 'We could not save your review right now. Please try again.'}, {status: 500});
  }
}
