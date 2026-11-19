'use client';
import {useState} from 'react';
import {identityClient} from '@/lib/identity-client';
export function OwnerSignin({enabled = true}: {enabled?: boolean}) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <><button className="button button-dark" disabled={!enabled || busy} onClick={async () => {
    setBusy(true); setError('');
    try {
      const result = await identityClient.signIn.social({provider: 'google', callbackURL: '/admin', errorCallbackURL: '/admin/signin?error=signin'});
      if (result.error) throw new Error(result.error.message || 'Sign-in could not start.');
    } catch { setError('Could not start Google sign-in. Please try again.'); setBusy(false); }
  }}>{busy ? 'Opening Google…' : 'Continue with Google'}</button>{error && <p role="alert" className="account-notice">{error}</p>}</>;
}
export function OwnerSignout({beforeSignout}: {beforeSignout?: () => boolean} = {}) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <span><button className="button button-outline" disabled={busy} onClick={async () => {
    if (beforeSignout && !beforeSignout()) return;
    setBusy(true); setError('');
    try { const result = await identityClient.signOut(); if (result.error) throw new Error(); window.location.assign('/admin/signin'); }
    catch { setBusy(false); setError('Sign-out failed. Try again.'); }
  }}>{busy ? 'Signing out…' : 'Sign out'}</button>{error && <small role="alert">{error}</small>}</span>;
}
