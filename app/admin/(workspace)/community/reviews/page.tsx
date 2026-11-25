import {CommunityInboxPage, type InboxParams} from '@/components/admin/community-inbox-page';

export const dynamic = 'force-dynamic';

export default function ReviewsAdmin({searchParams}: {searchParams: Promise<InboxParams>}) {
  return <CommunityInboxPage kind="reviews" searchParams={searchParams}/>;
}
