import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {jsonObject} from '@/lib/server/community/submissions';
export const dynamic = 'force-dynamic';
const uuid = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;

export async function PATCH(request: Request, context: {params: Promise<{id: string}>}) {
  try {await requireOwner();} catch {return Response.json({error:'Sign in to the creator studio.'},{status:401});}
  const {id} = await context.params;
  if (!uuid.test(id)) return Response.json({error:'Service request not found.'},{status:404});
  const value = jsonObject(await request.json());
  const action = value?.action;
  if (action === 'CREATE_INITIAL_DRAFT') {
    try {
      const db = database();
      const service = await db.serviceRequest.findFirst({where:{id,status:'ACCEPTED',payments:{some:{purpose:'QUOTE',status:'PAID'}}},select:{id:true}});
      if (!service) return Response.json({error:'The paid project is not ready for delivery yet.'},{status:409});
      const revision = await db.serviceRevision.create({data:{serviceRequestId:id,revisionNumber:0,status:'DRAFT',title:'Initial delivery'},select:{id:true,revisionNumber:true,status:true}});
      return Response.json({revision},{status:201});
    } catch {return Response.json({error:'An initial delivery draft already exists.'},{status:409});}
  }
  const revisionId = typeof value?.revisionId === 'string' ? value.revisionId : '';
  const title = typeof value?.title === 'string' ? value.title.trim() : '';
  const summary = typeof value?.summary === 'string' ? value.summary.trim() : '';
  const changesMade = typeof value?.changesMade === 'string' ? value.changesMade.trim() : '';
  const mediaAssetIds = Array.isArray(value?.mediaAssetIds) ? value.mediaAssetIds.filter((asset): asset is string => typeof asset === 'string') : [];
  if (!uuid.test(revisionId) || !['SAVE_DRAFT','SEND_FOR_APPROVAL'].includes(String(action)) || title.length < 3 || title.length > 180 || summary.length > 5000 || changesMade.length > 10000 || mediaAssetIds.length > 12 || mediaAssetIds.some(asset => !uuid.test(asset)) || new Set(mediaAssetIds).size !== mediaAssetIds.length) return Response.json({error:'Check the revision title, update notes and attached files.'},{status:400});
  if (action === 'SEND_FOR_APPROVAL' && (summary.length < 10 || changesMade.length < 10)) return Response.json({error:'Add a clear delivery summary and describe what changed before sending this revision.'},{status:400});
  try {
    const db = database();
    const revision = await db.serviceRevision.findFirst({where:{id:revisionId,serviceRequestId:id,status:{in:['REQUESTED','CHANGES_REQUESTED','DRAFT']}},select:{id:true}});
    if (!revision) return Response.json({error:'This revision is no longer editable.'},{status:409});
    if (mediaAssetIds.length) {
      const assets = await db.mediaAsset.findMany({where:{id:{in:mediaAssetIds}},select:{id:true}});
      if (assets.length !== mediaAssetIds.length) return Response.json({error:'One or more attached files are no longer available.'},{status:400});
    }
    const updated = await db.$transaction(async tx => {
      const item = await tx.serviceRevision.update({where:{id:revisionId},data:{title,summary,changesMade,status:action==='SEND_FOR_APPROVAL'?'AWAITING_APPROVAL':'DRAFT',submittedAt:action==='SEND_FOR_APPROVAL'?new Date():undefined,files:{deleteMany:{},create:mediaAssetIds.map((mediaAssetId,position)=>({position,mediaAsset:{connect:{id:mediaAssetId}}}))}},select:{id:true,status:true,revisionNumber:true,updatedAt:true}});
      return item;
    });
    return Response.json({revision:updated});
  } catch {return Response.json({error:'Could not save this revision.'},{status:500});}
}
