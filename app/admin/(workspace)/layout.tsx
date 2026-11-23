import {requireOwner} from '@/lib/server/identity/access';
import {WorkspaceShell} from '@/components/admin/workspace-shell';
import {database} from '@/lib/server/database';
import {adminRepository} from '@/lib/server/admin/repository';
export default async function Workspace({children}: {children: React.ReactNode}) {
  const owner = await requireOwner();
  const resources = await adminRepository(database(), owner.id, owner.sessionId).choices();
  return <WorkspaceShell resources={resources} name={owner.name} email={owner.email}>{children}</WorkspaceShell>;
}
