import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {settleVerifiedPurchase, settleVerifiedServicePayment, verifyPaystack} from '@/lib/server/payments/paystack';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({error: 'Sign in to verify this purchase.'}, {status: 401});
  const reference = new URL(request.url).searchParams.get('reference') || '';
  if (!/^LWR_[a-f\d]{32}$/i.test(reference)) return Response.json({error: 'Invalid payment reference.'}, {status: 400});
  const db = database();
  const [purchase, servicePayment] = await Promise.all([
    db.purchase.findFirst({where: {reference, userId: user.id}, select: {id: true}}),
    db.servicePayment.findFirst({where:{reference,userId:user.id},select:{id:true}}),
  ]);
  if (!purchase && !servicePayment) return Response.json({error: 'Payment was not found for this account.'}, {status: 404});
  try {
    const transaction = await verifyPaystack(reference);
    const result = purchase ? await settleVerifiedPurchase(db, reference, transaction) : await settleVerifiedServicePayment(db, reference, transaction);
    if (!result.ok) return Response.json({paid: false, message: 'Payment has not been confirmed yet.'}, {status: 202});
    return Response.json({paid: true}, {headers: {'Cache-Control': 'no-store'}});
  } catch {return Response.json({error: 'Could not verify payment yet. Refresh this page in a moment.'}, {status: 503});}
}
