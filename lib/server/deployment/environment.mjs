export function validateProductionEnvironment(env) {
  const errors = [];
  const required = ['DATABASE_URL','APP_URL','LWR_AUTH_URL','LWR_AUTH_SECRET','LWR_GOOGLE_CLIENT_ID','LWR_GOOGLE_CLIENT_SECRET'];
  for (const key of required) if (!env[key] || /REPLACE_|your-owned|generate-a-random/i.test(env[key])) errors.push(`${key} must be configured.`);
  for (const key of ['APP_URL','LWR_AUTH_URL']) {
    try { const url = new URL(env[key]); if(url.protocol !== 'https:' || url.origin !== env[key]) errors.push(`${key} must be an exact HTTPS origin.`); }
    catch { errors.push(`${key} is invalid.`); }
  }
  if(env.APP_URL !== env.LWR_AUTH_URL) errors.push('APP_URL and LWR_AUTH_URL must match.');
  if((env.LWR_AUTH_SECRET?.length ?? 0) < 32) errors.push('LWR_AUTH_SECRET must contain at least 32 characters.');
  try { const url = new URL(env.DATABASE_URL); if(!['postgres:', 'postgresql:'].includes(url.protocol) || /local-development-only|REPLACE_/.test(url.password)) errors.push('DATABASE_URL must use production PostgreSQL credentials.'); }
  catch {errors.push('DATABASE_URL is invalid.');}
  if(!['false','true'].includes(env.LWR_ADMIN_ENABLED ?? '')) errors.push('Set LWR_ADMIN_ENABLED explicitly.');
  // Public admin is gated until the MFA milestone is installed.
  if(env.LWR_ADMIN_ENABLED === 'true') errors.push('Public admin requires the MFA release; keep LWR_ADMIN_ENABLED=false for this release.');
  return [...new Set(errors)];
}
