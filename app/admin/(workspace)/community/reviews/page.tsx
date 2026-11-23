import {database} from '@/lib/server/database';
import {CommunityInbox} from '@/components/admin/community-inbox';
export const dynamic = 'force-dynamic';
export default async function ReviewsAdmin() {
  const rows = await database().review.findMany({orderBy: {createdAt: 'desc'}, take: 100, select: {id:true,status:true,createdAt:true,displayName:true,title:true,country:true,imageAssetId:true,message:true,rating:true}});
  return <CommunityInbox kind="reviews" initialRows={rows.map(row=>({...row,name:row.displayName,createdAt:row.createdAt.toISOString()}))}/>;
}
