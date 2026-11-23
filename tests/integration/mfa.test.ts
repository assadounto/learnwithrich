import {before, beforeEach, after, test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes, randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createOTP} from '@better-auth/utils/otp';
import {base32} from '@better-auth/utils/base32';
import {createDatabase} from '../../lib/server/database-client';
import {bootstrapOwner} from '../../lib/server/identity/owner';
import {mfaService, assertSessionMfa, MFA_VALID_MS} from '../../lib/server/identity/mfa';
import {adminRepository} from '../../lib/server/admin/repository';

if (!process.env.TEST_DATABASE_URL) throw new Error('Run through npm run test:db.');
const db = createDatabase(process.env.TEST_DATABASE_URL);
const ownerId = `mfa-test-${randomUUID()}`, learnerId = `${ownerId}-learner`;
const key = randomBytes(32).toString('hex');
let now = Date.now();
const mfa = mfaService(db, key, () => now);
let context: {userId: string; sessionId: string};
async function session(userId = ownerId, createdAt = new Date(now)) {
  const row = await db.session.create({data: {id: randomUUID(), token: randomBytes(32).toString('hex'), userId, createdAt, expiresAt: new Date(now + 3600_000)}});
  return {userId, sessionId: row.id};
}
const otp = (secret: string, offset = 0) => createOTP(base32.decode(secret)).hotp(Math.floor(now / 30_000) + offset);
async function enroll() {
  const setup = await mfa.begin(context);
  const {codes} = await mfa.confirm(context, await otp(setup.secret));
  return {...setup, codes};
}
before(async () => {
  for (const id of [ownerId, learnerId]) await db.user.create({data: {id, name: 'MFA test owner', email: `${id}@example.test`, emailVerified: true, accounts: {create: {id: randomUUID(), providerId: 'google', accountId: id}}}});
  await bootstrapOwner(db, ownerId);
});
beforeEach(async () => {
  now = Date.now();
  await db.ownerMfa.deleteMany({where: {userId: ownerId}});
  await db.session.deleteMany({where: {userId: {in: [ownerId, learnerId]}}});
  context = await session();
});
after(async () => { await db.user.deleteMany({where: {id: {in: [ownerId, learnerId]}}}); await db.$disconnect(); });

