import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterResources, resources } from '../lib/catalog.ts';
test('search is case-insensitive and also finds descriptions',()=>{assert.ok(filterResources(resources,'  SOLAR ','All','All').some(r=>r.slug==='solar-hybrid-power-system'));assert.ok(filterResources(resources,'Rails','All','All').some(r=>r.slug==='build-a-web-app'));});
test('filters intersect rather than overriding each other',()=>{const found=filterResources(resources,'','Project','Electronics & IoT','Free');assert.equal(found.length,2);assert.ok(found.every(r=>r.type==='Project'&&r.topic==='Electronics & IoT'&&r.access==='Free'));assert.equal(filterResources(resources,'','Book','Software').length,0);});
test('slugs are unique and every resource has navigable metadata',()=>{assert.equal(new Set(resources.map(r=>r.slug)).size,resources.length);for(const r of resources){assert.match(r.slug,/^[a-z0-9-]+$/);assert.ok(r.title&&r.description&&r.art)}});
