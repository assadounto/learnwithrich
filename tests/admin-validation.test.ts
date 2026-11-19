import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {collectionInput, adminDraft, editToken} from '../lib/server/admin/input.ts';
import {identityConfig} from '../lib/server/identity/config.ts';
import {priceToMinor, moveItem} from '../lib/resource-editor.ts';

test('editor uses decimal strings for exact minor-unit prices', () => {
  assert.equal(priceToMinor('149.99'), 14999);
  assert.equal(priceToMinor('0.01'), 1);
  assert.equal(priceToMinor('12.3'), 1230);
  for (const value of ['0', '-1', '1.001', '1e3', 'NaN', '99999999.99']) assert.throws(() => priceToMinor(value));
  assert.deepEqual(moveItem(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c']);
  assert.deepEqual(moveItem(['a'], 0, -1), ['a']);
});
test('editor validates unique collection membership and owned sections before writes', () => {
  const key = randomUUID(), resourceId = randomUUID();
  assert.equal(collectionInput('PATH', [{key, title: 'Start'}], [{resourceId, sectionKey: key}]).items[0].sectionKey, key);
  assert.throws(() => collectionInput('ARTICLE', [], [{resourceId}]));
  assert.throws(() => collectionInput('PATH', [], [{resourceId, sectionKey: key}]));
  assert.throws(() => collectionInput('PATH', [], [{resourceId}, {resourceId}]));
  assert.throws(() => collectionInput('PATH', [{key, title: ''}], []));
  assert.throws(() => editToken(1, 'invalid'));
  const draft = adminDraft({title: 'Test', slug: 'test', type: 'ARTICLE', role: 'OWNER', status: 'PUBLISHED'});
  assert.ok(!('role' in draft)); assert.ok(!('status' in draft));
});
test('identity configuration requires separate credentials and a trusted origin', () => {
  const base = {LWR_AUTH_URL: 'https://learn.example', LWR_AUTH_SECRET: 'x'.repeat(32), LWR_GOOGLE_CLIENT_ID: 'client', LWR_GOOGLE_CLIENT_SECRET: 'secret'};
  assert.equal(identityConfig(base).baseURL, 'https://learn.example');
  assert.equal(identityConfig({...base, LWR_AUTH_URL: 'http://localhost:3000'}).baseURL, 'http://localhost:3000');
  for (const value of ['http://public.example', 'https://learn.example/path', 'https://user:secret@learn.example', 'https://learn.example/']) assert.throws(() => identityConfig({...base, LWR_AUTH_URL: value}));
  assert.throws(() => identityConfig({...base, LWR_AUTH_SECRET: 'short'}));
  assert.throws(() => identityConfig({}));
});

test('type-specific details reject misplaced fields, unsafe links and invalid measurements', async () => {
  const {normalizeDetails} = await import('../lib/server/resources/validation.ts');
  const {publishingIssues, slugFromTitle} = await import('../lib/resource-types.ts');
  assert.deepEqual(normalizeDetails('PROJECT', {difficulty: 'Beginner', durationMinutes: 45, materials: ['1 × ESP32'], repositoryUrl: 'https://github.com/example/project'}), {difficulty: 'Beginner', durationMinutes: 45, materials: ['1 × ESP32'], repositoryUrl: 'https://github.com/example/project'});
  for (const input of [{fileUrl: 'javascript:alert(1)'}, {fileUrl: 'http://example.test/file'}, {fileUrl: 'https://user:secret@example.test/file'}, {width: -1}, {width: 1.5}, {unknown: 'value'}]) assert.throws(() => normalizeDetails('ILLUSTRATION', input));
  assert.throws(() => normalizeDetails('ARTICLE', {materials: ['wrong type']}));
  assert.throws(() => normalizeDetails('PROJECT', {difficulty: 'Expert-ish'}));
  assert.throws(() => normalizeDetails('PROJECT', {materials: ['x'.repeat(501)]}));
  assert.equal(slugFromTitle('Build a Solar Monitor!'), 'build-a-solar-monitor');
  assert.ok(publishingIssues({type: 'DOWNLOAD', summary: 'A download', bodyMarkdown: '', details: {}, itemCount: 0}).some(issue => issue.includes('file URL')));
  assert.deepEqual(publishingIssues({type: 'LESSON', summary: 'A video lesson', bodyMarkdown: '', details: {videoUrl: 'https://video.example.test/lesson'}, itemCount: 0}), []);
  assert.ok(publishingIssues({type: 'COURSE', summary: 'A course', bodyMarkdown: '', details: {}, itemCount: 0}).length);
});
