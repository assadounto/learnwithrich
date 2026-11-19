import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalogQuery, normalizeTags, resourceSlug, validateDraft} from '../lib/server/resources/validation.ts';

test('resource types share a catalog without confusing topics with types', () => {
  for (const type of ['PROJECT', 'ARTICLE', 'COURSE', 'PATH', 'LESSON', 'DOWNLOAD', 'BOOK', 'GUIDE', 'ILLUSTRATION']) {
    assert.equal(validateDraft({slug: 'first-resource', title: 'A useful idea', type}).type, type);
  }
  assert.throws(() => validateDraft({slug: 'x', title: 'x', type: 'Electronics'}));
});
test('resource inputs reject unsafe slugs, prices, cover URLs and oversized bodies', () => {
  const base = {slug: 'a-resource', title: 'A resource', type: 'ARTICLE'};
  for (const slug of ['../admin', 'MixedCase', 'x?published=true', '', 'a/b']) assert.throws(() => resourceSlug(slug));
  for (const change of [{priceMinor: 1}, {access: 'PAID'}, {access: 'PAID', priceMinor: 1.5}, {priceMinor: -1}, {currency: 'ghs'}, {coverUrl: 'javascript:alert(1)'}, {coverUrl: 'https://user:secret@example.test/a'}, {bodyMarkdown: 'x'.repeat(200001)}]) assert.throws(() => validateDraft({...base, ...change}));
  assert.equal(validateDraft({...base, access: 'PAID', priceMinor: 100}).priceMinor, 100);
  assert.deepEqual(normalizeTags([' ESP32 ', 'esp32', 'Solar']), ['esp32', 'solar']);
});
test('public catalog queries bound pagination and whitelist resource types', () => {
  assert.deepEqual(catalogQuery(new URLSearchParams('type=path&q=solar&tag=ESP32')), {type: 'PATH', query: 'solar', tag: 'esp32', page: 1, limit: 12});
  for (const query of ['page=0', 'page=1.2', 'page=1001', 'limit=100000', 'limit=-1', 'type=secret', `q=${'x'.repeat(201)}`]) assert.throws(() => catalogQuery(new URLSearchParams(query)));
});
