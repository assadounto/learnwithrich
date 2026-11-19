'use client';
import {useState} from 'react';
import {ArrowRight, LoaderCircle} from 'lucide-react';

export function PurchaseButton({resourceId, resourceMediaId, label, className = 'button button-dark'}: {resourceId?: string; resourceMediaId?: string; label: string; className?: string}) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function checkout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/payments/checkout', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({resourceId, resourceMediaId})});
      const result = await response.json();
      if (response.status === 401) {window.location.assign(`/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); return;}
      if (!response.ok || typeof result.authorizationUrl !== 'string') throw new Error(result.error || 'Could not start checkout.');
      window.location.assign(result.authorizationUrl);
    } catch (reason) {setError(reason instanceof Error ? reason.message : 'Checkout is unavailable.'); setBusy(false);}
  }
  return <span className="purchase-button-wrap"><button type="button" className={className} disabled={busy} onClick={checkout}>{busy?<LoaderCircle size={16} className="purchase-spin"/>:<ArrowRight size={16}/>} {busy?'Opening secure checkout…':label}</button>{error&&<small role="alert">{error}</small>}</span>;
}
