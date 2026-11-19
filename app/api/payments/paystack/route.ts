import {database} from '@/lib/server/database';
import {settleVerifiedPurchase, verifyPaystack, verifyPaystackWebhook} from '@/lib/server/payments/paystack';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  if (rawBody.byteLength > 256 * 1024 || !verifyPaystackWebhook(rawBody, request.headers)) return new Response('Invalid webhook signature', {status: 401});
  let event: {event?: string; data?: {reference?: string}};
  try {event = JSON.parse(rawBody.toString('utf8'));} catch {return new Response('Invalid JSON', {status: 400});}
  if (event.event !== 'charge.success' || typeof event.data?.reference !== 'string') return Response.json({received: true});
  try {
    const transaction = await verifyPaystack(event.data.reference);
    const result = await settleVerifiedPurchase(database(), event.data.reference, transaction);
    if (!result.ok && result.reason === 'transaction_mismatch') return new Response('Transaction did not match the stored order', {status: 200});
    return Response.json({received: true});
  } catch {
    return new Response('Could not verify transaction; retry delivery', {status: 503});
  }
}
