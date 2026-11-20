import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {signedMediaUrl} from '@/lib/server/media/library';
import {requireOwner} from '@/lib/server/identity/access';
export const dynamic='force-dynamic';
const uuid=/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;

export async function GET(_request:Request,context:{params:Promise<{revisionId:string;assetId:string}>}) {
  const {revisionId,assetId}=await context.params;
  if(!uuid.test(revisionId)||!uuid.test(assetId))return new Response('Not found',{status:404});
  let allowed=false;
  try {
    const user=await currentUser();
    const db=database();
    if(user){const revision=await db.serviceRevisionFile.findFirst({where:{revisionId,mediaAssetId:assetId,revision:{status:{in:['AWAITING_APPROVAL','APPROVED']},serviceRequest:{userId:user.id}}},select:{revisionId:true}});allowed=Boolean(revision);}
    if(!allowed){try{await requireOwner();allowed=true;}catch{allowed=false;}}
    if(!allowed)return new Response('Not found',{status:404});
    const file=await db.serviceRevisionFile.findUnique({where:{revisionId_mediaAssetId:{revisionId,mediaAssetId:assetId}},select:{mediaAsset:{select:{storageKey:true,originalName:true,mimeType:true}}}});
    if(!file)return new Response('Not found',{status:404});
    const url=await signedMediaUrl(file.mediaAsset.storageKey,file.mediaAsset.originalName,file.mediaAsset.mimeType,'attachment',60);
    return new Response(null,{status:302,headers:{Location:url,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
  }catch{return new Response('File delivery is temporarily unavailable.',{status:503});}
}
