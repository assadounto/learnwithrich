'use client';

import Script from 'next/script';
import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {AlertCircle, LoaderCircle, RotateCcw} from 'lucide-react';
import {safeNext} from '@/lib/xonbay/contracts';
import styles from './google-signin.module.css';

type Identity = {
  initialize: (config: {client_id: string; nonce: string; callback: (result: {credential?: string}) => void; ux_mode: string; auto_select: boolean}) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
};

export function GoogleSignin({next = '/dashboard'}: {next?: string}) {
  const ref = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [config, setConfig] = useState<{clientId: string; nonce: string} | null>(null);
  const [setupError, setSetupError] = useState('');
  const [scriptError, setScriptError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const notice = setupError || scriptError || error;

  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/auth/google', {signal: abort.signal, cache: 'no-store'})
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw Error(data.error || 'Sign-in is unavailable. Please try again.');
        if (!data.clientId || !data.nonce) throw Error('Sign-in could not be prepared. Please try again.');
        setConfig(data);
      })
      .catch(error => {
        if (error.name !== 'AbortError') setSetupError(error.message || 'Sign-in is unavailable. Please try again.');
      });
    return () => abort.abort();
  }, []);

  // A blocked or stalled Google script should never leave an endless loading state.
  useEffect(() => {
    if (rendered || setupError || scriptError) return;
    const timer = window.setTimeout(() => setScriptError('Sign-in is taking longer than expected. Check your connection and try again.'), 15000);
    return () => window.clearTimeout(timer);
  }, [rendered, setupError, scriptError]);

  useEffect(() => {
    const google = (window as Window & {google?: {accounts: {id: Identity}}}).google?.accounts.id;
    if (!ready || !config || !ref.current || !google) return;
    let active = true;
    google.initialize({
      client_id: config.clientId,
      nonce: config.nonce,
      ux_mode: 'popup',
      auto_select: false,
      callback: async ({credential}) => {
        if (!active || !credential || busy.current) return;
        busy.current = true;
        setLoading(true);
        setError('');
        try {
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({credential}),
          });
          const data = await response.json();
          if (!response.ok) throw Error(data.error || 'Could not sign in. Please try again.');
          window.dispatchEvent(new Event('lwr-account-change'));
          router.replace(safeNext(next));
          router.refresh();
        } catch (error) {
          if (active) setError(error instanceof Error ? error.message : 'Could not sign in. Please try again.');
        } finally {
          busy.current = false;
          if (active) setLoading(false);
        }
      },
    });
    // Keep Google's own accessible button and account chooser.
    ref.current.replaceChildren();
    google.renderButton(ref.current, {
      type: 'standard', theme: 'outline', size: 'large', text: 'continue_with',
      shape: 'rectangular', width: Math.floor(Math.min(360, ref.current.clientWidth || 280)),
    });
    setRendered(true);
    setScriptError('');
    return () => { active = false; };
  }, [ready, config, next, router]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive"
        onReady={() => { setReady(true); setScriptError(''); }}
        onError={() => setScriptError('Google sign-in could not load. Check your connection and try again.')}/>
      <div className={styles.root} aria-busy={loading || (!rendered && !notice)}>
        <div ref={ref} className={`${styles.button} ${loading ? styles.pending : ''}`} inert={loading}/>
        {!rendered && !notice && <div className={styles.preparing} role="status"><LoaderCircle size={17} aria-hidden="true"/> Preparing Google sign-in…</div>}
        {loading && <p className={styles.status} role="status"><LoaderCircle size={15} aria-hidden="true"/> Signing you in…</p>}
        {notice && <div className={styles.notice}>
          <p role="alert"><AlertCircle size={17} aria-hidden="true"/><span>{notice}</span></p>
          <button type="button" onClick={() => window.location.reload()}><RotateCcw size={13} aria-hidden="true"/> Reload and try again</button>
        </div>}
        <noscript><p className={styles.noscript}>Enable JavaScript in your browser to sign in with Google.</p></noscript>
      </div>
    </>
  );
}
