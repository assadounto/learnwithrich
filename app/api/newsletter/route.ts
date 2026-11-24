import {submissionIpHash, validEmail} from '@/lib/server/community/submissions';
import {database} from '@/lib/server/database';

const headers = {'Cache-Control': 'no-store'};
const accepted = () => Response.json({received: true}, {status: 202, headers});
const maxBody = 2048;

export async function POST(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return Response.json({error: 'Open LearnWithRich to subscribe.'}, {status: 403, headers});
  }

  const reader = request.body?.getReader();
  if (!reader) return Response.json({error: 'Enter a valid email address.'}, {status: 400, headers});
  const decoder = new TextDecoder();
  let body = '', size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > maxBody) {
        await reader.cancel();
        return Response.json({error: 'The signup request is too large.'}, {status: 413, headers});
      }
      body += decoder.decode(chunk.value, {stream: true});
    }
    body += decoder.decode();
  } catch {
    return Response.json({error: 'Could not read your signup. Please try again.'}, {status: 400, headers});
  } finally { reader.releaseLock(); }

  let value: {email?: unknown; website?: unknown} | null;
  try { value = JSON.parse(body); }
  catch { return Response.json({error: 'Enter a valid email address.'}, {status: 400, headers}); }
  if (value?.website) return accepted();
  const email = typeof value?.email === 'string' ? value.email.trim().toLowerCase() : '';
  if (!validEmail(email)) return Response.json({error: 'Enter a valid email address.'}, {status: 400, headers});

  try {
    const db = database();
    const ipHash = submissionIpHash(request);
    if (ipHash && await db.newsletterSignup.count({
      where: {ipHash, createdAt: {gte: new Date(Date.now() - 3_600_000)}},
    }) >= 10) return Response.json({error: 'Too many signups. Please try again later.'}, {status: 429, headers});
    await db.newsletterSignup.createMany({data: {email, ipHash}, skipDuplicates: true});
    return accepted();
  } catch {
    return Response.json({error: 'We couldn’t save your signup. Please try again.'}, {status: 503, headers});
  }
}
