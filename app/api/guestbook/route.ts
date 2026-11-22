import {database} from '@/lib/server/database';
import {submissionIpHash, validEmail} from '@/lib/server/community/submissions';
import {isCommunityCountry} from '@/lib/community-countries';
import {discardCommunityImage, MAX_COMMUNITY_IMAGE_BYTES, saveCommunityImage} from '@/lib/server/community/submission-image';
export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = await database().guestbookEntry.findMany({where: {status: 'APPROVED'}, orderBy: {createdAt: 'desc'}, take: 8, select: {id: true, name: true, title: true, country: true, imageAssetId: true, message: true, createdAt: true}});
  return Response.json({entries}, {headers: {'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'}});
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_COMMUNITY_IMAGE_BYTES + 512 * 1024) return Response.json({error: 'Images must be 2 MB or smaller.'}, {status: 413});
  let image: Awaited<ReturnType<typeof saveCommunityImage>> | null = null;
  try {
    const value = await request.formData();
    const field = (key: string) => typeof value.get(key) === 'string' ? String(value.get(key)).trim() : '';
    if (field('website')) return Response.json({received: true}, {status: 202});
    const name = field('name'), message = field('message'), email = field('email').toLowerCase();
    const title = field('title'), country = field('country');
    const file = value.get('image');
    if (name.length < 2 || name.length > 100 || message.length < 10 || message.length > 800 || title.length > 120 || (country && !isCommunityCountry(country)) || (email && !validEmail(email))) return Response.json({error: 'Check your name, optional title and country, message, and email address.'}, {status: 400});
    if (file !== null && !(file instanceof File)) return Response.json({error: 'Choose a valid image file.'}, {status: 400});
    if (file instanceof File && file.size > MAX_COMMUNITY_IMAGE_BYTES) return Response.json({error: 'Images must be 2 MB or smaller.'}, {status: 400});
    const db = database(), ipHash = submissionIpHash(request), since = new Date(Date.now() - 60 * 60 * 1000);
    if (ipHash && await db.guestbookEntry.count({where: {ipHash, createdAt: {gte: since}}}) >= 3) return Response.json({error: 'Please wait a while before signing again.'}, {status: 429});
    if (file instanceof File && file.size) image = await saveCommunityImage(db, file);
    await db.guestbookEntry.create({data: {name, email: email || null, title: title || null, country: country || null, imageAssetId: image?.id, message, ipHash}});
    return Response.json({received: true, message: 'Thanks for signing. Your note will appear after review.'}, {status: 201});
  } catch (error) {
    if (image) await discardCommunityImage(database(), image);
    const message = error instanceof Error ? error.message : '';
    if (/choose a jpg|images must|valid name|use an image/i.test(message)) return Response.json({error: message}, {status: 400});
    return Response.json({error: 'We could not save your note right now. Please try again.'}, {status: 500});
  }
}
