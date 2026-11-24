import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import {initializeTheme, themeChangeEvent, themePreferenceKey} from '../lib/color-theme.ts';

test('preloads the saved theme, follows the system setting and syncs other tabs', () => {
  const dataset = {theme: '', themePreference: ''};
  const listeners = new Map<string, (event: {key?: string; detail?: string}) => void>();
  const stored = new Map([[themePreferenceKey, 'light']]);
  let onMediaChange = () => {};
  const media = {matches: true, addEventListener(_event: string, listener: () => void) {onMediaChange = listener;}};
  runInNewContext(initializeTheme, {
    document: {documentElement: {dataset}},
    window: {matchMedia: () => media, addEventListener: (name: string, fn: (event: object) => void) => listeners.set(name, fn)},
    localStorage: {getItem: (key: string) => stored.get(key), setItem: (key: string, value: string) => stored.set(key, value),
      removeItem: (key: string) => stored.delete(key)},
  });

  assert.deepEqual(dataset, {theme: 'light', themePreference: 'light'});
  listeners.get(themeChangeEvent)?.({detail: 'system'});
  assert.equal(stored.has(themePreferenceKey), false);
  assert.deepEqual(dataset, {theme: 'dark', themePreference: 'system'});
  media.matches = false;
  onMediaChange();
  assert.equal(dataset.theme, 'light');
  stored.set(themePreferenceKey, 'dark');
  listeners.get('storage')?.({key: themePreferenceKey});
  assert.deepEqual(dataset, {theme: 'dark', themePreference: 'dark'});
  listeners.get(themeChangeEvent)?.({detail: 'light'});
  assert.equal(stored.get(themePreferenceKey), 'light');
  assert.equal(dataset.theme, 'light');
});
