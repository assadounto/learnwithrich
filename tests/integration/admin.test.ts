import {before, after, test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID, randomBytes} from 'node:crypto';
import {makeSignature} from 'better-auth/crypto';
import {createDatabase} from '../../lib/server/database-client';
import {createIdentity} from '../../lib/server/identity/factory';
import {assertOwner, bootstrapOwner} from '../../lib/server/identity/owner';
import {adminRepository} from '../../lib/server/admin/repository';
import {resourceRepository} from '../../lib/server/resources/repository';

if (!process.env.TEST_DATABASE_URL) throw new Error('Run integration tests through npm run test:db.');
const db = createDatabase(process.env.TEST_DATABASE_URL);
const prefix = `admin-test-${randomUUID()}`;
const ownerId = `${prefix}-owner`, learnerId = `${prefix}-learner`, unverifiedId = `${prefix}-unverified`;
const ids: string[] = [];
const config = {baseURL: 'http://localhost:3000', secret: randomBytes(32).toString('hex'), googleId: 'test-client', googleSecret: 'test-secret'};
const auth = createIdentity(db, config);
const admin = adminRepository(db, ownerId);
let sequence = 0;
async function draft(type = 'ARTICLE', overrides: Record<string, unknown> = {}) {
  const row = await admin.save({title: `Admin resource ${++sequence}`, slug: `${prefix}-${sequence}`, type, bodyMarkdown: 'Owner body', ...overrides});
  ids.push(row.id); return row;
}
function document(row: Awaited<ReturnType<typeof draft>>) {
  return {...row, updatedAt: row.updatedAt.toISOString(), bodyMarkdown: row.content?.bodyMarkdown ?? '', tags: row.tags.map(link => link.tag.name), sections: row.sections.map(section => ({key: section.id, title: section.title})), items: row.items.map(item => ({resourceId: item.resourceId, sectionKey: item.sectionId}))};
}
async function session(userId: string) {
  const token = randomBytes(32).toString('hex');
  const row = await db.session.create({data: {id: randomUUID(), userId, token, expiresAt: new Date(Date.now() + 3600000)}});
  const value = encodeURIComponent(`${token}.${await makeSignature(token, config.secret)}`);
  return {row, headers: new Headers({cookie: `lwr_identity.session_token=${value}`, origin: config.baseURL})};
}
before(async () => {
  for (const [id, verified] of [[ownerId, true], [learnerId, true], [unverifiedId, false]] as const) {
    await db.user.create({data: {id, name: 'Test creator', email: `${id}@example.test`, emailVerified: verified, accounts: {create: {id: randomUUID(), providerId: 'google', accountId: id}}}});
  }
  await assert.rejects(bootstrapOwner(db, unverifiedId));
  await bootstrapOwner(db, ownerId);
});
after(async () => {
  await db.resourceAudit.deleteMany({where: {resourceId: {in: ids}}});
  await db.resourceItem.deleteMany({where: {collectionId: {in: ids}}});
  await db.resourceSection.deleteMany({where: {resourceId: {in: ids}}});
  await db.resource.deleteMany({where: {id: {in: ids}}});
  await db.user.deleteMany({where: {id: {in: [ownerId, learnerId, unverifiedId]}}});
  await db.tag.deleteMany({where: {name: {startsWith: prefix}, resources: {none: {}}}});
  await db.$disconnect();
});

