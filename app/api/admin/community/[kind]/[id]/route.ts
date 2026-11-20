import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {jsonObject} from '@/lib/server/community/submissions';
export const dynamic = 'force-dynamic';
const idPattern = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;

export async function PATCH(request: Request, context: {params: Promise<{kind: string; id: string}>}) {
  try {await requireOwner();} catch {return Response.json({error: 'Sign in to the creator studio.'}, {status: 401});}
  const {kind, id} = await context.params;
  if (!idPattern.test(id)) return Response.json({error: 'Not found.'}, {status: 404});
  const value = jsonObject(await request.json());
  if (!value) return Response.json({error: 'Invalid update.'}, {status: 400});
  const db = database();
  try {
    if (kind === 'guestbook' || kind === 'reviews') {
      if (!['PENDING','APPROVED','HIDDEN'].includes(String(value.status))) return Response.json({error: 'Choose a valid moderation status.'}, {status: 400});
      const data = {status: value.status as 'PENDING'|'APPROVED'|'HIDDEN'};
      if (kind === 'guestbook') await db.guestbookEntry.update({where: {id}, data});
      else await db.review.update({where: {id}, data});
    } else if (kind === 'service-requests') {
      const statuses = ['NEW','REVIEWING','QUOTED','ACCEPTED','DECLINED','COMPLETED'] as const;
      if (!statuses.includes(value.status as typeof statuses[number])) return Response.json({error: 'Choose a valid request status.'}, {status: 400});
      const quoteMinor = value.quoteMinor == null || value.quoteMinor === '' ? null : Number(value.quoteMinor);
      if (quoteMinor != null && (!Number.isSafeInteger(quoteMinor) || quoteMinor < 0 || quoteMinor > 2147483647)) return Response.json({error: 'Enter a valid quote amount.'}, {status: 400});
      const quoteNote = typeof value.quoteNote === 'string' ? value.quoteNote.trim() : '';
      if (quoteNote.length > 5000) return Response.json({error: 'Quote notes must be 5,000 characters or fewer.'}, {status: 400});
      const includedRevisions = value.includedRevisions == null ? undefined : Number(value.includedRevisions);
      const extraRevisionPriceMinor = value.extraRevisionPriceMinor == null || value.extraRevisionPriceMinor === '' ? undefined : Number(value.extraRevisionPriceMinor);
      if (includedRevisions != null && (!Number.isSafeInteger(includedRevisions) || includedRevisions < 0 || includedRevisions > 50)) return Response.json({error: 'Set between 0 and 50 included revisions.'}, {status: 400});
      if (extraRevisionPriceMinor != null && (!Number.isSafeInteger(extraRevisionPriceMinor) || extraRevisionPriceMinor < 0 || extraRevisionPriceMinor > 2147483647)) return Response.json({error: 'Enter a valid price per extra revision.'}, {status: 400});
      const existing = await db.serviceRequest.findUnique({where:{id},select:{userId:true,status:true,quoteMinor:true,includedRevisions:true,extraRevisionPriceMinor:true}});
      if (value.status === 'ACCEPTED' && existing?.status !== 'ACCEPTED') return Response.json({error:'A service becomes active only after Paystack confirms the quote payment.'},{status:409});
      if (existing?.status === 'ACCEPTED' && value.status !== 'ACCEPTED' && value.status !== 'COMPLETED') return Response.json({error:'A paid project can only remain in progress or be marked complete.'},{status:409});
      const quotePaid = await db.servicePayment.findFirst({where:{serviceRequestId:id,purpose:'QUOTE',status:'PAID'},select:{id:true}});
      if (quotePaid && (quoteMinor !== existing?.quoteMinor || (includedRevisions != null && includedRevisions !== existing?.includedRevisions) || (extraRevisionPriceMinor != null && extraRevisionPriceMinor !== existing?.extraRevisionPriceMinor))) return Response.json({error:'The paid quote and revision terms are locked after payment.'},{status:409});
      if (value.status === 'QUOTED' && (!quoteMinor || quoteMinor < 1 || !existing?.userId)) return Response.json({error:'A quote amount and signed-in requester are required before sending a payable quote.'},{status:400});
      await db.serviceRequest.update({where: {id}, data: {status: value.status as typeof statuses[number], quoteMinor, quoteNote: quoteNote || null, ...(includedRevisions == null ? {} : {includedRevisions}), ...(extraRevisionPriceMinor == null ? {} : {extraRevisionPriceMinor}), quotedAt: value.status === 'QUOTED' ? new Date() : undefined}});
    } else return Response.json({error: 'Unknown community section.'}, {status: 404});
    return Response.json({saved: true});
  } catch {return Response.json({error: 'Could not update this item.'}, {status: 404});}
}
