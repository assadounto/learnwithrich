'use server';

import {revalidatePath} from 'next/cache';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {assertOwner} from '@/lib/server/identity/owner';
import {assertSessionMfa} from '@/lib/server/identity/mfa';

class UserActionError extends Error {}

export async function manageLearner(id: string, action: 'sign-out' | 'delete') {
  const owner = await requireOwner();
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id) || id === owner.id || !['sign-out', 'delete'].includes(action)) {
    return {ok: false as const, message: 'Choose a learner account.'};
  }

  try {
    await database().$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.id}, 18427653))`;
      await assertOwner(tx, owner.id);
      await assertSessionMfa(tx, {userId: owner.id, sessionId: owner.sessionId});

      const locked = await tx.$queryRaw<{id: string}[]>`SELECT "id" FROM "users" WHERE "id" = ${id} AND "role" = 'LEARNER' FOR UPDATE`;
      if (!locked.length) throw new UserActionError('This learner account is unavailable or protected.');
      if (action === 'sign-out') {
        await tx.session.deleteMany({where: {userId: id}});
        return;
      }
      const account = await tx.user.findUniqueOrThrow({where: {id}, select: {_count: {select: {purchases: true, servicePayments: true, audits: true}}}});
      if (account._count.purchases || account._count.servicePayments || account._count.audits) {
        throw new UserActionError('This account has payment or audit records and cannot be deleted. You can sign out its sessions.');
      }
      await tx.user.delete({where: {id}});
    });
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    if (action === 'delete') {
      revalidatePath('/reviews');
      revalidatePath('/');
    }
    return {ok: true as const, message: action === 'delete' ? 'Learner account deleted.' : 'All sessions revoked. The learner can sign in again.'};
  } catch (error) {
    if (error instanceof UserActionError) return {ok: false as const, message: error.message};
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2003') {
      return {ok: false as const, message: 'This account has records that must be retained. No account data was deleted.'};
    }
    return {ok: false as const, message: 'Could not complete the account action. Try again.'};
  }
}
