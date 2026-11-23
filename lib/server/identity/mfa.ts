import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {createOTP} from '@better-auth/utils/otp';
import {base32} from '@better-auth/utils/base32';
import {symmetricEncrypt, symmetricDecrypt} from 'better-auth/crypto';
import type {Database} from '../database-client';
import type {Prisma} from '../../generated/prisma/client';
import {assertOwner} from './owner';

export const MFA_VALID_MS = 30 * 60_000;
const ENROLLMENT_MS = 10 * 60_000;
const LOCK_MS = 15 * 60_000;
export class MfaError extends Error {}
export type MfaContext = {userId: string; sessionId: string};
export function recoveryHash(userId: string, code: string) {
  return createHash('sha256').update(`lwr-mfa-recovery:${userId}:${code.replaceAll('-', '').toLowerCase()}`).digest('hex');
}
function recoveryCodes() { return Array.from({length: 10}, () => randomBytes(16).toString('hex').match(/.{8}/g)!.join('-')); }
export function mfaFresh(verifiedAt: Date | null, now = Date.now()) {
  return !!verifiedAt && verifiedAt.getTime() <= now && now - verifiedAt.getTime() < MFA_VALID_MS;
}
type Outcome<T> = {ok: true; value: T} | {ok: false; error: string};
const fail = (error: string): Outcome<never> => ({ok: false, error});
const success = <T>(value: T): Outcome<T> => ({ok: true, value});

