import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {adminRepository} from '@/lib/server/admin/repository';
import {ResourceEditor} from '@/components/admin/resource-editor';
import {resourceTypes, type ResourceKind} from '@/lib/server/resources/validation';
export default async function NewResource({searchParams}: {searchParams: Promise<{type?: string}>}) {
  const owner = await requireOwner();
  const {type} = await searchParams;
  const initialType = resourceTypes.includes(type as ResourceKind) ? type as ResourceKind : 'ARTICLE';
  const choices = await adminRepository(database(), owner.id, owner.sessionId).choices();
  return <ResourceEditor key={initialType} choices={choices} initialType={initialType}/>;
}
