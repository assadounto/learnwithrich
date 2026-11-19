import {PrismaClient} from '../generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';

// Used by trusted scripts/tests. App code imports the server-only database wrapper.
export function createDatabase(connectionString: string) {
  if (!/^postgres(?:ql)?:\/\//.test(connectionString)) throw new Error('A PostgreSQL DATABASE_URL is required.');
  const adapter = new PrismaPg({connectionString, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000});
  return new PrismaClient({adapter});
}
export type Database = ReturnType<typeof createDatabase>;
