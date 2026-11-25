import assert from 'node:assert/strict';
import {test} from 'node:test';
import {pageWindow, paginationItems, requestedPage, studioPageSize} from '../lib/pagination.ts';

test('numbered pagination exposes both edges and reachable jumps across large gaps', () => {
  assert.deepEqual(paginationItems(1, 7).map(item => item.number), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(paginationItems(1, 67).map(item => item.ellipsis ? 'jump' : item.number), [1, 2, 3, 4, 5, 'jump', 66, 67]);
  assert.deepEqual(paginationItems(33, 67).map(item => item.number), [1, 2, 17, 32, 33, 34, 50, 66, 67]);
  assert.deepEqual(paginationItems(67, 67).map(item => item.ellipsis ? 'jump' : item.number), [1, 2, 'jump', 63, 64, 65, 66, 67]);
});

test('Studio limits table sizes and clamps requests to the last populated page', () => {
  assert.equal(studioPageSize('100'), 100);
  assert.equal(studioPageSize('40'), 20);
  assert.equal(studioPageSize(undefined, 50), 50);
  assert.deepEqual(pageWindow(119, 50, requestedPage('19')), {page: 3, pages: 3, skip: 100});
  assert.deepEqual(pageWindow(0, 20, requestedPage(['2'])), {page: 1, pages: 1, skip: 0});
});
