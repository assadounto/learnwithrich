import 'dotenv/config';
import {spawnSync} from 'node:child_process';

const connection = process.env.TEST_DATABASE_URL;
if (!connection) throw new Error('Set TEST_DATABASE_URL to a separate local database ending in _test.');
const url = new URL(connection);
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !decodeURIComponent(url.pathname).endsWith('_test')) {
  throw new Error('Integration tests require a local PostgreSQL database ending in _test. Production databases are not accepted.');
}
const env = {...process.env, DATABASE_URL: connection};
for (const args of [
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/integration/resources.test.ts', 'tests/integration/admin.test.ts', 'tests/integration/mfa.test.ts'],
]) {
  const result = spawnSync(process.execPath, args, {stdio: 'inherit', env});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
