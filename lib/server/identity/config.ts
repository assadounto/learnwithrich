export type IdentityConfig = {baseURL: string; secret: string; googleId: string; googleSecret: string};
export function identityConfig(env: Record<string, string | undefined> = process.env): IdentityConfig {
  const {LWR_AUTH_URL, LWR_AUTH_SECRET, LWR_GOOGLE_CLIENT_ID, LWR_GOOGLE_CLIENT_SECRET} = env;
  if (!LWR_AUTH_URL || !LWR_AUTH_SECRET || !LWR_GOOGLE_CLIENT_ID || !LWR_GOOGLE_CLIENT_SECRET) throw new Error('Owner sign-in is not configured.');
  const url = new URL(LWR_AUTH_URL);
  if (url.origin !== LWR_AUTH_URL || url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new Error('Use an HTTPS origin for LWR_AUTH_URL, or localhost for development.');
  if (LWR_AUTH_SECRET.length < 32) throw new Error('LWR_AUTH_SECRET must have at least 32 characters.');
  return {baseURL: url.origin, secret: LWR_AUTH_SECRET, googleId: LWR_GOOGLE_CLIENT_ID, googleSecret: LWR_GOOGLE_CLIENT_SECRET};
}
