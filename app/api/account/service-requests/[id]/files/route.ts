import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {MAX_MEDIA_BYTES, deleteMediaObject, saveMedia} from '@/lib/server/media/library';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const uuid=/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
const MAX_FILES=20;

export async function POST(request:Request,context:{params:Promise<{id:string}>}) {
  const user=await currentUser();
  if(!user)return Response.json({error:'Sign in to attach files to your request.'},{status:401});
  const {id}=await context.params;
  if(!uuid.test(id))return Response.json({error:'Service request not found.'},{status:404});
  const contentLength=Number(request.headers.get('content-length')||0);
  if(contentLength>MAX_MEDIA_BYTES+1024*1024)return Response.json({error:'Each file must be 50 MB or smaller.'},{status:413});
  const db=database();
  let asset:Awaited<ReturnType<typeof saveMedia>>|null=null;
  try {
    const form=await request.formData();
    const file=form.get('file');
    if(!(file instanceof File))return Response.json({error:'Choose a file to upload.'},{status:400});
    asset=await saveMedia(db,file,null);
    const attached=await db.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427654)`;
      const service=await tx.serviceRequest.findFirst({where:{id,userId:user.id},select:{id:true,status:true}});
      if(!service)throw new Error('NOT_FOUND');
      if(['DECLINED','COMPLETED'].includes(service.status))throw new Error('CLOSED');
      const count=await tx.serviceRequestFile.count({where:{serviceRequestId:id}});
      if(count>=MAX_FILES)throw new Error('LIMIT');
      return tx.serviceRequestFile.create({data:{serviceRequestId:id,mediaAssetId:asset!.id,position:count},select:{mediaAsset:{select:{id:true,originalName:true,mimeType:true,sizeBytes:true}}}});
    });
    return Response.json({file:attached.mediaAsset},{status:201,headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    if(asset){const stored=await db.mediaAsset.findUnique({where:{id:asset.id},select:{storageKey:true}}).catch(()=>null);if(stored)await deleteMediaObject(stored.storageKey).catch(()=>undefined);await db.mediaAsset.delete({where:{id:asset.id}}).catch(()=>undefined);}
    const message=error instanceof Error?error.message:'';
    if(message==='NOT_FOUND')return Response.json({error:'Service request not found.'},{status:404});
    if(message==='CLOSED')return Response.json({error:'Files can’t be added to a closed request.'},{status:409});
    if(message==='LIMIT')return Response.json({error:`A request can have up to ${MAX_FILES} files.`},{status:409});
    const friendly=error instanceof Error?error.message:'Could not upload this file.';
    const status=/must be|use an image|choose a file|valid name/i.test(friendly)?400:500;
    return Response.json({error:friendly},{status});
  }
}
