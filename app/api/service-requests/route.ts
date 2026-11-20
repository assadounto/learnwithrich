import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {jsonObject, submissionIpHash, validEmail} from '@/lib/server/community/submissions';
export const dynamic = 'force-dynamic';
const currencies = ['GHS','USD','GBP','EUR'];
const services = ['THESIS_SUPPORT','SOFTWARE_PROJECT','ELECTRONICS_PROJECT','CAPSTONE','CONSULTING','OTHER'];

export async function POST(request: Request) {
  try {
    const value = jsonObject(await request.json());
    if (!value) return Response.json({error: 'Check the form fields and try again.'}, {status: 400});
    if (typeof value.website === 'string' && value.website.trim()) return Response.json({received: true}, {status: 202});
    const name = typeof value.name === 'string' ? value.name.trim() : '';
    const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : '';
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
    if (name.length < 2 || name.length > 120 || !validEmail(email) || description.length < 50 || description.length > 6000 || !services.includes(serviceType) || !currencies.includes(currency)) return Response.json({error: 'Add your name, a valid email, service type, and a project description between 50 and 6000 characters.'}, {status: 400});
    const db = database(), ipHash = submissionIpHash(request), since = new Date(Date.now() - 60 * 60 * 1000);
    if (ipHash && await db.serviceRequest.count({where: {ipHash, createdAt: {gte: since}}}) >= 4) return Response.json({error: 'Please wait a while before sending another request.'}, {status: 429});
    const user = await currentUser();
    const item = await db.serviceRequest.create({data: {requesterName: name, requesterEmail: email, serviceType, description, budgetMinor, currency, timeline: timeline || null, ipHash, userId: user?.id ?? null}, select: {id: true}});
    return Response.json({received: true, requestCode: item.id.slice(0, 8).toUpperCase(), message: 'Your request is in the queue. Rich will review the details and follow up using the email you provided.'}, {status: 201});
  } catch {return Response.json({error: 'We could not save your request right now. Please try again.'}, {status: 500});}
}
