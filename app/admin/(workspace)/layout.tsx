import {requireOwner} from '@/lib/server/identity/access';
import {WorkspaceShell} from '@/components/admin/workspace-shell';
export default async function Workspace({children}: {children: React.ReactNode}) {
  const owner = await requireOwner();
  return <WorkspaceShell name={owner.name} email={owner.email}>{children}</WorkspaceShell>;
}
