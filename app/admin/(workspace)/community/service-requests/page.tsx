import {database} from '@/lib/server/database';
import {CommunityInbox} from '@/components/admin/community-inbox';
export const dynamic = 'force-dynamic';
export default async function ServiceRequestsAdmin() {
  const rows = await database().serviceRequest.findMany({orderBy: {createdAt: 'desc'}, take: 100, select: {id:true,status:true,createdAt:true,requesterName:true,requesterEmail:true,requesterPhone:true,serviceType:true,description:true,budgetMinor:true,currency:true,timeline:true,quoteMinor:true,quoteNote:true,includedRevisions:true,extraRevisionPriceMinor:true,files:{orderBy:{position:'asc'},select:{mediaAsset:{select:{id:true,originalName:true,mimeType:true,sizeBytes:true}}}},revisions:{orderBy:{revisionNumber:'asc'},select:{id:true,revisionNumber:true,status:true,title:true,summary:true,changesMade:true,requesterNote:true,requesterFeedback:true,files:{orderBy:{position:'asc'},select:{mediaAsset:{select:{id:true,originalName:true,mimeType:true,sizeBytes:true}}}}}}}});
  return <CommunityInbox kind="service-requests" initialRows={rows.map(row=>({...row,name:row.requesterName,email:row.requesterEmail,phone:row.requesterPhone ?? undefined,createdAt:row.createdAt.toISOString()}))}/>;
}
