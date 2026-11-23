import {WorkspaceShell} from '@/components/admin/workspace-shell';
import Link from '@/components/navigation-link';
import {ShieldCheck} from 'lucide-react';
import {requirePrimaryOwner, ownerMfa} from '@/lib/server/identity/access';
import {OwnerSignout} from '@/components/admin/session-buttons';
import {OwnerSecurity} from '@/components/admin/owner-security';
export default async function Security() {
  const {context, owner} = await requirePrimaryOwner();
  const state = await ownerMfa().state(context);
  return <WorkspaceShell resources={[]} name={owner.name} email={owner.email}><section className="admin-signin admin-security"><Link href="/" className="admin-back">Back to LearnWithRich</Link><div className="admin-signin-card"><span className="admin-icon"><ShieldCheck size={24}/></span><span className="admin-kicker">PROTECT YOUR CREATOR SPACE</span><h1>{state.enabled ? 'One more check.' : 'Secure your studio.'}</h1><p>{state.enabled ? 'Use your authenticator app to continue. Verification lasts 30 minutes and applies to this signed-in session.' : 'Add LearnWithRich to an authenticator app. You’ll need a code before you can manage or publish resources.'}</p><OwnerSecurity initial={state}/><div className="admin-security-signout"><OwnerSignout/></div></div></section></WorkspaceShell>;
}
