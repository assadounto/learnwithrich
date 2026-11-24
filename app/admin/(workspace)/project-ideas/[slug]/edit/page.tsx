import {notFound} from 'next/navigation';
import {ProjectIdeaForm} from '@/components/admin/project-idea-form';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';

export default async function EditProjectIdea({params}: {params: Promise<{slug: string}>}) {
  await requireOwner();
  const {slug} = await params;
  if (slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  const idea = await database().projectIdea.findUnique({where: {slug}});
  if (!idea) notFound();
  return <ProjectIdeaForm key={`${slug}:${idea.updatedAt.toISOString()}`} idea={{...idea, updatedAt: idea.updatedAt.toISOString()}}/>;
}
