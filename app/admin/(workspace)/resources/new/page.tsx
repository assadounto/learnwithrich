import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {adminRepository} from '@/lib/server/admin/repository';
import {ResourceEditor} from '@/components/admin/resource-editor';
export default async function NewResource() {
  const owner = await requireOwner();
  const choices = await adminRepository(database(), owner.id, owner.sessionId).choices();
  return <ResourceEditor choices={choices}/>;
}
