import 'server-only';
import {createHmac, randomUUID, timingSafeEqual} from 'node:crypto';
import type {Database} from '../database-client';

type PaystackTransaction = {id?: number | string; status?: string; reference?: string; amount?: number; currency?: string; customer?: {email?: string}};
type PaystackResponse = {status?: boolean; message?: string; data?: PaystackTransaction & {authorization_url?: string; access_code?: string}};
function secret() {
  const value = process.env.PAYSTACK_SECRET_KEY;
  if (!value || /REPLACE_/.test(value)) throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  return value;
}
async function callPaystack<T extends PaystackResponse>(endpoint: string, init: RequestInit): Promise<T> {
  const response = await fetch(`https://api.paystack.co${endpoint}`, { ...init, headers: {'Authorization': `Bearer ${secret()}`, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...init.headers}, cache: 'no-store', signal: AbortSignal.timeout(15000)});
  const result = await response.json() as T;
  if (!response.ok || !result.status) throw new Error('Paystack could not complete the payment request.');
  return result;
}
export async function initializePaystack(input: {email: string; amountMinor: number; currency: string; reference: string}) {
  const baseUrl = process.env.LWR_AUTH_URL;
  if (!baseUrl) throw new Error('LWR_AUTH_URL is not configured.');
  const result = await callPaystack('/transaction/initialize', {method: 'POST', body: JSON.stringify({email: input.email, amount: input.amountMinor, currency: input.currency, reference: input.reference, callback_url: new URL('/account?payment=return', baseUrl).toString(), metadata: {source: 'learnwithrich', payment_reference: input.reference}})});
  const authorizationUrl = result.data?.authorization_url;
  if (!authorizationUrl) throw new Error('Paystack did not return a checkout link.');
  const parsed = new URL(authorizationUrl);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'checkout.paystack.com') throw new Error('Paystack returned an unexpected checkout URL.');
  return authorizationUrl;
}
export async function verifyPaystack(reference: string) {
  const result = await callPaystack(`/transaction/verify/${encodeURIComponent(reference)}`, {method: 'GET'});
  if (!result.data) throw new Error('Paystack did not return a transaction.');
  return result.data;
}
export async function settleVerifiedPurchase(db: Database, reference: string, transaction: PaystackTransaction) {
  const purchase = await db.purchase.findUnique({where: {reference}, include: {user: {select: {email: true}}}});
  if (!purchase) return {ok: false as const, reason: 'unknown_purchase'};
  if (purchase.status === 'PAID') return {ok: true as const, alreadyPaid: true};
  if (transaction.status !== 'success' || transaction.reference !== reference || transaction.amount !== purchase.amountMinor || transaction.currency?.toUpperCase() !== purchase.currency || (transaction.customer?.email && transaction.customer.email.toLowerCase() !== purchase.user.email.toLowerCase())) {
    return {ok: false as const, reason: 'transaction_mismatch'};
  }
  const changed = await db.purchase.updateMany({where: {id: purchase.id, status: 'PENDING'}, data: {status: 'PAID', paidAt: new Date(), paystackId: transaction.id == null ? null : String(transaction.id)}});
  if (!changed.count) {
    const latest = await db.purchase.findUnique({where: {id: purchase.id}, select: {status: true}});
    return latest?.status === 'PAID' ? {ok: true as const, alreadyPaid: true} : {ok: false as const, reason: 'purchase_not_pending'};
  }
  return {ok: true as const, alreadyPaid: false};
}
export function newPaymentReference() {return `LWR_${randomUUID().replaceAll('-', '')}`;}
function safeEqualHex(expected: Buffer, candidate: string) {
  if (!/^[a-f\d]{128}$/i.test(candidate)) return false;
  const actual = Buffer.from(candidate, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function verifyPaystackWebhook(rawBody: Buffer, headers: Headers, now = Date.now()) {
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
  const signature = headers.get('paystack-signature');
  if (signature && webhookSecret && !/REPLACE_/.test(webhookSecret)) {
    let timestamp = '', signatures: string[] = [];
    for (const part of signature.split(',')) {
      const [key, ...value] = part.trim().split('=');
      if (key === 't') timestamp = value.join('=');
      if (key === 'v1') signatures.push(value.join('='));
    }
    const seconds = Number(timestamp);
    if (!Number.isSafeInteger(seconds) || Math.abs(Math.floor(now / 1000) - seconds) > 300) return false;
    const expected = createHmac('sha512', webhookSecret).update(`${timestamp}.`).update(rawBody).digest();
    return signatures.some(value => {const signatureValue = value.split(':').at(-1) ?? ''; return safeEqualHex(expected, signatureValue);});
  }
  // Paystack also sends this signature while a webhook signing secret is not configured.
  const oldSignature = headers.get('x-paystack-signature');
  const apiSecret = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(oldSignature && apiSecret && safeEqualHex(createHmac('sha512', apiSecret).update(rawBody).digest(), oldSignature));
}
