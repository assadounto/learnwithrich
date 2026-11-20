import {database} from '@/lib/server/database';
import {CommunityInbox} from '@/components/admin/community-inbox';
export const dynamic = 'force-dynamic';
export default async function ReviewsAdmin() {
  const rows = await database().review.findMany({orderBy: {createdAt: 'desc'}, take: 100, select: {id:true,status:true,createdAt:true,displayName:true,message:true,rating:true}});
  const pending = rows.filter(row=>row.status==='PENDING').length;
  return <><header className="admin-page-heading"><div><span className="admin-kicker">COMMUNITY</span><h1>Learner reviews</h1><p>Approve reviews to feature them on the public home page. Reviews require a learner account.</p></div><span className="community-admin-count">{pending} pending</span></header><CommunityInbox kind="reviews" initialRows={rows.map(row=>({...row,name:row.displayName,createdAt:row.createdAt.toISOString()}))}/></>;
}
