'use server';

import {authoringScopes} from '@/lib/authoring-scopes';
import {revalidatePath} from 'next/cache';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {assertOwner} from '@/lib/server/identity/owner';
import {assertSessionMfa} from '@/lib/server/identity/mfa';
import {generateResourceToken} from '@/lib/server/identity/resource-token';

const durations = [1, 7, 30];

export async function createResourceToken(label: string, days: number, scopes: unknown) {
  const owner = await requireOwner();
  const requested = typeof scopes === 'boolean' ? (scopes ? ['upload', 'edit', 'ideas'] : ['upload']) : scopes;
  const name = typeof label === 'string' ? label.trim() : '';
  if (!name || name.length > 80 || /[\p{Cc}\p{Cf}]/u.test(name) || !durations.includes(days) || !Array.isArray(requested) || !requested.length || requested.length > authoringScopes.length || requested.some(scope => !authoringScopes.some(entry => entry.id === scope))) {
    return {ok: false as const, error: 'Enter a name and choose an expiration and permissions.'};
  }

  const permissions = Object.fromEntries(authoringScopes.map(entry => [entry.field, requested.includes(entry.id)]));
  const {token, digest, hint} = generateResourceToken();
  const created = await database().$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.id}, 18427653))`;
    await assertOwner(tx, owner.id);
    await assertSessionMfa(tx, {userId: owner.id, sessionId: owner.sessionId});
    const now = new Date();
    const active = await tx.resourceApiToken.count({where: {ownerId: owner.id, revokedAt: null, expiresAt: {gt: now}}});
    if (active >= 20) return false;
    await tx.resourceApiToken.create({data: {
      ownerId: owner.id, label: name, digest, hint, ...permissions, expiresAt: new Date(now.getTime() + days * 86_400_000),
    }});
    return true;
  });
  if (!created) return {ok: false as const, error: 'Revoke an active token before creating another. You can have up to 20 active tokens.'};
  revalidatePath('/admin/resource-api');
  return {ok: true as const, token};
}

export async function revokeResourceToken(id: string) {
  const owner = await requireOwner();
  if (typeof id !== 'string' || !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) return;
  await database().$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.id}, 18427653))`;
    await assertOwner(tx, owner.id);
    await assertSessionMfa(tx, {userId: owner.id, sessionId: owner.sessionId});
    await tx.resourceApiToken.updateMany({where: {id, ownerId: owner.id, revokedAt: null}, data: {revokedAt: new Date()}});
  });
  revalidatePath('/admin/resource-api');
}
