import 'server-only';
import type {Prisma} from '@/lib/generated/prisma/client';
import {pageWindow, requestedPage, studioPageSize} from '@/lib/pagination';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {serviceOfferings} from '@/lib/service-offerings';
import {CommunityInbox} from './community-inbox';

export type InboxParams = {q?: string; status?: string; page?: string; per?: string; request?: string};
type Kind = 'guestbook' | 'reviews' | 'service-requests';

const moderationFilters = [
  {id: 'PENDING', label: 'Pending', statuses: ['PENDING']},
  {id: 'APPROVED', label: 'Approved', statuses: ['APPROVED']},
  {id: 'HIDDEN', label: 'Hidden', statuses: ['HIDDEN']},
] as const;
const serviceFilters = [
  {id: 'NEEDS_REPLY', label: 'Needs review', statuses: ['NEW', 'REVIEWING']},
  {id: 'WAITING', label: 'Waiting on learner', statuses: ['QUOTED', 'PAYMENT_PENDING']},
  {id: 'IN_PROGRESS', label: 'In progress', statuses: ['ACCEPTED']},
  {id: 'CLOSED', label: 'Closed', statuses: ['DECLINED', 'COMPLETED']},
] as const;
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

const fileSelect = {
  orderBy: {position: 'asc'},
  select: {mediaAsset: {select: {id: true, originalName: true, mimeType: true, sizeBytes: true}}},
} as const;
const serviceSelect = {
  id: true, status: true, createdAt: true, requesterName: true, requesterEmail: true, requesterPhone: true,
  serviceType: true, description: true, budgetMinor: true, currency: true, timeline: true, quoteMinor: true,
  quoteNote: true, includedRevisions: true, extraRevisionPriceMinor: true, files: fileSelect,
  revisions: {orderBy: {revisionNumber: 'asc'}, select: {
    id: true, revisionNumber: true, status: true, title: true, summary: true, changesMade: true,
    requesterNote: true, requesterFeedback: true, files: fileSelect,
  }},
} satisfies Prisma.ServiceRequestSelect;

export async function CommunityInboxPage({kind, searchParams}: {kind: Kind; searchParams: Promise<InboxParams>}) {
  await requireOwner();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 160) : '';
  const size = studioPageSize(params.per);
  const requested = requestedPage(params.page);
  const request = kind === 'service-requests' && typeof params.request === 'string' && uuid.test(params.request) ? params.request : '';
  const dropdown = kind === 'service-requests' ? serviceFilters : moderationFilters;
  const status = dropdown.find(item => item.id === params.status)?.id ?? '';
  const filters = dropdown.map(({id, label}) => ({id, label}));
  const contains = {contains: q, mode: 'insensitive' as const};
  const orderBy = [{createdAt: 'desc' as const}, {id: 'asc' as const}];

  return database().$transaction(async tx => {
    async function loadPage<T>(count: PromiseLike<number>, list: (skip: number) => PromiseLike<T[]>) {
      const total = await count;
      const {page, pages, skip} = pageWindow(total, size, requested);
      return {rows: await list(skip), total, page, pages};
    }
    const shared = {kind, q, size, status, filters, request};
    const key = JSON.stringify([kind, q, size, status, requested, request]);
    if (kind === 'service-requests') {
      const group = serviceFilters.find(item => item.id === status);
      const where = {
        ...(request ? {id: request} : {}),
        ...(group ? {status: {in: [...group.statuses]}} : {}),
        ...(q ? {OR: [
          {requesterName: contains}, {requesterEmail: contains}, {description: contains}, {serviceType: contains},
          {serviceType: {in: serviceOfferings.filter(offer => offer.label.toLowerCase().includes(q.toLowerCase())).map(offer => offer.id)}},
          ...(uuid.test(q) ? [{id: q}] : []),
        ]} : {}),
      } satisfies Prisma.ServiceRequestWhereInput;
      const {rows, ...paging} = await loadPage(tx.serviceRequest.count({where}), skip =>
        tx.serviceRequest.findMany({where, orderBy, skip, take: size, select: serviceSelect}));
      return <CommunityInbox key={key} {...shared} {...paging} initialSelection={request} rows={rows.map(row => ({
        ...row, name: row.requesterName, email: row.requesterEmail, phone: row.requesterPhone, createdAt: row.createdAt.toISOString(),
      }))}/>;
    }
    const moderation = moderationFilters.find(item => item.id === status);
    const common = {...(moderation ? {status: {in: [...moderation.statuses]}} : {})};
    const search = [{title: contains}, {country: contains}, {message: contains}, ...(uuid.test(q) ? [{id: q}] : [])];
    if (kind === 'reviews') {
      const where = {...common, ...(q ? {OR: [{displayName: contains}, ...search]} : {})} satisfies Prisma.ReviewWhereInput;
      const {rows, ...paging} = await loadPage(tx.review.count({where}), skip => tx.review.findMany({
        where, orderBy, skip, take: size, select: {id: true, status: true, createdAt: true, displayName: true, title: true, country: true, imageAssetId: true, message: true, rating: true},
      }));
      return <CommunityInbox key={key} {...shared} {...paging} rows={rows.map(row => ({...row, name: row.displayName, createdAt: row.createdAt.toISOString()}))}/>;
    }
    const where = {...common, ...(q ? {OR: [{name: contains}, {email: contains}, ...search]} : {})} satisfies Prisma.GuestbookEntryWhereInput;
    const {rows, ...paging} = await loadPage(tx.guestbookEntry.count({where}), skip => tx.guestbookEntry.findMany({
      where, orderBy, skip, take: size, select: {id: true, status: true, createdAt: true, name: true, email: true, title: true, country: true, imageAssetId: true, message: true},
    }));
    return <CommunityInbox key={key} {...shared} {...paging} rows={rows.map(row => ({...row, createdAt: row.createdAt.toISOString()}))}/>;
  }, {isolationLevel: 'RepeatableRead'});
}
