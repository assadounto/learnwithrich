export function validateProductionEnvironment(env) {
  const errors = [];
  const required = ['DATABASE_URL','LWR_AUTH_URL','LWR_AUTH_SECRET','LWR_GOOGLE_CLIENT_ID','LWR_GOOGLE_CLIENT_SECRET','S3_REGION','S3_BUCKET','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY','PAYSTACK_SECRET_KEY'];
  for (const key of required) if (!env[key] || /REPLACE_|your-owned|generate-a-random/i.test(env[key])) errors.push(`${key} must be configured.`);
  try { const url = new URL(env.LWR_AUTH_URL); if(url.protocol !== 'https:' || url.origin !== env.LWR_AUTH_URL) errors.push('LWR_AUTH_URL must be an exact HTTPS origin.'); }
  catch { errors.push('LWR_AUTH_URL is invalid.'); }
  if((env.LWR_AUTH_SECRET?.length ?? 0) < 32) errors.push('LWR_AUTH_SECRET must contain at least 32 characters.');
  try { const url = new URL(env.DATABASE_URL); if(!['postgres:', 'postgresql:'].includes(url.protocol) || /local-development-only|REPLACE_/.test(url.password)) errors.push('DATABASE_URL must use production PostgreSQL credentials.'); }
  catch {errors.push('DATABASE_URL is invalid.');}
  if(!['false','true'].includes(env.LWR_ADMIN_ENABLED ?? '')) errors.push('Set LWR_ADMIN_ENABLED explicitly.');
  if(env.S3_ENDPOINT_URL){try{const endpoint=new URL(env.S3_ENDPOINT_URL);if((endpoint.protocol!=='https:'&&!(endpoint.protocol==='http:'&&['localhost','127.0.0.1'].includes(endpoint.hostname)))||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)errors.push('S3_ENDPOINT_URL must be a clean HTTPS endpoint.');}catch{errors.push('S3_ENDPOINT_URL is invalid.');}}
  return [...new Set(errors)];
}
