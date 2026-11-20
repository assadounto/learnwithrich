import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {jsonObject} from '@/lib/server/community/submissions';
export const dynamic = 'force-dynamic';
const uuid = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;

export async function PATCH(request: Request, context: {params: Promise<{id:string;revisionId:string}>}) {
  const user = await currentUser();
  if (!user) return Response.json({error:'Sign in to review this update.'},{status:401});
  const {id,revisionId} = await context.params;
  if (!uuid.test(id)||!uuid.test(revisionId)) return Response.json({error:'Revision not found.'},{status:404});
  const value = jsonObject(await request.json());
  const action = value?.action;
  const feedback = typeof value?.feedback === 'string' ? value.feedback.trim() : '';
  if (action === 'REQUEST_CHANGES' && (feedback.length < 10 || feedback.length > 4000)) return Response.json({error:'Tell Rich what needs another look (10–4,000 characters).'}, {status:400});
  if (!['APPROVE','REQUEST_CHANGES'].includes(String(action))) return Response.json({error:'Choose approve or request changes.'},{status:400});
  const db = database();
  const revision = await db.serviceRevision.findFirst({where:{id:revisionId,serviceRequestId:id,serviceRequest:{userId:user.id},status:'AWAITING_APPROVAL'},select:{id:true}});
  if (!revision) return Response.json({error:'This revision is not waiting for your approval.'},{status:409});
  await db.serviceRevision.update({where:{id:revisionId},data:action==='APPROVE'?{status:'APPROVED',approvedAt:new Date()}:{status:'CHANGES_REQUESTED',requesterFeedback:feedback}});
  return Response.json({saved:true});
}
