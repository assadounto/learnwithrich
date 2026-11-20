'use client';
import {useEffect, useState} from 'react';
import Link from '@/components/navigation-link';
import {CheckCircle2, LockKeyhole, Send} from 'lucide-react';

export function ServiceRequestForm({profile, next}: {profile: {name:string;email:string;phone?:string}|null;next?:string}) {
  const [accountProfile, setAccountProfile] = useState(profile);
  const [checkingAccount, setCheckingAccount] = useState(!profile);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    if (profile) return;
    let active = true;
    fetch('/api/account/me', {cache: 'no-store', credentials: 'same-origin'})
      .then(async response => response.ok ? response.json() : null)
      .then(result => { if (active && result?.user) setAccountProfile({name: result.user.name, email: result.user.email}); })
      .catch(() => {})
      .finally(() => { if (active) setCheckingAccount(false); });
    return () => { active = false; };
  }, [profile]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget, values = new FormData(form);
    setBusy(true); setNotice(''); setError('');
    try {const response = await fetch('/api/service-requests', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Object.fromEntries(values))}); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not send your request.'); setNotice(`${result.message} Request code: ${result.requestCode}.`); form.reset();}
    catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not send your request.');} finally {setBusy(false);}
  }
  if (!accountProfile && checkingAccount) return <section className="service-request-form service-login-prompt" aria-live="polite"><span className="service-profile-lock"><LockKeyhole size={20}/></span><div><span className="maker-kicker">CHECKING YOUR ACCOUNT</span><h2>Getting your request form ready.</h2><p>We’re checking your LearnWithRich sign-in.</p></div></section>;
  if (!accountProfile) return <section className="service-request-form service-login-prompt"><span className="service-profile-lock"><LockKeyhole size={20}/></span><div><span className="maker-kicker">YOUR ACCOUNT PROTECTS YOUR BRIEF</span><h2>Sign in to request a service.</h2><p>Your service requests, quotes, payments and revision drafts all stay together in your learner account.</p><Link className="button button-dark" href={`/signin?next=${encodeURIComponent(next??'/services/request')}`}>Sign in to continue <Send size={15}/></Link><small>New to LearnWithRich? Sign in with Google to create your learner account.</small></div></section>;
  return <form className="service-request-form" onSubmit={submit}>
    <div className="service-form-heading"><span>PROJECT BRIEF</span><h2>Tell me what you’re working on.</h2><p>The more context you share, the more useful the first quote can be.</p></div>
    {notice ? <div className="service-form-success" role="status"><CheckCircle2 size={23}/><h3>Request received.</h3><p>{notice}</p><button type="button" className="button button-outline" onClick={() => setNotice('')}>Send another request</button></div> : <>
      <div className="service-profile-summary"><span><LockKeyhole size={15}/><strong>{accountProfile.name}</strong><small>Account name</small></span><span><strong>{accountProfile.email}</strong><small>Account email</small></span><p>Your name and email come from your signed-in account and can’t be changed on this request.</p></div>
      <div className="service-form-grid"><label>Phone number<input name="phone" type="tel" autoComplete="tel" inputMode="tel" minLength={7} maxLength={32} required placeholder="e.g. +233 24 000 0000"/></label><label>What kind of help do you need?<select name="serviceType" required defaultValue=""><option value="" disabled>Choose a service</option><option value="THESIS_SUPPORT">Thesis or research support</option><option value="SOFTWARE_PROJECT">Software or web project</option><option value="ELECTRONICS_PROJECT">Electronics or IoT project</option><option value="CAPSTONE">Student capstone project</option><option value="CONSULTING">Technical consulting</option><option value="OTHER">Something else</option></select></label><div className="service-budget-field"><label>Budget (optional)<input name="budget" inputMode="decimal" pattern="\d{1,8}(\.\d{1,2})?" placeholder="e.g. 1500.00"/></label><label>Currency<select name="currency" defaultValue="GHS"><option>GHS</option><option>USD</option><option>GBP</option><option>EUR</option></select></label></div><label className="service-form-wide">When do you need it?<input name="timeline" maxLength={160} placeholder="A date, a timeframe, or ‘flexible’"/></label><label className="service-form-wide">Describe the project<textarea name="description" required minLength={50} maxLength={6000} rows={7} placeholder="What are you trying to achieve? What have you done so far? Include important requirements, tools, or constraints."/><small>50–6,000 characters. Please don’t include passwords or private account credentials.</small></label><label className="community-honeypot" aria-hidden="true">Leave this empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      {error && <p className="community-error" role="alert">{error}</p>}<div className="service-form-submit"><p>After I review your brief, you’ll see the quote and any included revision terms here. You can pay securely through Paystack when you’re ready. Your details stay private.</p><button type="submit" className="button button-dark" disabled={busy}>{busy ? 'Sending request…' : 'Send project brief'}{busy ? null : <Send size={16}/>}</button></div>
    </>}
  </form>;
}
