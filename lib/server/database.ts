import 'server-only';
import {createDatabase, type Database} from './database-client';

const state = globalThis as typeof globalThis & {lwrDatabase?: Database};
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('Resource database is not configured.');
  return state.lwrDatabase ??= createDatabase(process.env.DATABASE_URL);
}
