'use client';
import {useState, type FormEvent} from 'react';
import Link from '@/components/navigation-link';
import {mfaAction} from '@/app/admin/security/actions';
export function OwnerSecurity({initial}: {initial: {enabled: boolean; verified: boolean; recoveryRemaining: number; canEnroll: boolean}}) {
  const [enrollment, setEnrollment] = useState<{secret: string; qr: string} | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [mode, setMode] = useState<'verify' | 'rotate' | 'reset'>('verify');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function act(action: string, event?: FormEvent) {
    event?.preventDefault(); setBusy(true); setError('');
    try {
      const result = await mfaAction(action, code, recovery);
      if (!result.ok) { setError(result.error); return; }
      setCode('');
      if ('enrollment' in result && result.enrollment) setEnrollment(result.enrollment);
      else if ('codes' in result && result.codes) { setCodes(result.codes); setEnrollment(null); }
      else if (action === 'reset') window.location.assign('/admin/signin');
      else window.location.assign('/admin');
    } catch { setError('Could not complete this check. Try again or sign in again.'); }
    finally { setBusy(false); }
  }
  if (codes.length) return <div className="admin-mfa"><h2>Save your recovery codes</h2><p>Each code works once after Google sign-in if you lose your authenticator. This is the only time these codes are shown. Store them in your password manager or somewhere safe offline.</p><div className="admin-recovery-codes">{codes.map(value => <code key={value}>{value}</code>)}</div><button type="button" className="button button-outline" onClick={() => {
    const url = URL.createObjectURL(new Blob([`LearnWithRich recovery codes\nEach code works once. Keep private.\n\n${codes.join('\n')}\n`], {type: 'text/plain'}));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'learnwithrich-recovery-codes.txt'; anchor.click(); URL.revokeObjectURL(url);
  }}>Download recovery codes</button><label className="admin-mfa-ack"><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)}/>I have saved my recovery codes securely.</label><button type="button" className="button button-dark" disabled={!saved} onClick={() => window.location.assign('/admin')}>Open the studio</button></div>;
  return <div className="admin-mfa">{error && <p role="alert" className="admin-alert">{error}</p>}{!initial.enabled ? <>{!initial.canEnroll ? <p>For setup, sign out below and sign in with Google again.</p> : enrollment ? <><h2>Connect your authenticator</h2><p>Scan this QR code using Google Authenticator, 1Password, Microsoft Authenticator or another TOTP app.</p><img src={enrollment.qr} width={240} height={240} alt="Authenticator enrollment QR code. Keep this private."/><details><summary>Enter a setup key instead</summary><code className="admin-mfa-secret">{enrollment.secret}</code><p>Account: LearnWithRich · Time-based · 6 digits · Every 30 seconds</p></details><form onSubmit={event => act('confirm', event)}><label htmlFor="mfa-code">Enter the six-digit code</label><input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} autoFocus/><button className="button button-dark" disabled={busy}>{busy ? 'Checking…' : 'Verify and enable MFA'}</button></form><p>Setup expires after 10 minutes. Your phone’s clock should be set automatically.</p></> : <button className="button button-dark" disabled={busy} onClick={() => act('begin')}>{busy ? 'Preparing…' : 'Set up authenticator'}</button>}</> : <>{initial.verified && mode === 'verify' && <><p className="admin-success">Your session is verified. {initial.recoveryRemaining} recovery codes remain.</p><Link className="button button-dark" href="/admin">Return to studio</Link></>}<h2>{mode === 'reset' ? 'Replace your authenticator' : mode === 'rotate' ? 'Create new recovery codes' : 'Verify your identity'}</h2>{mode === 'reset' && <p>This removes your authenticator and recovery codes, and signs out every session. You must sign in with Google and set up MFA again before the studio opens. Enter a new authenticator code or an unused recovery code.</p>}{mode === 'rotate' && <p>Enter a new authenticator code. All previous recovery codes will stop working.</p>}<form onSubmit={event => act(mode, event)}><label htmlFor="mfa-code">{recovery ? 'Unused recovery code' : 'Authenticator code'}</label><input id="mfa-code" name="code" type="text" inputMode={recovery ? 'text' : 'numeric'} autoComplete="one-time-code" pattern={recovery ? undefined : '[0-9]{6}'} maxLength={recovery ? 40 : 6} required value={code} onChange={e => setCode(e.target.value)}/><button className="button button-dark" disabled={busy}>{busy ? 'Checking…' : mode === 'reset' ? 'Verify and replace authenticator' : mode === 'rotate' ? 'Generate new codes' : 'Verify and open studio'}</button></form>{mode !== 'rotate' && <button type="button" className="admin-text-button" disabled={busy} onClick={() => {setRecovery(!recovery); setCode(''); setError('');}}>{recovery ? 'Use authenticator instead' : 'Use a recovery code'}</button>}<div className="admin-security-options"><button className="admin-text-button" disabled={busy} onClick={() => {setMode(mode === 'rotate' ? 'verify' : 'rotate'); setCode(''); setRecovery(false); setError('');}}>Manage recovery codes</button><button className="admin-text-button" disabled={busy} onClick={() => {setMode(mode === 'reset' ? 'verify' : 'reset'); setCode(''); setRecovery(false); setError('');}}>Replace authenticator</button></div><p>Codes can only be used once. If a code was just accepted, wait for the next one. Five failed attempts lock verification for 15 minutes.</p></>}</div>;
}
