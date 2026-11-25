import {CommunityInboxPage, type InboxParams} from '@/components/admin/community-inbox-page';

export const dynamic = 'force-dynamic';

export default function GuestbookAdmin({searchParams}: {searchParams: Promise<InboxParams>}) {
  return <CommunityInboxPage kind="guestbook" searchParams={searchParams}/>;
}
