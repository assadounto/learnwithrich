import {database} from '@/lib/server/database';
import {CommunityInbox} from '@/components/admin/community-inbox';
export const dynamic = 'force-dynamic';
export default async function GuestbookAdmin() {
  const rows = await database().guestbookEntry.findMany({orderBy: {createdAt: 'desc'}, take: 100, select: {id:true,status:true,createdAt:true,name:true,email:true,title:true,country:true,imageAssetId:true,message:true}});
  return <CommunityInbox kind="guestbook" initialRows={rows.map(row=>({...row,createdAt:row.createdAt.toISOString()}))}/>;
}
