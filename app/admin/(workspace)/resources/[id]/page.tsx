import type {ResourceDetails} from '@/lib/resource-types';
import {notFound} from 'next/navigation';
import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {adminRepository} from '@/lib/server/admin/repository';
import {ResourceEditor} from '@/components/admin/resource-editor';
export default async function EditResource({params}: {params: Promise<{id: string}>}) {
  const owner = await requireOwner(); const {id} = await params;
  if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) notFound();
  const admin = adminRepository(database(), owner.id, owner.sessionId);
  const [row, choices] = await Promise.all([admin.get(id), admin.choices()]);
  if (!row) notFound();
  return <ResourceEditor key={`${row.id}-${row.version}-${row.updatedAt.toISOString()}`} choices={choices} initial={{
    id: row.id, version: row.version, updatedAt: row.updatedAt.toISOString(), status: row.status,
    slug: row.slug, type: row.type, title: row.title, summary: row.summary, coverUrl: row.coverUrl ?? '',
    access: row.access, priceMinor: row.priceMinor, currency: row.currency,
    details: (row.content?.details ?? {}) as ResourceDetails,
    bodyMarkdown: row.content?.bodyMarkdown ?? '', tags: row.tags.map(link => link.tag.name),
    sections: row.sections.map(section => ({key: section.id, title: section.title})),
    items: row.items.map(item => ({resourceId: item.resourceId, sectionKey: item.sectionId})),
    media: row.media.map(item => ({mediaAssetId: item.mediaAssetId, title: item.title, priceMinor: item.priceMinor, originalName: item.mediaAsset.originalName, mimeType: item.mediaAsset.mimeType, sizeBytes: item.mediaAsset.sizeBytes})),
    history: row.audits.map(event => ({action: event.action, version: event.version, createdAt: event.createdAt.toISOString(), name: event.actor.name})),
  }}/>;
}
