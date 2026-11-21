import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {OwnerEntry} from '@/components/admin/owner-entry';
import {database} from '@/lib/server/database';
import {identity, identityReady} from '@/lib/server/identity';
import {assertOwner, OwnerAccessError} from '@/lib/server/identity/owner';
import {ownerMfa} from '@/lib/server/identity/access';

export const dynamic = 'force-dynamic';

export default async function AdminEntry({searchParams}: {searchParams: Promise<{error?: string}>}) {
  const enabled = process.env.LWR_ADMIN_ENABLED !== 'false';
  const configured = enabled && identityReady();
  if (configured) {
    const session = await identity().api.getSession({headers: await headers(), query: {disableCookieCache: true}});
    if (session) {
      try {
        const owner = await assertOwner(database(), session.user.id);
        const state = await ownerMfa().state({userId: owner.id, sessionId: session.session.id});
        if (!state.verified) redirect('/admin/security');
        redirect('/admin/resources');
      } catch (error) {
        if (error instanceof OwnerAccessError) redirect('/admin/access-denied');
        throw error;
      }
    }
  }
  const {error} = await searchParams;
  return <OwnerEntry configured={configured} error={error === 'signin'}/>;
}
