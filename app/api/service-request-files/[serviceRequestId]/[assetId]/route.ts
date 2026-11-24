import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {signedMediaUrl} from '@/lib/server/media/library';
import {requireOwner} from '@/lib/server/identity/access';
export const dynamic='force-dynamic';
const uuid=/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;

export async function GET(request:Request,context:{params:Promise<{serviceRequestId:string;assetId:string}>}) {
  const {serviceRequestId,assetId}=await context.params;
  if(!uuid.test(serviceRequestId)||!uuid.test(assetId))return new Response('Not found',{status:404});
  const db=database();let allowed=false;
  try {
    const user=await currentUser();
    if(user)allowed=Boolean(await db.serviceRequestFile.findFirst({where:{serviceRequestId,mediaAssetId:assetId,serviceRequest:{userId:user.id}},select:{mediaAssetId:true}}));
    if(!allowed){try{await requireOwner();allowed=true;}catch{allowed=false;}}
    if(!allowed)return new Response('Not found',{status:404});
    const attachment=await db.serviceRequestFile.findUnique({where:{serviceRequestId_mediaAssetId:{serviceRequestId,mediaAssetId:assetId}},select:{mediaAsset:{select:{storageKey:true,originalName:true,mimeType:true}}}});
    if(!attachment)return new Response('Not found',{status:404});
    const location=await signedMediaUrl(attachment.mediaAsset.storageKey,attachment.mediaAsset.originalName,attachment.mediaAsset.mimeType,
      new URL(request.url).searchParams.has('play') && attachment.mediaAsset.mimeType.startsWith('audio/') ? 'inline' : 'attachment',60);
    return new Response(null,{status:302,headers:{Location:location,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
  } catch {return new Response('File delivery is temporarily unavailable.',{status:503});}
}
