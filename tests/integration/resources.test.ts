import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDatabase} from '../../lib/server/database-client';
import {resourceRepository} from '../../lib/server/resources/repository';

if (!process.env.TEST_DATABASE_URL) throw new Error('Run integration tests through npm run test:db.');
const db = createDatabase(process.env.TEST_DATABASE_URL);
const store = resourceRepository(db);
const prefix = `integration-${randomUUID()}`;
let sequence = 0;
const ids: string[] = [];
async function draft(type = 'ARTICLE', extra: Record<string, unknown> = {}) {
  const row = await store.createDraft({slug: `${prefix}-${++sequence}`, type, title: `Resource ${sequence}`, bodyMarkdown: 'Original body', ...extra});
  ids.push(row.id);
  return row;
}
const item = (collectionId: string, resourceId: string, position = 0) => db.resourceItem.create({data: {collectionId, resourceId, position}});
before(async () => { await db.$connect(); });
after(async () => {
  // Delete only fixtures from this run; never truncate a database or unrelated data.
  await db.resourceItem.deleteMany({where: {collectionId: {in: ids}}});
  await db.resourceSection.deleteMany({where: {resourceId: {in: ids}}});
  await db.resource.deleteMany({where: {id: {in: ids}}});
  await db.tag.deleteMany({where: {name: {startsWith: prefix}, resources: {none: {}}}});
  await db.$disconnect();
});

test('catalog persists all resource types and excludes drafts, archives and scheduled publication', async () => {
  const tag = `${prefix}-catalog`;
  const article = await draft('ARTICLE', {tags: [tag], title: 'Solar ideas'});
  const path = await draft('PATH', {tags: [tag]});
  const hidden = await draft('PROJECT', {tags: [tag]});
  const archived = await draft('BOOK', {tags: [tag]});
  const scheduled = await draft('LESSON', {tags: [tag]});
  await store.publish(article.id); await store.publish(path.id);
  await store.publish(archived.id); await store.archive(archived.id);
  await db.resource.update({where: {id: scheduled.id}, data: {status: 'PUBLISHED', publishedAt: new Date(Date.now() + 86400000)}});
  const result = await store.listPublic(new URLSearchParams({tag}));
  assert.equal(result.total, 2);
  assert.ok(result.items.every(row => !('content' in row) && !('bodyMarkdown' in row)));
  assert.equal((await store.listPublic(new URLSearchParams({tag, type: 'path'}))).total, 1);
  assert.equal((await store.listPublic(new URLSearchParams({tag, q: 'SOLAR'}))).total, 1);
  assert.equal((await store.listPublic(new URLSearchParams({tag, limit: '1', page: '2'}))).items.length, 1);
  assert.equal(await store.getPublic(hidden.slug), null);
  assert.equal(await store.getPublic(archived.slug), null);
});

test('public parent outlines never expose paid/free-account/draft child bodies', async () => {
  const path = await draft('PATH');
  const paid = await draft('LESSON', {access: 'PAID', priceMinor: 1000, bodyMarkdown: 'PAID SECRET'});
  const account = await draft('ARTICLE', {access: 'FREE_ACCOUNT', bodyMarkdown: 'ACCOUNT SECRET'});
  const hidden = await draft('LESSON', {bodyMarkdown: 'DRAFT SECRET'});
  const article = await draft('ARTICLE', {bodyMarkdown: 'Public text'});
  for (const row of [path, paid, account, article]) await store.publish(row.id);
  await store.replaceItems(path.id, [{resourceId: paid.id}, {resourceId: account.id}, {resourceId: hidden.id}, {resourceId: article.id}]);
  const detail = await store.getPublic(path.slug);
  assert.equal(detail?.items.length, 3);
  assert.doesNotMatch(JSON.stringify(detail), /PAID SECRET|ACCOUNT SECRET|DRAFT SECRET/);
  assert.equal((await store.getPublic(paid.slug))?.bodyMarkdown, null);
  assert.equal((await store.getPublic(account.slug))?.bodyMarkdown, null);
  assert.equal((await store.getPublic(article.slug))?.bodyMarkdown, 'Public text');
});

test('a shared lesson stays one record across courses, with section ownership and atomic ordering', async () => {
  const course = await draft('COURSE'); const other = await draft('COURSE');
  const first = await draft('LESSON'); const second = await draft('LESSON');
  const section = await store.createSection(course.id, 'Getting started', 0);
  await store.replaceItems(course.id, [{resourceId: first.id, sectionId: section.id}, {resourceId: second.id}]);
  await store.replaceItems(other.id, [{resourceId: first.id}]);
  await db.resourceContent.update({where: {resourceId: first.id}, data: {bodyMarkdown: 'Changed once'}});
  assert.equal(await db.resource.count({where: {id: first.id}}), 1);
  assert.equal(await db.resourceItem.count({where: {resourceId: first.id}}), 2);
  await store.replaceItems(course.id, [{resourceId: second.id}, {resourceId: first.id, sectionId: section.id}]);
  assert.deepEqual((await db.resourceItem.findMany({where: {collectionId: course.id}, orderBy: {position: 'asc'}})).map(row => row.resourceId), [second.id, first.id]);
  await assert.rejects(store.replaceItems(other.id, [{resourceId: second.id, sectionId: section.id}]));
  assert.equal((await db.resourceItem.findFirst({where: {collectionId: other.id}}))?.resourceId, first.id);
});

test('PostgreSQL rejects cycles, invalid parent types, duplicate ordering and type-change bypasses', async () => {
  const first = await draft('PATH'); const second = await draft('PATH'); const third = await draft('PATH');
  const course = await draft('COURSE'); const lesson = await draft('LESSON'); const article = await draft();
  await item(first.id, second.id); await item(second.id, third.id);
  await assert.rejects(item(third.id, first.id));
  await assert.rejects(item(first.id, first.id, 1));
  await assert.rejects(item(article.id, lesson.id));
  await assert.rejects(item(course.id, article.id));
  await item(course.id, lesson.id);
  await assert.rejects(db.resource.update({where: {id: lesson.id}, data: {type: 'ARTICLE'}}));
  await assert.rejects(db.resource.update({where: {id: first.id}, data: {type: 'ARTICLE'}}));
  await assert.rejects(item(first.id, article.id, 0));
  await assert.rejects(db.resource.update({where: {id: article.id}, data: {priceMinor: 10}}));
  await assert.rejects(db.resource.update({where: {id: article.id}, data: {status: 'PUBLISHED'}}));
});

test('concurrent opposite graph edits cannot both commit', async () => {
  const first = await draft('PATH'); const second = await draft('PATH');
  const result = await Promise.allSettled([item(first.id, second.id), item(second.id, first.id)]);
  assert.equal(result.filter(value => value.status === 'fulfilled').length, 1);
  assert.equal(result.filter(value => value.status === 'rejected').length, 1);
});
