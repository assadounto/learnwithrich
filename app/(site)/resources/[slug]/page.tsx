import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {resources as publicResources} from '@/lib/server/resources';
import {resources as legacyResources} from '@/lib/catalog';
import {ResourceDetail, CourseDetail} from '@/components/resource-detail';
import {OwnedResourceDetail} from '@/components/owned-resource-detail';
import type {ResourceDetails} from '@/lib/resource-types';
import {currentUser} from '@/lib/server/identity/current-user';

export const dynamic = 'force-dynamic';
export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const {slug} = await params;
  const resource = await publicResources().getPublic(slug);
  if (resource) return {title: resource.title, description: resource.summary || undefined};
  const legacy = legacyResources.find(item => item.slug === slug);
  return {title: legacy?.title || 'Resource not found', description: legacy?.description};
}
export default async function ResourcePage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const user = await currentUser();
  const resource = await publicResources().getPublic(slug, user?.id);
  if (resource) {
    const details = resource.details && typeof resource.details === 'object' && !Array.isArray(resource.details) ? resource.details as ResourceDetails : null;
    return <OwnedResourceDetail resource={{...resource, details}}/>;
  }
  const legacy = legacyResources.find(item => item.slug === slug);
  if (!legacy) notFound();
  return legacy.type === 'Course' ? <CourseDetail resource={legacy}/> : <ResourceDetail resource={legacy}/>;
}
