import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {initializePaystack, newPaymentReference} from '@/lib/server/payments/paystack';
export const dynamic = 'force-dynamic';
const uuid = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;

export async function POST(request: Request, context: {params: Promise<{id: string}>}) {
  const user = await currentUser();
  if (!user) return Response.json({error: 'Sign in to pay for this service.'}, {status: 401});
  const {id} = await context.params;
  if (!uuid.test(id)) return Response.json({error: 'Service request not found.'}, {status: 404});
  let input: Record<string, unknown>;
  try {input = await request.json();} catch {return Response.json({error: 'Invalid checkout request.'}, {status: 400});}
  const db = database();
  try {
    const requestRow = await db.serviceRequest.findFirst({where: {id, userId: user.id}, select: {id: true,status: true,quoteMinor: true,currency: true}});
    if (!requestRow) return Response.json({error: 'Service request not found.'}, {status: 404});
    let purpose: 'QUOTE'|'REVISION', serviceRevisionId: string|null = null, amountMinor: number;
    if (input.purpose === 'QUOTE') {
      purpose = 'QUOTE';
      if (!['QUOTED','PAYMENT_PENDING'].includes(requestRow.status) || !requestRow.quoteMinor || requestRow.quoteMinor < 1) return Response.json({error: 'There is no payable quote for this request yet.'}, {status: 409});
      const settled = await db.servicePayment.findFirst({where: {serviceRequestId: id,purpose:'QUOTE',status:'PAID'},select:{id:true}});
      if (settled) return Response.json({error:'This quote has already been paid.'},{status:409});
      amountMinor = requestRow.quoteMinor;
    } else if (input.purpose === 'REVISION' && typeof input.revisionId === 'string' && uuid.test(input.revisionId)) {
      purpose = 'REVISION'; serviceRevisionId = input.revisionId;
      const revision = await db.serviceRevision.findFirst({where:{id:serviceRevisionId,serviceRequestId:id,status:'PAYMENT_PENDING',payment:{is:{status:'PENDING'}}},select:{id:true,serviceRequest:{select:{extraRevisionPriceMinor:true,currency:true}}}});
      if (!revision || revision.serviceRequest.extraRevisionPriceMinor < 1) return Response.json({error:'This revision is not waiting for payment.'},{status:409});
      amountMinor = revision.serviceRequest.extraRevisionPriceMinor;
    } else return Response.json({error:'Choose a valid service payment.'},{status:400});

    let payment = await db.servicePayment.findFirst({where:{serviceRequestId:id,purpose,serviceRevisionId,status:'PENDING'},orderBy:{createdAt:'desc'}});
    if (!payment) payment = await db.servicePayment.create({data:{serviceRequestId:id,serviceRevisionId,userId:user.id,purpose,reference:newPaymentReference(),amountMinor,currency:requestRow.currency}});
    else if (payment.amountMinor !== amountMinor || payment.currency !== requestRow.currency) payment = await db.servicePayment.update({where:{id:payment.id},data:{amountMinor,currency:requestRow.currency,checkoutUrl:null}});
    const authorizationUrl = payment.checkoutUrl || await initializePaystack({email:user.email,amountMinor:payment.amountMinor,currency:payment.currency,reference:payment.reference});
    await db.servicePayment.updateMany({where:{id:payment.id,status:'PENDING'},data:{checkoutUrl:authorizationUrl}});
    return Response.json({authorizationUrl},{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    console.error('Paystack service checkout initialization failed',error instanceof Error?error.name:'UnknownError');
    return Response.json({error:'Checkout is temporarily unavailable. Please try again.'},{status:503});
  }
}
