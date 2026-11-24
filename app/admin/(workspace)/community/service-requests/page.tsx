import type {Prisma} from '@/lib/generated/prisma/client';
import {database} from '@/lib/server/database';
import {CommunityInbox} from '@/components/admin/community-inbox';

export const dynamic = 'force-dynamic';
const select = {id:true,status:true,createdAt:true,requesterName:true,requesterEmail:true,requesterPhone:true,serviceType:true,description:true,budgetMinor:true,currency:true,timeline:true,quoteMinor:true,quoteNote:true,includedRevisions:true,extraRevisionPriceMinor:true,files:{orderBy:{position:'asc'},select:{mediaAsset:{select:{id:true,originalName:true,mimeType:true,sizeBytes:true}}}},revisions:{orderBy:{revisionNumber:'asc'},select:{id:true,revisionNumber:true,status:true,title:true,summary:true,changesMade:true,requesterNote:true,requesterFeedback:true,files:{orderBy:{position:'asc'},select:{mediaAsset:{select:{id:true,originalName:true,mimeType:true,sizeBytes:true}}}}}}} satisfies Prisma.ServiceRequestSelect;

export default async function ServiceRequestsAdmin({searchParams}: {searchParams: Promise<{request?: string}>}) {
  const {request} = await searchParams;
  const requestedId = typeof request === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(request) ? request : undefined;
  const db = database();
  const [recent, requested] = await Promise.all([
    db.serviceRequest.findMany({where: requestedId ? {id: {not: requestedId}} : undefined, orderBy: {createdAt: 'desc'}, take: 100, select}),
    requestedId ? db.serviceRequest.findUnique({where: {id: requestedId}, select}) : null,
  ]);
  const rows = requested ? [requested, ...recent.slice(0, 99)] : recent;
  return <CommunityInbox kind="service-requests" key={requested?.id ?? 'recent'} initialSelection={requested?.id}
    initialRows={rows.map(row => ({...row, name: row.requesterName, email: row.requesterEmail, phone: row.requesterPhone ?? undefined, createdAt: row.createdAt.toISOString()}))}/>;
}
