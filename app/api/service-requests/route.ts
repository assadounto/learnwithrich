import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {jsonObject, submissionIpHash, validEmail} from '@/lib/server/community/submissions';
import {deleteMediaObject, detectMediaMime, saveMedia} from '@/lib/server/media/library';
import {serviceOfferings, voiceMaxBytes} from '@/lib/service-offerings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const currencies = ['GHS','USD','GBP','EUR'];
const maxBody = voiceMaxBytes + 64 * 1024;
const audioTypes = new Set(['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm']);

class RequestInputError extends Error {
  constructor(message: string, readonly status = 400) {super(message);}
}

async function requestFields(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  const multipart = contentType.startsWith('multipart/form-data;');
  if (!multipart && !contentType.startsWith('application/json')) throw new RequestInputError('Send a written or audio brief.');
  const limit = multipart ? maxBody : 64 * 1024;
  const reader = request.body?.getReader();
  if (!reader) throw new RequestInputError('The request is empty.');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > limit) {
        await reader.cancel();
        throw new RequestInputError('The request exceeds the upload limit.', 413);
      }
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  const body = new Request(request.url, {method: 'POST', headers: {'Content-Type': contentType}, body: new Uint8Array(Buffer.concat(chunks))});
  try {
    if (!multipart) return {value: jsonObject(await body.json()), voice: null};
    const form = await body.formData();
    const entry = form.get('voice');
    if (entry !== null && !(entry instanceof File)) throw new RequestInputError('Choose an audio file.');
    return {value: jsonObject(Object.fromEntries(form)), voice: entry instanceof File && entry.size ? entry : null};
  } catch (error) {
    if (error instanceof RequestInputError) throw error;
    throw new RequestInputError('Check the form fields and try again.');
  }
}


export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({error: 'Sign in to create a service request.'}, {status: 401});
  if (['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') ?? '')) return Response.json({error: 'Send the request from LearnWithRich.'}, {status: 403});
  let stagedAssetId: string | undefined;
  try {
    const {value, voice} = await requestFields(request);
    if (!value) return Response.json({error: 'Check the form fields and try again.'}, {status: 400});
    if (typeof value.website === 'string' && value.website.trim()) return Response.json({received: true}, {status: 202});
    // Requester identity always comes from the authenticated account, never the browser payload.
    const name = user.name.trim();
    const email = user.email.trim().toLowerCase();
    const phone = typeof value.phone === 'string' ? value.phone.trim().replace(/\s+/g, ' ') : '';
    const description = typeof value.description === 'string' ? value.description.trim() : '';
    const serviceType = typeof value.serviceType === 'string' ? value.serviceType : '';
    const timeline = typeof value.timeline === 'string' ? value.timeline.trim().slice(0, 160) : '';
    const currency = typeof value.currency === 'string' ? value.currency.toUpperCase() : 'GHS';
    const budgetText = typeof value.budget === 'string' ? value.budget.trim() : '';
    let budgetMinor: number | null = null;
    if (budgetText) {
      if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(budgetText)) return Response.json({error: 'Enter a budget using up to two decimal places.'}, {status: 400});
      budgetMinor = Math.round(Number(budgetText) * 100);
      if (!Number.isSafeInteger(budgetMinor) || budgetMinor < 1 || budgetMinor > 2147483647) return Response.json({error: 'Enter a valid project budget.'}, {status: 400});
    }
    if (name.length < 2 || name.length > 120 || !validEmail(email) || phone.length < 7 || phone.length > 32 || !/^[+\d][\d\s().-]{5,30}$/.test(phone) || (!voice && description.length < 50) || description.length > 6000 || !serviceOfferings.some(item => item.id === serviceType) || !currencies.includes(currency)) return Response.json({error: 'Add a valid phone number and service type, plus a written brief of 50 to 6,000 characters or an audio brief.'}, {status: 400});
    const db = database(), ipHash = submissionIpHash(request), since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = {createdAt: {gte: since}, OR: [{userId: user.id}, ...(ipHash ? [{ipHash}] : [])]};
    if (await db.serviceRequest.count({where: recent}) >= 4) throw new RequestInputError('Please wait a while before sending another request.', 429);
    if (voice) {
      if (voice.size > voiceMaxBytes) throw new RequestInputError('The audio brief must be 8 MB or smaller.', 413);
      const source = new Uint8Array(await voice.arrayBuffer());
      const audioName = /\.(?:weba|webm)$/i.test(voice.name) && (!voice.type || voice.type.split(';')[0] === 'audio/webm') ? 'voice-brief.weba' : voice.name;
      const mime = detectMediaMime(source, audioName);
      if (!mime || !audioTypes.has(mime)) throw new RequestInputError('Use an MP3, M4A, WAV, OGG, or WebM audio file.');
      const extension = ({'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/webm': 'weba'} as Record<string, string>)[mime];
      const asset = await saveMedia(db, new File([source], `voice-brief.${extension}`, {type: mime}), null);
      stagedAssetId = asset.id;
    }
    const item = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${user.id}, 18427655))`;
      if (await tx.serviceRequest.count({where: recent}) >= 4) throw new RequestInputError('Please wait a while before sending another request.', 429);
      return tx.serviceRequest.create({data: {
        requesterName: name, requesterEmail: email, requesterPhone: phone, serviceType,
        description: description || 'Voice brief attached.', budgetMinor, currency, timeline: timeline || null, ipHash, userId: user.id,
        ...(stagedAssetId ? {files: {create: {mediaAssetId: stagedAssetId, position: 0}}} : {}),
      }, select: {id: true}});
    });
    stagedAssetId = undefined;
    return Response.json({received: true, id: item.id, requestCode: item.id.slice(0, 8).toUpperCase(), message: 'Your request is in the queue. Track the quote, payment, and revisions from your account.'}, {status: 201});
  } catch (error) {
    if (stagedAssetId) {
      const removed = await database().mediaAsset.delete({where: {id: stagedAssetId}, select: {storageKey: true}}).catch(() => null);
      if (removed) await deleteMediaObject(removed.storageKey).catch(() => undefined);
    }
    if (error instanceof RequestInputError) return Response.json({error: error.message}, {status: error.status});
    return Response.json({error: 'We could not save your request right now. Please try again.'}, {status: 500});
  }
}
