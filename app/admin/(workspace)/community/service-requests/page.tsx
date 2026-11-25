import {CommunityInboxPage, type InboxParams} from '@/components/admin/community-inbox-page';

export const dynamic = 'force-dynamic';

export default function ServiceRequestsAdmin({searchParams}: {searchParams: Promise<InboxParams>}) {
  return <CommunityInboxPage kind="service-requests" searchParams={searchParams}/>;
}
