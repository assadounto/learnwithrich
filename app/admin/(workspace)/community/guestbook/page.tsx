import {database} from '@/lib/server/database';
import {CommunityInbox} from '@/components/admin/community-inbox';
export const dynamic = 'force-dynamic';
export default async function GuestbookAdmin() {
  const rows = await database().guestbookEntry.findMany({orderBy: {createdAt: 'desc'}, take: 100, select: {id:true,status:true,createdAt:true,name:true,email:true,message:true}});
  const pending = rows.filter(row=>row.status==='PENDING').length;
  return <><header className="admin-page-heading"><div><span className="admin-kicker">COMMUNITY</span><h1>Guest book</h1><p>Review public notes before they appear on the home page. Contact emails stay private.</p></div><span className="community-admin-count">{pending} pending</span></header><CommunityInbox kind="guestbook" initialRows={rows.map(row=>({...row,createdAt:row.createdAt.toISOString()}))}/></>;
}
