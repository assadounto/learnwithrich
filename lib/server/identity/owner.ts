import type {Database} from '../database-client';
import type {Prisma} from '../../generated/prisma/client';
export class OwnerAccessError extends Error {}
export async function assertOwner(db: Pick<Database, 'user'> | Prisma.TransactionClient, userId: string | undefined) {
  if (!userId) throw new OwnerAccessError('Sign in to continue.');
  const owner = await db.user.findFirst({where: {id: userId, role: 'OWNER', emailVerified: true, accounts: {some: {providerId: 'google'}}}, select: {id: true, name: true, email: true}});
  if (!owner) throw new OwnerAccessError('This account does not have owner access.');
  return owner;
}
export async function bootstrapOwner(db: Database, userId: string) {
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427652)`;
    const existing = await tx.user.findFirst({where: {role: 'OWNER'}, select: {id: true}});
    if (existing) throw new OwnerAccessError('An owner already exists. Bootstrap cannot grant another owner.');
    const verified = await tx.user.findFirst({where: {id: userId, emailVerified: true, accounts: {some: {providerId: 'google'}}}, select: {id: true}});
    if (!verified) throw new OwnerAccessError('Choose an existing verified Google account by its exact user ID.');
    return tx.user.update({where: {id: verified.id}, data: {role: 'OWNER'}, select: {id: true, name: true, email: true}});
  });
}
