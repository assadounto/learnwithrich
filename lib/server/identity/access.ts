import 'server-only';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {identity, identityReady} from './index';
import {database} from '../database';
import {assertOwner, OwnerAccessError} from './owner';
export async function requireOwner() {
  if (!identityReady()) redirect('/admin/signin');
  const session = await identity().api.getSession({headers: await headers(), query: {disableCookieCache: true}});
  if (!session) redirect('/admin/signin');
  try { return await assertOwner(database(), session.user.id); }
  catch (error) { if (error instanceof OwnerAccessError) redirect('/admin/access-denied'); throw error; }
}
