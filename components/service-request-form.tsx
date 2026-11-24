'use client';

import {useEffect, useRef, useState} from 'react';
import {AudioLines, CheckCircle2, LockKeyhole, PenLine, Send} from 'lucide-react';
import Link from '@/components/navigation-link';
import {serviceOfferings} from '@/lib/service-offerings';
import {SubmissionSuccessDialog} from './submission-success-dialog';
import {SelectMenu} from './selection-dialog';
import {ServiceVoiceRecorder} from './service-voice-recorder';

export function ServiceRequestForm({profile, next, idea, service}: {
  profile: {name: string; email: string; phone?: string} | null; next: string; idea?: {title: string}; service: string;
}) {
  const [selectedService, setSelectedService] = useState(service);
  useEffect(() => {setSelectedService(service);}, [service]);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [voice, setVoice] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [description, setDescription] = useState(idea ? `Project idea: ${idea.title}\n\n` : '');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{id: string; code: string}>();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const receipt = useRef<HTMLElement>(null);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || recording) return;
    const form = new FormData(event.currentTarget);
    if (mode === 'voice' && !voice) {setError('Record or upload a voice note before sending.'); return;}
    if (mode === 'text' && description.trim().length < 50) {setError('Write at least 50 characters about what you need.'); return;}
    if (mode === 'voice' && voice) form.set('voice', voice);
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/service-requests', {method: 'POST', body: form});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send your request.');
      if (typeof result.id !== 'string') throw new Error('Could not confirm your request. Please try again.');
      setSent({id: result.id, code: result.requestCode});
      setConfirmationOpen(true);
      setVoice(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send your request.');
    } finally {setBusy(false);}
  }

  if (!profile) return <section className="service-request-form service-login-prompt"><span className="service-profile-lock"><LockKeyhole size={20}/></span><div>
    <h2>Sign in to send a request</h2>
    {idea && <p>Project idea <strong>{idea.title}</strong></p>}
    <p>Use your learner account to follow messages, quotes, and files for your request.</p>
    <Link className="button button-dark" href={`/signin?next=${encodeURIComponent(next)}`}>Sign in to continue <Send size={15}/></Link>
  </div></section>;

  if (sent) return <section ref={receipt} tabIndex={-1} className="service-request-form service-form-success" aria-label="Request confirmation">
    <CheckCircle2 size={25}/><h2>Request received</h2><p>Your request number is <strong>{sent.code}</strong>. You can follow it from your account.</p>
    <Link className="button button-dark" href={`/account/services/${sent.id}`}>Open my request</Link>
    {confirmationOpen && <SubmissionSuccessDialog title="Request received"
      description="Richmond will review your brief. Open your request to check its status, add files, and view your quote when it’s ready."
      action={{href: `/account/services/${sent.id}`, label: 'Open my request'}}
      onDismiss={() => {setConfirmationOpen(false); receipt.current?.focus({preventScroll: true});}}>
      <p className="submission-success-reference">Request number <strong>{sent.code}</strong></p>
    </SubmissionSuccessDialog>}
  </section>;

  return <form className="service-request-form" onSubmit={submit}>
    <div className="service-form-heading"><h2>Send your request</h2><p>Tell me what you need and what you’d like to get out of it.</p></div>
    <div className="service-profile-summary">
      <span><LockKeyhole size={15}/><strong>{profile.name}</strong><small>Signed in as</small></span>
      <span><strong>{profile.email}</strong><small>Account email</small></span>
    </div>
    <div className="service-form-grid">
      <label>What would you like help with?<SelectMenu name="serviceType" required value={selectedService} onChange={event => setSelectedService(event.target.value)}>
        <option value="" disabled>Choose a service</option>
        {serviceOfferings.map(offer => <option key={offer.id} value={offer.id}>{offer.label}</option>)}
      </SelectMenu></label>
      <label>Phone number<input name="phone" type="tel" autoComplete="tel" inputMode="tel" minLength={7} maxLength={32} required defaultValue={profile.phone} placeholder="e.g. +233 24 000 0000"/>
        {profile.phone && <small>From your last request. Update it here if it has changed.</small>}
      </label>
      <label>When do you need it? <small>Optional</small><input name="timeline" maxLength={160} placeholder="A date, time frame, or ‘flexible’"/></label>
      <div className="service-budget-field"><label>Budget <small>Optional</small><input name="budget" inputMode="decimal" pattern="\d{1,8}(\.\d{1,2})?" placeholder="e.g. 1500.00"/></label>
        <label>Currency<SelectMenu name="currency" defaultValue="GHS"><option>GHS</option><option>USD</option><option>GBP</option><option>EUR</option></SelectMenu></label>
      </div>
      <fieldset className="service-form-wide service-brief">
        <legend>Your brief</legend>
        <div className="service-brief-mode" role="group" aria-label="How to send your brief">
          <button type="button" className="button button-outline" aria-pressed={mode === 'text'} disabled={recording || busy} onClick={() => {setMode('text'); setError('');}}><PenLine size={16}/>Write a brief</button>
          <button type="button" className="button button-outline" aria-pressed={mode === 'voice'} disabled={recording || busy} onClick={() => {setMode('voice'); setError('');}}><AudioLines size={16}/>Send a voice note</button>
        </div>
        {mode === 'voice' && <ServiceVoiceRecorder file={voice} onChange={setVoice} onRecording={setRecording} disabled={busy}/>}
        <label>{mode === 'text' ? 'Describe what you need' : 'Add written context (optional)'}
          <textarea name="description" required={mode === 'text'} minLength={mode === 'text' ? 50 : undefined} maxLength={6000}
            rows={mode === 'text' ? 6 : 3} value={description} onChange={event => setDescription(event.target.value)}
            placeholder="Share your goal, what you’ve tried, or what you’d like to learn."/>
        </label>
      </fieldset>
      <label className="community-honeypot" aria-hidden="true">Leave this empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
    </div>
    {error && <p className="community-error" role="alert">{error}</p>}
    <div className="service-form-submit"><p>You’ll get a quote in your account after I review your request.</p>
      <button type="submit" className="button button-dark" disabled={busy || recording}>{busy ? 'Sending request…' : 'Send request'}<Send size={16}/></button>
    </div>
  </form>;
}
