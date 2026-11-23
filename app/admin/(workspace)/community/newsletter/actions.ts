'use server';

import {revalidatePath} from 'next/cache';
import {validEmail} from '@/lib/server/community/submissions';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {assertOwner} from '@/lib/server/identity/owner';
import {assertSessionMfa} from '@/lib/server/identity/mfa';

export async function updateNewsletterSignup(email: string, action: 'verify' | 'pending' | 'remove') {
  const owner = await requireOwner();
  if (typeof email !== 'string' || !validEmail(email) || !['verify', 'pending', 'remove'].includes(action)) return;
  await database().$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.id}, 18427653))`;
    await assertOwner(tx, owner.id);
    await assertSessionMfa(tx, {userId: owner.id, sessionId: owner.sessionId});
    if (action === 'remove') await tx.newsletterSignup.deleteMany({where: {email}});
    else await tx.newsletterSignup.updateMany({where: {email}, data: {verifiedAt: action === 'verify' ? new Date() : null}});
  });
  revalidatePath('/admin/community/newsletter');
}
