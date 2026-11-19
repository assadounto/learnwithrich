import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {initializePaystack, newPaymentReference} from '@/lib/server/payments/paystack';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({error: 'Sign in to continue to checkout.'}, {status: 401});
  let input: Record<string, unknown>;
  try {input = await request.json();} catch {return Response.json({error: 'Invalid checkout request.'}, {status: 400});}
  const resourceId = typeof input.resourceId === 'string' ? input.resourceId : null;
  const resourceMediaId = typeof input.resourceMediaId === 'string' ? input.resourceMediaId : null;
  if (Boolean(resourceId) === Boolean(resourceMediaId)) return Response.json({error: 'Choose one resource or file to purchase.'}, {status: 400});
  try {
    const db = database();
    let amountMinor: number, currency: string, purchaseProduct: {resourceId?: string; resourceMediaId?: string};
    if (resourceId) {
      const resource = await db.resource.findFirst({where: {id: resourceId, status: 'PUBLISHED', publishedAt: {lte: new Date()}, access: 'PAID'}, select: {id: true, priceMinor: true, currency: true}});
      if (!resource || resource.priceMinor <= 0) return Response.json({error: 'This resource is not available for purchase.'}, {status: 404});
      const existing = await db.purchase.findFirst({where: {userId: user.id, resourceId, status: 'PAID'}, select: {id: true}});
      if (existing) return Response.json({error: 'You already own this resource.'}, {status: 409});
      amountMinor = resource.priceMinor; currency = resource.currency; purchaseProduct = {resourceId};
    } else {
      const item = await db.resourceMedia.findFirst({where: {id: resourceMediaId!, resource: {status: 'PUBLISHED', publishedAt: {lte: new Date()}, access: {not: 'PAID'}}}, select: {id: true, priceMinor: true, resource: {select: {currency: true}}}});
      if (!item || item.priceMinor <= 0) return Response.json({error: 'This file is not available for individual purchase.'}, {status: 404});
      const existing = await db.purchase.findFirst({where: {userId: user.id, resourceMediaId: item.id, status: 'PAID'}, select: {id: true}});
      if (existing) return Response.json({error: 'You already own this file.'}, {status: 409});
      amountMinor = item.priceMinor; currency = item.resource.currency; purchaseProduct = {resourceMediaId: item.id};
    }
    const productWhere = 'resourceId' in purchaseProduct ? {resourceId: purchaseProduct.resourceId} : {resourceMediaId: purchaseProduct.resourceMediaId};
    let purchase = await db.purchase.findFirst({where: {userId: user.id, ...productWhere, status: 'PENDING'}, orderBy: {createdAt: 'desc'}});
    if (!purchase) {
      try {purchase = await db.purchase.create({data: {userId: user.id, ...purchaseProduct, reference: newPaymentReference(), amountMinor, currency}});}
      catch (error) {
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 'P2002')) throw error;
        purchase = await db.purchase.findFirst({where: {userId: user.id, ...productWhere, status: 'PENDING'}, orderBy: {createdAt: 'desc'}});
        if (!purchase) throw error;
      }
    }
    if (purchase.status === 'PAID') return Response.json({error: 'You already own this resource.'}, {status: 409});
    const authorizationUrl = purchase.checkoutUrl || await initializePaystack({email: user.email, amountMinor: purchase.amountMinor, currency: purchase.currency, reference: purchase.reference});
    await db.purchase.updateMany({where: {id: purchase.id, status: 'PENDING'}, data: {checkoutUrl: authorizationUrl}});
    return Response.json({authorizationUrl}, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    console.error('Paystack checkout initialization failed', error instanceof Error ? error.name : 'UnknownError');
    return Response.json({error: 'Checkout is temporarily unavailable. Please try again.'}, {status: 503});
  }
}
