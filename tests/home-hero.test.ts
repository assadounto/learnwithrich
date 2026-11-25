import assert from 'node:assert/strict';
import {test} from 'node:test';
import {homepageHeroPresets, homepageHeroSupportsVideo} from '../lib/home-hero.ts';

test('only the two framed hero presets support video playback', () => {
  assert.deepEqual(homepageHeroPresets.filter(homepageHeroSupportsVideo), ['CINEMATIC', 'EDITORIAL']);
});