// Keep the second-factor proof in the authoritative session row. A Google/OAuth
// session alone can never satisfy this gate, including sessions from other tabs.
export function mfaService(db: Database, encryptionKey: string, clock = Date.now) {
  if (encryptionKey.length < 32) throw new Error('MFA encryption key is not configured.');
  async function run<T>(context: MfaContext, operation: (tx: Prisma.TransactionClient, now: number) => Promise<Outcome<T>>) {
    const result = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${context.userId}, 18427653))`;
      await assertOwner(tx, context.userId);
      const session = await tx.session.findFirst({where: {id: context.sessionId, userId: context.userId, expiresAt: {gt: new Date(clock())}}});
      if (!session) throw new MfaError('Your sign-in expired. Sign in with Google again.');
      return operation(tx, clock());
    }, {timeout: 10_000});
    // Failed guesses must commit their counter before reporting failure.
    if (!result.ok) throw new MfaError(result.error);
    return result.value;
  }
  async function readSecret(userId: string, ciphertext: string) {
    const data = JSON.parse(await symmetricDecrypt({key: encryptionKey, data: ciphertext})) as {userId: string; secret: string};
    if (data.userId !== userId || typeof data.secret !== 'string') throw new Error('Invalid MFA secret envelope.');
    return base32.decode(data.secret);
  }
  async function attempt(tx: Prisma.TransactionClient, context: MfaContext, code: string, recovery: boolean, now: number, enrolling = false) {
    const row = await tx.ownerMfa.findUnique({where: {userId: context.userId}});
    if (!row?.secretCiphertext || (!enrolling && !row.enabledAt)) return fail('Set up your authenticator first.');
    if (row.lockedUntil && row.lockedUntil.getTime() > now) return fail('Too many attempts. Try again in 15 minutes.');
    if (enrolling && (row.enabledAt || row.pendingSessionId !== context.sessionId || !row.pendingExpiresAt || row.pendingExpiresAt.getTime() <= now)) return fail('Setup expired. Start setup again.');
    let matchedStep = -1;
    let recoveryIndex = -1;
    if (recovery && !enrolling) {
      const candidate = Buffer.from(recoveryHash(context.userId, code), 'hex');
      for (const [index, hash] of row.recoveryHashes.entries()) {
        if (timingSafeEqual(candidate, Buffer.from(hash, 'hex'))) recoveryIndex = index;
      }
    } else {
      const otp = createOTP(await readSecret(context.userId, row.secretCiphertext));
      const step = Math.floor(now / 30_000);
      for (const offset of [-1, 0, 1]) {
        const expected = await otp.hotp(step + offset);
        const valid = /^\d{6}$/.test(code) && timingSafeEqual(Buffer.from(code), Buffer.from(expected));
        if (valid && step + offset > row.lastUsedStep) matchedStep = step + offset;
      }
    }
    if (matchedStep < 0 && recoveryIndex < 0) {
      const failures = (row.lockedUntil && row.lockedUntil.getTime() <= now ? 0 : row.failedAttempts) + 1;
      await tx.ownerMfa.update({where: {userId: context.userId}, data: {failedAttempts: failures, lockedUntil: failures >= 5 ? new Date(now + LOCK_MS) : null}});
      return fail(failures >= 5 ? 'Too many attempts. Try again in 15 minutes.' : 'Code is invalid or already used. Try a new code.');
    }
    await tx.ownerMfa.update({where: {userId: context.userId}, data: {
      failedAttempts: 0, lockedUntil: null,
      ...(recoveryIndex >= 0 ? {recoveryHashes: row.recoveryHashes.filter((_, index) => index !== recoveryIndex)} : {lastUsedStep: matchedStep}),
    }});
    return success(true);
  }
  return {
    async state(context: MfaContext) {
      return run(context, async (tx, now) => {
        const row = await tx.ownerMfa.findUnique({where: {userId: context.userId}});
        const session = await tx.session.findUniqueOrThrow({where: {id: context.sessionId}});
        return success({enabled: !!row?.enabledAt, verified: !!row?.enabledAt && mfaFresh(session.mfaVerifiedAt, now), recoveryRemaining: row?.recoveryHashes.length ?? 0,
          canEnroll: now - session.createdAt.getTime() < ENROLLMENT_MS});
      });
    },
    async begin(context: MfaContext) {
      return run(context, async (tx, now) => {
        const session = await tx.session.findUniqueOrThrow({where: {id: context.sessionId}});
        if (now - session.createdAt.getTime() >= ENROLLMENT_MS) return fail('For setup, sign out and sign in with Google again.');
        const row = await tx.ownerMfa.upsert({where: {userId: context.userId}, create: {userId: context.userId}, update: {}});
        if (row.enabledAt) return fail('MFA is already enabled. Verify your existing authenticator.');
        if (row.lockedUntil && row.lockedUntil.getTime() > now) return fail('Too many attempts. Try again in 15 minutes.');
        let raw: Uint8Array;
        if (row.secretCiphertext && row.pendingExpiresAt && row.pendingExpiresAt.getTime() > now) {
          if (row.pendingSessionId !== context.sessionId) return fail('Setup is already open in another session. Wait 10 minutes to start again.');
          raw = await readSecret(context.userId, row.secretCiphertext);
        } else {
          raw = randomBytes(20);
          await tx.ownerMfa.update({where: {userId: context.userId}, data: {
            secretCiphertext: await symmetricEncrypt({key: encryptionKey, data: JSON.stringify({userId: context.userId, secret: base32.encode(raw, {padding: false})})}),
            pendingSessionId: context.sessionId, pendingExpiresAt: new Date(now + ENROLLMENT_MS), lastUsedStep: -1,
          }});
        }
        const user = await tx.user.findUniqueOrThrow({where: {id: context.userId}});
        return success({secret: base32.encode(raw, {padding: false}), uri: createOTP(raw).url('LearnWithRich', user.email)});
      });
    },
    async confirm(context: MfaContext, code: string) {
      return run(context, async (tx, now) => {
        const valid = await attempt(tx, context, code, false, now, true);
        if (!valid.ok) return valid;
        const codes = recoveryCodes();
        await tx.ownerMfa.update({where: {userId: context.userId}, data: {enabledAt: new Date(now), pendingSessionId: null, pendingExpiresAt: null, recoveryHashes: codes.map(code => recoveryHash(context.userId, code))}});
        await tx.session.updateMany({where: {userId: context.userId}, data: {mfaVerifiedAt: null}});
        await tx.session.update({where: {id: context.sessionId}, data: {mfaVerifiedAt: new Date(now)}});
        return success({codes});
      });
    },
    async verify(context: MfaContext, code: string, recovery = false) {
      return run(context, async (tx, now) => {
        const valid = await attempt(tx, context, code, recovery, now);
        if (!valid.ok) return valid;
        await tx.session.update({where: {id: context.sessionId}, data: {mfaVerifiedAt: new Date(now)}});
        return success(true);
      });
    },
    async rotateRecovery(context: MfaContext, code: string) {
      return run(context, async (tx, now) => {
        const valid = await attempt(tx, context, code, false, now);
        if (!valid.ok) return valid;
        const codes = recoveryCodes();
        await tx.ownerMfa.update({where: {userId: context.userId}, data: {recoveryHashes: codes.map(code => recoveryHash(context.userId, code))}});
        await tx.session.update({where: {id: context.sessionId}, data: {mfaVerifiedAt: new Date(now)}});
        return success({codes});
      });
    },
    async reset(context: MfaContext, code: string, recovery: boolean) {
      return run(context, async (tx, now) => {
        const valid = await attempt(tx, context, code, recovery, now);
        if (!valid.ok) return valid;
        await tx.resourceApiToken.updateMany({where: {ownerId: context.userId, revokedAt: null}, data: {revokedAt: new Date(now)}});
        await tx.ownerMfa.delete({where: {userId: context.userId}});
        // Revoke every session, including this one: replacement requires fresh Google auth.
        await tx.session.deleteMany({where: {userId: context.userId}});
        return success(true);
      });
    },
  };
}

export async function assertSessionMfa(db: Pick<Database, 'session' | 'ownerMfa'> | Prisma.TransactionClient, context: MfaContext) {
  const session = await db.session.findFirst({where: {id: context.sessionId, userId: context.userId, expiresAt: {gt: new Date()}}});
  const factor = await db.ownerMfa.findUnique({where: {userId: context.userId}, select: {enabledAt: true}});
  if (!factor?.enabledAt || !session || !mfaFresh(session.mfaVerifiedAt)) throw new MfaError('Verify your authenticator again before continuing.');
}