test('owner bootstrap requires a verified Google account and cannot grant a second owner', async () => {
  assert.equal((await assertOwner(db, ownerId)).id, ownerId);
  await assert.rejects(assertOwner(db, learnerId));
  await assert.rejects(assertOwner(db, undefined));
  await assert.rejects(bootstrapOwner(db, learnerId));
  await assert.rejects(db.user.update({where: {id: learnerId}, data: {role: 'OWNER'}}));
  const outsider = adminRepository(db, learnerId);
  await assert.rejects(outsider.list()); await assert.rejects(outsider.choices()); await assert.rejects(outsider.save({}));
});
test('Better Auth validates signed database sessions and revoked sessions disappear immediately', async () => {
  const current = await session(ownerId);
  assert.equal((await auth.api.getSession({headers: current.headers}))?.user.id, ownerId);
  assert.equal(await auth.api.getSession({headers: new Headers({cookie: 'lwr_identity.session_token=forged'})}), null);
  await db.session.delete({where: {id: current.row.id}});
  assert.equal(await auth.api.getSession({headers: current.headers}), null);
  const expired = await session(ownerId);
  await db.session.update({where: {id: expired.row.id}, data: {expiresAt: new Date(0)}});
  assert.equal(await auth.api.getSession({headers: expired.headers}), null);
  const signedIn = await session(ownerId);
  const signedOut = await auth.handler(new Request(`${config.baseURL}/api/identity/sign-out`, {method: 'POST', headers: signedIn.headers}));
  assert.equal(signedOut.status, 200);
  assert.equal(await db.session.findUnique({where: {id: signedIn.row.id}}), null);
  assert.equal(await auth.api.getSession({headers: signedIn.headers}), null);
});
test('client profile changes cannot promote a learner or accept cross-origin requests', async () => {
  const current = await session(learnerId);
  const headers = new Headers(current.headers); headers.set('content-type', 'application/json');
  const response = await auth.handler(new Request(`${config.baseURL}/api/identity/update-user`, {method: 'POST', headers, body: JSON.stringify({name: 'Still a learner', role: 'OWNER'})}));
  assert.ok(response.status < 500);
  assert.equal((await db.user.findUniqueOrThrow({where: {id: learnerId}})).role, 'LEARNER');
  headers.set('origin', 'https://outside.example');
  const foreign = await auth.handler(new Request(`${config.baseURL}/api/identity/update-user`, {method: 'POST', headers, body: JSON.stringify({name: 'Changed elsewhere'})}));
  assert.equal(foreign.status, 403);
});
test('owner saves, previews, publishes and archives resources with immutable audit snapshots', async () => {
  const first = await draft('ARTICLE', {tags: [`${prefix}-topic`], bodyMarkdown: 'First revision'});
  assert.equal(first.status, 'DRAFT'); assert.equal(first.version, 1);
  assert.equal((await resourceRepository(db).getPublic(first.slug)), null);
  const updated = await admin.save({...document(first), bodyMarkdown: 'Second revision'});
  const published = await admin.transition(updated.id, updated.version, updated.updatedAt.toISOString(), 'PUBLISH');
  assert.equal((await resourceRepository(db).getPublic(first.slug))?.bodyMarkdown, 'Second revision');
  const events = await db.resourceAudit.findMany({where: {resourceId: first.id}, orderBy: {version: 'asc'}});
  assert.deepEqual(events.map(event => event.action), ['CREATED', 'UPDATED', 'PUBLISH']);
  assert.match(JSON.stringify(events[0].snapshot), /First revision/);
  assert.doesNotMatch(JSON.stringify(events[0].snapshot), /Second revision/);
  await admin.transition(first.id, published.version, published.updatedAt.toISOString(), 'ARCHIVE');
  assert.equal(await resourceRepository(db).getPublic(first.slug), null);
});
test('stale edits and publishing attempts cannot overwrite another version', async () => {
  const first = await draft();
  await admin.save({...document(first), title: 'Changed in another tab'});
  await assert.rejects(admin.save({...document(first), title: 'Stale write'}), /another tab/);
  await assert.rejects(admin.transition(first.id, first.version, first.updatedAt.toISOString(), 'PUBLISH'), /another tab/);
  assert.equal((await admin.get(first.id))?.title, 'Changed in another tab');
});
test('course/path assembly is atomic, reuses lessons and rejects invalid or circular membership', async () => {
  const lesson = await draft('LESSON'); const other = await draft('LESSON'); const article = await draft();
  const course = await draft('COURSE'); const path = await draft('PATH');
  const sectionKey = randomUUID();
  const assembled = await admin.save({...document(course), sections: [{key: sectionKey, title: 'First steps'}], items: [{resourceId: lesson.id, sectionKey}, {resourceId: other.id}]});
  assert.equal(assembled.items[0].sectionId, assembled.sections[0].id);
  const journey = await admin.save({...document(path), items: [{resourceId: article.id}, {resourceId: course.id}]});
  assert.equal(journey.items.length, 2);
  await assert.rejects(admin.save({...document(assembled), items: [{resourceId: article.id}]}));
  assert.equal((await admin.get(course.id))?.items.length, 2);
  const nested = await draft('PATH');
  const pointing = await admin.save({...document(nested), items: [{resourceId: path.id}]});
  await assert.rejects(admin.save({...document(journey), items: [{resourceId: nested.id}]}));
  assert.equal((await admin.get(pointing.id))?.items[0].resourceId, path.id);
});
test('owner role revocation is checked again for every private operation', async () => {
  const row = await draft();
  await db.user.update({where: {id: ownerId}, data: {role: 'LEARNER'}});
  try {
    await assert.rejects(admin.get(row.id));
    await assert.rejects(admin.save({...document(row), title: 'Unauthorized change'}));
    await assert.rejects(admin.transition(row.id, row.version, row.updatedAt.toISOString(), 'PUBLISH'));
  } finally { await db.user.update({where: {id: ownerId}, data: {role: 'OWNER'}}); }
});

test('trusted CLI collection edits also invalidate an already-open admin editor', async () => {
  const course = await draft('COURSE'); const lesson = await draft('LESSON');
  await resourceRepository(db).replaceItems(course.id, [{resourceId: lesson.id}]);
  await assert.rejects(admin.save({...document(course), title: 'Would overwrite CLI edit'}), /another tab/);
  assert.equal((await admin.get(course.id))?.items[0].resourceId, lesson.id);
});