test('Google-only owners and learners cannot bypass MFA or inspect the private repository', async () => {
  const state = await mfa.state(context); assert.equal(state.enabled, false); assert.equal(state.verified, false);
  await assert.rejects(assertSessionMfa(db, context));
  await assert.rejects(adminRepository(db, ownerId, context.sessionId).list());
  await assert.rejects(adminRepository(db, ownerId, context.sessionId).save({}));
  await assert.rejects(mfa.begin(await session(learnerId)));
});
test('enrollment is encrypted, requires a recent primary session and confirms possession before access', async () => {
  const old = await session(ownerId, new Date(now - 11 * 60_000));
  await assert.rejects(mfa.begin(old), /sign out/);
  const setup = await mfa.begin(context);
  assert.match(setup.uri, /^otpauth:\/\/totp\/LearnWithRich/);
  const row = await db.ownerMfa.findUniqueOrThrow({where: {userId: ownerId}});
  assert.ok(!row.secretCiphertext!.includes(setup.secret));
  assert.equal((await mfa.state(context)).verified, false);
  await assert.rejects(mfa.confirm(context, 'abcdef'), /invalid/);
  const {codes} = await mfa.confirm(context, await otp(setup.secret));
  assert.equal(codes.length, 10); assert.equal(new Set(codes).size, 10);
  assert.equal((await mfa.state(context)).verified, true);
  await assertSessionMfa(db, context);
  const enabled = await db.ownerMfa.findUniqueOrThrow({where: {userId: ownerId}});
  for (const code of codes) assert.ok(!JSON.stringify(enabled).includes(code));
});
test('pending enrollment is session-bound and expires; rotating setup cannot reset retry limits', async () => {
  const setup = await mfa.begin(context);
  const other = await session();
  await assert.rejects(mfa.begin(other), /another session/);
  await assert.rejects(mfa.confirm(other, await otp(setup.secret)), /expired/);
  for (let i = 0; i < 5; i++) await assert.rejects(mfa.confirm(context, 'bad-code'));
  await assert.rejects(mfa.begin(context), /Too many/);
  now += 16 * 60_000;
  await assert.rejects(mfa.confirm(context, await otp(setup.secret)), /expired/);
});
test('TOTP matches the RFC test vector and a code is consumed atomically across sessions', async () => {
  // RFC 6238 SHA-1 vector at 59 seconds, truncated to the standard 6 digits.
  assert.equal(await createOTP('12345678901234567890').hotp(1), '287082');
  const setup = await enroll();
  const other = await session();
  await assert.rejects(assertSessionMfa(db, other));
  await assert.rejects(mfa.verify(other, await otp(setup.secret)), /already used/);
  now += 30_000;
  const code = await otp(setup.secret);
  const results = await Promise.allSettled([mfa.verify(context, code), mfa.verify(other, code)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
});
test('recovery codes require Google auth and are single-use under concurrent requests', async () => {
  const setup = await enroll();
  const other = await session();
  const results = await Promise.allSettled([mfa.verify(other, setup.codes[0], true), mfa.verify(context, setup.codes[0], true)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await mfa.state(context)).recoveryRemaining, 9);
  await assert.rejects(mfa.verify(context, setup.codes[0], true), /already used/);
  await db.session.delete({where: {id: other.sessionId}});
  await assert.rejects(mfa.verify(other, setup.codes[1], true), /expired/);
});
test('five failures share an account-wide lock across sessions and factors', async () => {
  const setup = await enroll(); const other = await session();
  const results = await Promise.allSettled(Array.from({length: 8}, (_, index) => mfa.verify(index % 2 ? other : context, 'incorrect', index % 2 === 0)));
  assert.ok(results.every(result => result.status === 'rejected'));
  assert.equal((await db.ownerMfa.findUniqueOrThrow({where: {userId: ownerId}})).failedAttempts, 5);
  await assert.rejects(mfa.verify(context, setup.codes[0], true), /Too many/);
  now += 16 * 60_000;
  await mfa.verify(context, await otp(setup.secret));
  assert.equal((await db.ownerMfa.findUniqueOrThrow({where: {userId: ownerId}})).failedAttempts, 0);
});
test('verification expires after 30 minutes, is session-bound and does not survive revocation', async () => {
  await enroll();
  const other = await session();
  await assert.rejects(assertSessionMfa(db, other));
  await db.session.update({where: {id: context.sessionId}, data: {mfaVerifiedAt: new Date(Date.now() - MFA_VALID_MS)}});
  await assert.rejects(assertSessionMfa(db, context));
  await assert.rejects(adminRepository(db, ownerId, context.sessionId).choices());
  await db.session.delete({where: {id: context.sessionId}});
  await assert.rejects(mfa.state(context));
});
test('recovery rotation requires a new authenticator code and invalidates the previous set', async () => {
  const setup = await enroll();
  await assert.rejects(mfa.rotateRecovery(context, setup.codes[0]));
  now += 30_000;
  const rotated = await mfa.rotateRecovery(context, await otp(setup.secret));
  await assert.rejects(mfa.verify(context, setup.codes[0], true));
  await mfa.verify(context, rotated.codes[0], true);
});
test('factor replacement requires an unused factor and revokes all sessions', async () => {
  const setup = await enroll(); const other = await session();
  await assert.rejects(mfa.reset(context, 'invalid', true));
  await mfa.reset(context, setup.codes[0], true);
  assert.equal(await db.ownerMfa.count({where: {userId: ownerId}}), 0);
  assert.equal(await db.session.count({where: {userId: ownerId}}), 0);
  await assert.rejects(assertSessionMfa(db, other));
  await assert.rejects(mfa.begin(context));
  context = await session();
  assert.equal((await mfa.state(context)).verified, false);
});
test('role revocation denies all MFA operations even with a verified session', async () => {
  await enroll();
  await db.user.update({where: {id: ownerId}, data: {role: 'LEARNER'}});
  try { await assert.rejects(mfa.state(context)); await assert.rejects(mfa.rotateRecovery(context, '123456')); }
  finally { await db.user.update({where: {id: ownerId}, data: {role: 'OWNER'}}); }
});

test('operator recovery requires explicit confirmation and the exact verified owner', async () => {
  await enroll(); await session();
  const reset = (args: string[]) => spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/reset-owner-mfa.ts', ...args], {env: {...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL}, encoding: 'utf8'});
  assert.notEqual(reset([ownerId]).status, 0);
  assert.notEqual(reset([learnerId, '--confirm']).status, 0);
  assert.equal(await db.ownerMfa.count({where: {userId: ownerId}}), 1);
  assert.equal(reset([ownerId, '--confirm']).status, 0);
  assert.equal(await db.ownerMfa.count({where: {userId: ownerId}}), 0);
  assert.equal(await db.session.count({where: {userId: ownerId}}), 0);
});
