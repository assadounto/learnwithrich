import {database} from '@/lib/server/database';
import {CommunityInbox} from '@/components/admin/community-inbox';
export const dynamic = 'force-dynamic';
export default async function ServiceRequestsAdmin() {
  const rows = await database().serviceRequest.findMany({orderBy: {createdAt: 'desc'}, take: 100, select: {id:true,status:true,createdAt:true,requesterName:true,requesterEmail:true,serviceType:true,description:true,budgetMinor:true,currency:true,timeline:true,quoteMinor:true,quoteNote:true}});
  const fresh = rows.filter(row=>row.status==='NEW').length;
  return <><header className="admin-page-heading"><div><span className="admin-kicker">WORK WITH RICH</span><h1>Service requests</h1><p>Review project briefs, discuss a scope and prepare a quote for the requester.</p></div><span className="community-admin-count">{fresh} new</span></header><CommunityInbox kind="service-requests" initialRows={rows.map(row=>({...row,name:row.requesterName,email:row.requesterEmail,createdAt:row.createdAt.toISOString()}))}/></>;
}
