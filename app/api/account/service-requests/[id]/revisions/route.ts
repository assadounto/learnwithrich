import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {initializePaystack, newPaymentReference} from '@/lib/server/payments/paystack';
import {jsonObject} from '@/lib/server/community/submissions';
export const dynamic = 'force-dynamic';
const uuid = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;

export async function POST(request: Request, context: {params: Promise<{id: string}>}) {
  const user = await currentUser();
  if (!user) return Response.json({error:'Sign in to request a revision.'},{status:401});
  const {id} = await context.params;
  if (!uuid.test(id)) return Response.json({error:'Service request not found.'},{status:404});
  const value = jsonObject(await request.json());
  const note = typeof value?.note === 'string' ? value.note.trim() : '';
  if (note.length < 10 || note.length > 4000) return Response.json({error:'Describe the revision in 10–4,000 characters.'},{status:400});
  const db = database();
  try {
    const created = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427652)`;
      const service = await tx.serviceRequest.findFirst({where:{id,userId:user.id},select:{id:true,status:true,currency:true,includedRevisions:true,extraRevisionPriceMinor:true,quoteMinor:true}});
      if (!service) throw new Error('NOT_FOUND');
      if (service.status !== 'ACCEPTED' || !await tx.servicePayment.findFirst({where:{serviceRequestId:id,purpose:'QUOTE',status:'PAID'},select:{id:true}})) throw new Error('QUOTE_NOT_PAID');
      const open = await tx.serviceRevision.findFirst({where:{serviceRequestId:id,status:{in:['REQUESTED','PAYMENT_PENDING','DRAFT','AWAITING_APPROVAL','CHANGES_REQUESTED']}},select:{id:true}});
      if (open) throw new Error('REVISION_IN_PROGRESS');
      const latest = await tx.serviceRevision.findFirst({where:{serviceRequestId:id},orderBy:{revisionNumber:'desc'},select:{revisionNumber:true}});
      const revisionNumber = (latest?.revisionNumber ?? 0) + 1;
      const requiresPayment = revisionNumber > service.includedRevisions;
      if (requiresPayment && service.extraRevisionPriceMinor < 1) throw new Error('NO_PAID_REVISIONS');
      const revision = await tx.serviceRevision.create({data:{serviceRequestId:id,revisionNumber,status:requiresPayment?'PAYMENT_PENDING':'REQUESTED',requesterNote:note,title:`Revision ${revisionNumber}`},select:{id:true,revisionNumber:true,status:true}});
      if (!requiresPayment) await tx.serviceRequest.update({where:{id},data:{usedIncludedRevisions:{increment:1}}});
      if (!requiresPayment) return {revision,requiresPayment:false as const};
      const payment = await tx.servicePayment.create({data:{serviceRequestId:id,serviceRevisionId:revision.id,userId:user.id,purpose:'REVISION',reference:newPaymentReference(),amountMinor:service.extraRevisionPriceMinor,currency:service.currency},select:{id:true,reference:true,amountMinor:true,currency:true}});
      return {revision,requiresPayment:true as const,payment};
    });
    if (!created.requiresPayment) return Response.json({revision:created.revision},{status:201});
    const authorizationUrl = await initializePaystack({email:user.email,amountMinor:created.payment.amountMinor,currency:created.payment.currency,reference:created.payment.reference});
    await db.servicePayment.update({where:{id:created.payment.id},data:{checkoutUrl:authorizationUrl}});
    return Response.json({revision:created.revision,authorizationUrl},{status:201,headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'NOT_FOUND') return Response.json({error:'Service request not found.'},{status:404});
    if (message === 'QUOTE_NOT_PAID') return Response.json({error:'Pay the accepted quote before requesting revisions.'},{status:409});
    if (message === 'REVISION_IN_PROGRESS') return Response.json({error:'Finish or approve the current revision before requesting another.'},{status:409});
    if (message === 'NO_PAID_REVISIONS') return Response.json({error:'The included revisions are used and extra revisions are not enabled for this request.'},{status:409});
    console.error('Could not create service revision request',error instanceof Error?error.name:'UnknownError');
    return Response.json({error:'Could not request this revision right now.'},{status:500});
  }
}
