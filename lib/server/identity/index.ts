import 'server-only';
import {database} from '../database';
import {identityConfig} from './config';
import {createIdentity} from './factory';
let instance: ReturnType<typeof createIdentity> | undefined;
export function identity() { return instance ??= createIdentity(database(), identityConfig()); }
export function identityReady() {
  try { identityConfig(); return Boolean(process.env.DATABASE_URL); } catch { return false; }
}
