import 'server-only';
import {ResourceInputError} from '@/lib/server/resources/validation';
import {ResourceTokenError} from '@/lib/server/identity/resource-token';

export async function authoringJson(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new ResourceInputError('Send a JSON body.');
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 4096) { await reader.cancel(); throw new ResourceTokenError('The publish request exceeds 4 KiB.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  } catch { /* Show the same input error for malformed and non-object JSON. */ }
  throw new ResourceInputError('Send a JSON object.');
}

export const authoringHeaders = {'Cache-Control': 'no-store'};
