import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {jsonObject, submissionIpHash, validEmail} from '@/lib/server/community/submissions';
export const dynamic = 'force-dynamic';
const currencies = ['GHS','USD','GBP','EUR'];
const services = ['THESIS_SUPPORT','SOFTWARE_PROJECT','ELECTRONICS_PROJECT','CAPSTONE','CONSULTING','OTHER'];

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({error: 'Sign in to create a service request.'}, {status: 401});
  try {
    const value = jsonObject(await request.json());
    if (!value) return Response.json({error: 'Check the form fields and try again.'}, {status: 400});
    if (typeof value.website === 'string' && value.website.trim()) return Response.json({received: true}, {status: 202});
    // Requester identity always comes from the authenticated account, never the browser payload.
    const name = user.name.trim();
    const email = user.email.trim().toLowerCase();
    const phone = typeof value.phone === 'string' ? value.phone.trim().replace(/\s+/g, ' ') : '';
    const description = typeof value.description === 'string' ? value.description.trim() : '';
    const serviceType = typeof value.serviceType === 'string' ? value.serviceType : '';
    const timeline = typeof value.timeline === 'string' ? value.timeline.trim().slice(0, 160) : '';
    const currency = typeof value.currency === 'string' ? value.currency.toUpperCase() : 'GHS';
    const budgetText = typeof value.budget === 'string' ? value.budget.trim() : '';
    let budgetMinor: number | null = null;
    if (budgetText) {
      if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(budgetText)) return Response.json({error: 'Enter a budget using up to two decimal places.'}, {status: 400});
      budgetMinor = Math.round(Number(budgetText) * 100);
      if (!Number.isSafeInteger(budgetMinor) || budgetMinor < 1 || budgetMinor > 2147483647) return Response.json({error: 'Enter a valid project budget.'}, {status: 400});
    }
    if (name.length < 2 || name.length > 120 || !validEmail(email) || phone.length < 7 || phone.length > 32 || !/^[+\d][\d\s().-]{5,30}$/.test(phone) || description.length < 50 || description.length > 6000 || !services.includes(serviceType) || !currencies.includes(currency)) return Response.json({error: 'Add a valid phone number, service type, and a project description between 50 and 6000 characters.'}, {status: 400});
    const db = database(), ipHash = submissionIpHash(request), since = new Date(Date.now() - 60 * 60 * 1000);
    if (ipHash && await db.serviceRequest.count({where: {ipHash, createdAt: {gte: since}}}) >= 4) return Response.json({error: 'Please wait a while before sending another request.'}, {status: 429});
    const item = await db.serviceRequest.create({data: {requesterName: name, requesterEmail: email, requesterPhone: phone, serviceType, description, budgetMinor, currency, timeline: timeline || null, ipHash, userId: user.id}, select: {id: true}});
    return Response.json({received: true, requestCode: item.id.slice(0, 8).toUpperCase(), message: 'Your request is in the queue. Track the quote, payment, and revisions from your account.'}, {status: 201});
  } catch {return Response.json({error: 'We could not save your request right now. Please try again.'}, {status: 500});}
}
