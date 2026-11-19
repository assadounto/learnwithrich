import 'server-only';
import {headers} from 'next/headers';
import {identity, identityReady} from './index';

export async function currentUser() {
  if (!identityReady()) return null;
  const session = await identity().api.getSession({headers: await headers(), query: {disableCookieCache: true}});
  if (!session) return null;
  return {id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image ?? null};
}
