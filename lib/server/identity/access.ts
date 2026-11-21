import 'server-only';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {identity, identityReady} from './index';
import {database} from '../database';
import {assertOwner, OwnerAccessError} from './owner';
import {mfaService} from './mfa';
import {identityConfig} from './config';
export async function requirePrimaryOwner() {
  if (process.env.LWR_ADMIN_ENABLED === 'false') redirect('/admin');
  if (!identityReady()) redirect('/admin');
  const session = await identity().api.getSession({headers: await headers(), query: {disableCookieCache: true}});
  if (!session) redirect('/admin');
  try { const owner = await assertOwner(database(), session.user.id); return {owner, context: {userId: owner.id, sessionId: session.session.id}}; }
  catch (error) { if (error instanceof OwnerAccessError) redirect('/admin/access-denied'); throw error; }
}

export function ownerMfa() { return mfaService(database(), identityConfig().secret); }
export async function requireOwner() {
  const {owner, context} = await requirePrimaryOwner();
  const state = await ownerMfa().state(context);
  if (!state.verified) redirect('/admin/security');
  return {...owner, sessionId: context.sessionId};
}
