import {ProjectIdeaForm} from '@/components/admin/project-idea-form';
import {requireOwner} from '@/lib/server/identity/access';

export default async function NewProjectIdea() {
  await requireOwner();
  return <ProjectIdeaForm/>;
}
