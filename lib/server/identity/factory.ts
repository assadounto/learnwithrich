import {betterAuth} from 'better-auth/minimal';
import {prismaAdapter} from 'better-auth/adapters/prisma';
import type {Database} from '../database-client';
import type {IdentityConfig} from './config';

export function createIdentity(db: Database, config: IdentityConfig) {
  return betterAuth({
    appName: 'LearnWithRich', baseURL: config.baseURL, basePath: '/api/identity', secret: config.secret,
    database: prismaAdapter(db, {provider: 'postgresql'}),
    trustedOrigins: [config.baseURL],
    socialProviders: {google: {clientId: config.googleId, clientSecret: config.googleSecret}},
    emailAndPassword: {enabled: false},
    user: {additionalFields: {role: {type: 'string', defaultValue: 'LEARNER', input: false}}},
    account: {accountLinking: {enabled: false}, encryptOAuthTokens: true},
    session: {expiresIn: 60 * 60 * 24, updateAge: 60 * 60, cookieCache: {enabled: false}},
    rateLimit: {enabled: true, storage: 'database', window: 60, max: 100},
    advanced: {
      cookiePrefix: 'lwr_identity', useSecureCookies: config.baseURL.startsWith('https:'),
      // Untrusted forwarded headers must not bypass the limiter. Configure a
      // trusted proxy before enabling per-client IP tracking in production.
      ipAddress: {ipAddressHeaders: []},
    },
  });
}
