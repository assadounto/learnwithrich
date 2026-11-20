import {database} from '@/lib/server/database';
import {jsonObject, submissionIpHash, validEmail} from '@/lib/server/community/submissions';
export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = await database().guestbookEntry.findMany({where: {status: 'APPROVED'}, orderBy: {createdAt: 'desc'}, take: 8, select: {id: true, name: true, message: true, createdAt: true}});
  return Response.json({entries}, {headers: {'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'}});
}

export async function POST(request: Request) {
  try {
    const value = jsonObject(await request.json());
    if (!value) return Response.json({error: 'Check the form fields and try again.'}, {status: 400});
    if (typeof value.website === 'string' && value.website.trim()) return Response.json({received: true}, {status: 202});
    const name = typeof value.name === 'string' ? value.name.trim() : '';
    const message = typeof value.message === 'string' ? value.message.trim() : '';
    const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : '';
    if (name.length < 2 || name.length > 100 || message.length < 10 || message.length > 800 || (email && !validEmail(email))) return Response.json({error: 'Add your name and a message between 10 and 800 characters. Check the email address if you included one.'}, {status: 400});
    const db = database(), ipHash = submissionIpHash(request), since = new Date(Date.now() - 60 * 60 * 1000);
    if (ipHash && await db.guestbookEntry.count({where: {ipHash, createdAt: {gte: since}}}) >= 3) return Response.json({error: 'Please wait a while before signing again.'}, {status: 429});
    await db.guestbookEntry.create({data: {name, email: email || null, message, ipHash}});
    return Response.json({received: true, message: 'Thanks for signing. Your note will appear after review.'}, {status: 201});
  } catch {return Response.json({error: 'We could not save your note right now. Please try again.'}, {status: 500});}
}
