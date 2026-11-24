import {publicAnalyticsPath} from '@/lib/page-analytics';
import {database} from '@/lib/server/database';

export const runtime = 'nodejs';
const headers = {'Cache-Control': 'no-store'};
const empty = (status: number) => new Response(null, {status, headers});

async function readPayload(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let body = '', bytes = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) {await reader.cancel(); return null;}
      body += decoder.decode(value, {stream: true});
    }
    return JSON.parse(body + decoder.decode()) as {path?: unknown; source?: unknown; screen?: unknown; visit?: unknown} | null;
  } catch { return null; }
  finally { reader.releaseLock(); }
}

export async function POST(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') return empty(403);
  if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return empty(204);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return empty(415);
  const body = await readPayload(request);
  const path = publicAnalyticsPath(body?.path);
  if (!path || (body?.screen !== 'small' && body?.screen !== 'large')) return empty(400);
  const source = typeof body.source === 'string' && body.source.length <= 100 && /^(?:[a-z0-9-]+\.)+[a-z]{2,63}$/i.test(body.source)
    ? body.source.toLowerCase().replace(/^www\./, '') : '';
  const countryHeader = process.env.ANALYTICS_COUNTRY_HEADER?.trim() || 'cf-ipcountry';
  const countryCode = request.headers.get(countryHeader)?.trim().toUpperCase() ?? '';
  const country = /^[A-Z]{2}$/.test(countryCode) && !['XX', 'ZZ'].includes(countryCode) ? countryCode : '';
  const day = new Date().toISOString().slice(0, 10);
  try {
    await database().$executeRaw`
      INSERT INTO "page_analytics" ("day", "path", "country", "source", "screen", "views", "visits")
      VALUES (${day}::date, ${path}, ${country}, ${source}, ${body.screen}, 1, ${body.visit === true ? 1 : 0})
      ON CONFLICT ("day", "path", "country", "source", "screen") DO UPDATE SET
        "views" = "page_analytics"."views" + EXCLUDED."views",
        "visits" = "page_analytics"."visits" + EXCLUDED."visits"
    `;
    return empty(204);
  } catch { return empty(503); }
}
