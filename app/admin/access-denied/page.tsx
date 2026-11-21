import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {identity, identityReady} from '@/lib/server/identity';
import {OwnerSignout} from '@/components/admin/session-buttons';
export default async function Denied() {
  const session = identityReady() ? await identity().api.getSession({headers: await headers(), query: {disableCookieCache: true}}) : null;
  if (!session) redirect('/admin');
  return <section className="admin-signin"><div className="admin-signin-card"><span className="admin-kicker">RESOURCE STUDIO</span><h1>This space is<br/>for the owner.</h1><p>You’re signed in, but this account does not have permission to manage resources.</p>{session && <p className="admin-account-id">Your account ID: <code>{session.user.id}</code></p>}<p>If this is your owner account, complete the one-time owner setup described in the admin setup guide.</p><OwnerSignout/></div></section>;
}
