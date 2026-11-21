import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomBytes, randomUUID} from 'node:crypto';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import {makeSignature} from 'better-auth/crypto';
import {createOTP} from '@better-auth/utils/otp';
import {base32} from '@better-auth/utils/base32';
import {resourceDefinitions} from '../lib/resource-types';
import {createDatabase} from '../lib/server/database-client';

if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a separate local test database.');
const testUrl = new URL(process.env.TEST_DATABASE_URL);
if (!['postgres:', 'postgresql:'].includes(testUrl.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(testUrl.hostname) || !decodeURIComponent(testUrl.pathname).endsWith('_test')) throw new Error('Only a local PostgreSQL database ending in _test is accepted.');
const listener = createServer(); listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
const address = listener.address(); if (!address || typeof address === 'string') throw new Error('No test port.');
const port = address.port; await new Promise<void>(resolve => listener.close(() => resolve()));
const origin = `http://127.0.0.1:${port}`, secret = randomBytes(32).toString('hex');
const db = createDatabase(process.env.TEST_DATABASE_URL);
const prefix = `http-admin-${randomUUID()}`;
const ownerId = `${prefix}-owner`, learnerId = `${prefix}-learner`;
const ids: string[] = [];
let output = '';
const server = spawn(process.execPath, ['.next/standalone/server.js'], {env: {
  ...process.env, NODE_ENV: 'production', HOSTNAME: '127.0.0.1', PORT: String(port),
  DATABASE_URL: process.env.TEST_DATABASE_URL, LWR_AUTH_URL: origin, LWR_ADMIN_ENABLED: 'true',
  LWR_AUTH_SECRET: secret, LWR_GOOGLE_CLIENT_ID: 'http-test-client', LWR_GOOGLE_CLIENT_SECRET: 'http-test-secret',
}, stdio: ['ignore', 'pipe', 'pipe']});
server.stdout.on('data', value => {output += value.toString();});
server.stderr.on('data', value => {output += value.toString();});
async function cookie(userId: string) {
  const token = randomBytes(32).toString('hex');
  await db.session.create({data: {id: randomUUID(), userId, token, expiresAt: new Date(Date.now() + 3600000)}});
  return `lwr_identity.session_token=${encodeURIComponent(`${token}.${await makeSignature(token, secret)}`)}`;
}
const request = (path: string, cookie = '') => fetch(origin + path, {headers: cookie ? {cookie} : {}, redirect: 'manual'});
async function expectRedirect(response: Response, destination: string) {
  const body = await response.text();
  assert.ok([200, 307].includes(response.status));
  const streamed = body.includes(`NEXT_REDIRECT;replace;${destination};307;`) || body.includes(`url=${destination}`);
  assert.ok(response.headers.get('location')?.endsWith(destination) || streamed, `Missing redirect to ${destination}`);
  assert.doesNotMatch(body, /Private until published/);
}
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {if ((await request('/api/health')).ok) break;} catch {}
    if (server.exitCode !== null) throw new Error(`Server stopped: ${output}`);
    if (attempt === 99) throw new Error(`Server did not start: ${output}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  for (const [id, role] of [[ownerId, 'OWNER'], [learnerId, 'LEARNER']] as const) await db.user.create({data: {id, name: 'HTTP test creator', email: `${id}@example.test`, emailVerified: true, role, accounts: {create: {id: randomUUID(), providerId: 'google', accountId: id}}}});
  const ownerCookie = await cookie(ownerId), learnerCookie = await cookie(learnerId);
  const entry = await request('/admin'); assert.equal(entry.status, 200); assert.match(await entry.text(), /OWNER-ONLY CREATOR SPACE/);
  await expectRedirect(await request('/admin/resources/new', learnerCookie), '/admin/access-denied');
  await expectRedirect(await request('/admin', ownerCookie), '/admin/security');
  await expectRedirect(await request('/admin/resources/new', ownerCookie), '/admin/security');
  const security = await request('/admin/security', ownerCookie); assert.match(await security.text(), /Secure your studio/);
  const manifest = JSON.parse(await readFile('.next/server/server-reference-manifest.json', 'utf8'));
  const actionId = (name: string) => {
    const entry = Object.entries(manifest.node as Record<string, {exportedName?: string}>).find(([, value]) => value.exportedName === name);
    if (!entry) throw new Error(`Missing server action ${name}`); return entry[0];
  };
  const action = async (name: string, args: unknown[], sessionCookie: string, source = origin) => {
    const response = await fetch(origin + (name === 'mfaAction' ? '/admin/security' : '/admin/resources/new'), {method: 'POST', headers: {'Next-Action': actionId(name), 'Content-Type': 'text/plain;charset=UTF-8', origin: source, cookie: sessionCookie}, body: JSON.stringify(args), redirect: 'manual'});
    return {status: response.status, body: await response.text()};
  };
  const payload = {title: 'HTTP resource', slug: prefix, type: 'ARTICLE', summary: 'A practical test resource.', details: {author: 'HTTP test creator', readingMinutes: 7}, bodyMarkdown: 'Private until published', sections: [], items: []};
  await action('saveResource', [{...payload, slug: `${prefix}-anonymous`}], '');
  await action('saveResource', [{...payload, slug: `${prefix}-learner`}], learnerCookie);
  await action('saveResource', [{...payload, slug: `${prefix}-foreign`}], ownerCookie, 'https://outside.example');
  assert.equal(await db.resource.count({where: {slug: {startsWith: prefix}}}), 0);
  // A valid Google session alone cannot invoke private mutations.
  await action('saveResource', [{...payload, slug: `${prefix}-no-mfa`}], ownerCookie);
  assert.equal(await db.resource.count({where: {slug: {startsWith: prefix}}}), 0);
  const setup = await action('mfaAction', ['begin'], ownerCookie);
  const setupSecret = setup.body.match(/"secret":"([A-Z2-7]+)"/)?.[1];
  assert.ok(setupSecret, 'Enrollment action should return a setup key only to the owner');
  const confirmed = await action('mfaAction', ['confirm', await createOTP(base32.decode(setupSecret)).totp()], ownerCookie);
  const codesMatch = confirmed.body.match(/"codes":(\[[^\]]+\])/);
  assert.ok(codesMatch, 'Enrollment must return recovery codes once');
  const codes = JSON.parse(codesMatch[1]) as string[];
  await expectRedirect(await request('/admin', ownerCookie), '/admin/resources');
  const studio = await request('/admin/resources', ownerCookie); assert.equal(studio.status, 200); const studioBody = await studio.text(); assert.match(studioBody, /Your collection/); assert.match(studioBody, /workspace-sidebar/); assert.doesNotMatch(studioBody, /class="site-header|class="reference-footer/);
  const site = await request('/about'); const siteBody = await site.text(); assert.match(siteBody, /site-header/); assert.doesNotMatch(siteBody, /workspace-sidebar/);
  for (const [kind, definition] of Object.entries(resourceDefinitions)) {
    const response = await request(`/admin/resources/new?type=${kind}`, ownerCookie);
    assert.equal(response.status, 200); const body = await response.text();
    assert.ok(body.replace(/<!--.*?-->/g, '').includes(`${definition.name} details`), `Missing type-specific fields for ${kind}`);
  }
  const editor = await request('/admin/resources/new', ownerCookie); assert.equal(editor.status, 200); assert.match(await editor.text(), /The essentials/);
  const created = await action('saveResource', [payload], ownerCookie); assert.equal(created.status, 200, created.body);
  const row = await db.resource.findUniqueOrThrow({where: {slug: prefix}}); ids.push(row.id);
  assert.deepEqual((await db.resourceContent.findUniqueOrThrow({where: {resourceId: row.id}})).details, {author: 'HTTP test creator', readingMinutes: 7});
  assert.equal(row.status, 'DRAFT'); assert.equal(await db.resourceAudit.count({where: {resourceId: row.id, actorId: ownerId}}), 1);
  const savedEditor = await request(`/admin/resources/${row.id}`, ownerCookie); assert.equal(savedEditor.status, 200); assert.match(await savedEditor.text(), /Private until published/);
  await expectRedirect(await request(`/admin/resources/${row.id}`), '/admin');
  await expectRedirect(await request(`/admin/resources/${row.id}`, learnerCookie), '/admin/access-denied');
  assert.equal((await request(`/api/catalog/${prefix}`)).status, 404);
  await db.session.updateMany({where: {userId: ownerId}, data: {mfaVerifiedAt: null}});
  await action('changeResourceStatus', [row.id, row.version, row.updatedAt.toISOString(), 'PUBLISH'], ownerCookie);
  assert.equal((await db.resource.findUniqueOrThrow({where: {id: row.id}})).status, 'DRAFT');
  await action('mfaAction', ['verify', codes[0], true], ownerCookie, 'https://outside.example');
  assert.equal((await db.session.findFirstOrThrow({where: {userId: ownerId}})).mfaVerifiedAt, null);
  await action('mfaAction', ['verify', codes[0], true], ownerCookie);
  await action('changeResourceStatus', [row.id, row.version, row.updatedAt.toISOString(), 'PUBLISH'], ownerCookie);
  const published = await request(`/api/catalog/${prefix}`); assert.equal(published.status, 200); assert.match(await published.text(), /Private until published/);
  const current = await db.resource.findUniqueOrThrow({where: {id: row.id}});
  const stale = await action('saveResource', [{...payload, id: row.id, version: row.version, updatedAt: row.updatedAt.toISOString(), title: 'Stale title'}], ownerCookie);
  assert.match(stale.body, /another tab/); assert.equal((await db.resource.findUniqueOrThrow({where: {id: row.id}})).title, 'HTTP resource');
  await action('changeResourceStatus', [row.id, current.version, current.updatedAt.toISOString(), 'UNPUBLISH'], ownerCookie);
  assert.equal((await request(`/api/catalog/${prefix}`)).status, 404);
  await db.session.updateMany({where: {userId: ownerId}, data: {mfaVerifiedAt: new Date(Date.now() - 16 * 60_000)}});
  await expectRedirect(await request('/admin', ownerCookie), '/admin/security');
  await action('mfaAction', ['verify', codes[1], true], ownerCookie);
  await db.user.update({where: {id: ownerId}, data: {role: 'LEARNER'}});
  await expectRedirect(await request('/admin', ownerCookie), '/admin/access-denied');
  console.log('PASS standalone admin: signed sessions, MFA enrollment/recovery/expiry, Google-only mutation denial, protected pages/actions, cross-origin denial, draft editing, publishing, stale-write protection and role revocation');
} finally {
  server.kill('SIGTERM');
  if (server.exitCode === null) await once(server, 'exit');
  // Include any partially created fixture if an assertion failed after the action.
  const fixtures = await db.resource.findMany({where: {slug: {startsWith: prefix}}, select: {id: true}});
  const resourceIds = [...new Set([...ids, ...fixtures.map(row => row.id)])];
  await db.resourceAudit.deleteMany({where: {resourceId: {in: resourceIds}}});
  await db.resource.deleteMany({where: {id: {in: resourceIds}}});
  await db.user.deleteMany({where: {id: {in: [ownerId, learnerId]}}});
  await db.$disconnect();
}
