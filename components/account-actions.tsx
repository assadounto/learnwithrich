'use client';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {LogOut} from 'lucide-react';

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  async function signOut() {setBusy(true); try {await fetch('/api/identity/sign-out', {method: 'POST'});} finally {window.location.assign('/');}}
  return <button type="button" className="button button-outline" disabled={busy} onClick={signOut}><LogOut size={15}/>{busy?'Signing out…':'Sign out'}</button>;
}

export function PaymentVerification({reference}: {reference: string}) {
  const [message, setMessage] = useState('Confirming your payment with Paystack…');
  const [error, setError] = useState(false), router = useRouter();
  useEffect(() => {
    let active = true;
    void fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`, {cache:'no-store'}).then(async response => {
      const body = await response.json();
      if (!active) return;
      if (body.paid) {setMessage('Payment confirmed. Your account has been updated.'); router.refresh();}
      else if (response.status === 202) setMessage('Paystack is still confirming the payment. Refresh this page shortly.');
      else {setError(true); setMessage(body.error || 'We could not confirm this payment yet.');}
    }).catch(() => {if(active){setError(true);setMessage('We could not confirm this payment yet. Refresh to try again.');}});
    return () => {active = false;};
  }, [reference, router]);
  return <p role="status" className={`account-payment-message${error?' has-error':''}`}>{message}</p>;
}
