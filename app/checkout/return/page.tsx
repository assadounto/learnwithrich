import {PaymentReturn} from '@/components/payment-return';
export const metadata={title:'Confirm your payment'};
export default async function Return({searchParams}:{searchParams:Promise<{reference?:string;trxref?:string}>}){const params=await searchParams;return <section className="checkout-return ref-container"><span className="maker-kicker">ONE MORE STEP</span><h1>Let’s open your next chapter.</h1><PaymentReturn reference={params.reference||params.trxref||''}/></section>}
