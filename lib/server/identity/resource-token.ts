import 'server-only';

import {createHash, randomBytes} from 'node:crypto';
import type {Prisma} from '@/lib/generated/prisma/client';
import {database} from '../database';
import type {Database} from '../database-client';
import {requireOwner} from './access';
import {assertOwner, OwnerAccessError} from './owner';

type TokenDb = Database | Prisma.TransactionClient;

export class ResourceTokenError extends Error {
  constructor(message: string, readonly status = 401) { super(message); }
}

export function resourceTokenDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function generateResourceToken() {
  const secret = randomBytes(32).toString('base64url');
  const token = `lwr_res_${secret}`;
  return {token, digest: resourceTokenDigest(token), hint: secret.slice(-8)};
}

function tokenDenied() { return new ResourceTokenError('Use a valid resource API token.'); }

export async function resourceApiAccess(request: Request, scope: 'upload' | 'edit', allowSession = false) {
  const authorization = request.headers.get('authorization');
  if (authorization === null && allowSession) {
    let owner;
    try { owner = await requireOwner(); } catch { throw new ResourceTokenError('Sign in to the creator studio or use a resource API token.'); }
    return {id: owner.id, sessionId: owner.sessionId, automation: undefined};
  }

  const match = authorization?.match(/^Bearer (lwr_res_[A-Za-z0-9_-]{43})$/i);
  if (process.env.LWR_ADMIN_ENABLED === 'false' || !match) throw tokenDenied();
  const digest = resourceTokenDigest(match[1]);

  async function assertActive(db: TokenDb, expectedOwner?: string) {
    const token = await db.resourceApiToken.findUnique({where: {digest}, select: {
      ownerId: true, canEdit: true, expiresAt: true, revokedAt: true, createdAt: true,
      owner: {select: {mfa: {select: {enabledAt: true}}}},
    }});
    const enabledAt = token?.owner.mfa?.enabledAt;
    if (!token || token.revokedAt || token.expiresAt <= new Date() || !enabledAt || enabledAt > token.createdAt
      || (expectedOwner && token.ownerId !== expectedOwner)) throw tokenDenied();
    if (scope === 'edit' && !token.canEdit) throw new ResourceTokenError('This token can upload packages only.', 403);
    return token.ownerId;
  }

  const db = database();
  const id = await assertActive(db);
  try { await assertOwner(db, id); }
  catch (error) { if (error instanceof OwnerAccessError) throw tokenDenied(); throw error; }
  return {id, sessionId: undefined, automation: async (target: TokenDb) => {await assertActive(target, id);}};
}
