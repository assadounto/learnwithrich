import 'dotenv/config';
import {createDatabase} from '../lib/server/database-client';
import {assertOwner} from '../lib/server/identity/owner';
const [userId, confirmation, ...rest] = process.argv.slice(2);
if (!userId || confirmation !== '--confirm' || rest.length) throw new Error('Usage: npm run owner:mfa-reset -- EXACT_OWNER_ID --confirm. This revokes all owner sessions and requires new enrollment.');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const db = createDatabase(process.env.DATABASE_URL);
try {
  await db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 18427653))`;
    await assertOwner(tx, userId);
    await tx.resourceApiToken.updateMany({where: {ownerId: userId, revokedAt: null}, data: {revokedAt: new Date()}});
    await tx.ownerMfa.deleteMany({where: {userId}});
    await tx.session.deleteMany({where: {userId}});
  });
  console.log('Owner MFA reset. All sessions and resource API tokens revoked. Sign in with Google and enroll a new authenticator.');
} finally { await db.$disconnect(); }
