'use client';
import Link from '@/components/navigation-link';
import {useEffect, useState} from 'react';
import {ArrowRight, ArrowUpRight, Heart, MessageCircle, PenLine, Quote, Star} from 'lucide-react';
import {COMMUNITY_COUNTRIES} from '@/lib/community-countries';

type Entry = {id: string; name: string; title: string | null; country: string | null; imageAssetId: string | null; message: string; createdAt: string};
type Review = {id: string; displayName: string; title: string | null; country: string | null; imageAssetId: string | null; message: string; rating: number; createdAt: string};

function CommunityProfileFields({titleLabel}: {titleLabel: string}) {
  return <>
    <label>{titleLabel} <span>optional</span><input name="title" maxLength={120} placeholder="A short headline"/></label>
    <label>Country <span>optional</span><select name="country" defaultValue=""><option value="">Prefer not to say</option>{COMMUNITY_COUNTRIES.map(country=><option key={country} value={country}>{country}</option>)}</select></label>
    <label className="community-image-field">Photo <span>optional · JPG, PNG or WebP · max 2 MB</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp"/><small>Your photo appears only after your note or review is approved.</small></label>
  </>;
}

export function GuestbookForm() {
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(''); setError('');
    const form = event.currentTarget, values = new FormData(form);
    try {const response = await fetch('/api/guestbook', {method: 'POST', body: values}); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not save your note.'); setNotice(result.message || 'Thanks for signing.'); form.reset();}
    catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not save your note.');} finally {setBusy(false);}
  }
  return <form id="sign" className="community-form guestbook-form" onSubmit={submit} encType="multipart/form-data"><div className="community-form-pair"><label>Your name<input name="name" required minLength={2} maxLength={100} placeholder="How should we call you?"/></label><label>Email <span>optional, stays private</span><input name="email" type="email" maxLength={254} placeholder="you@example.com"/></label></div><CommunityProfileFields titleLabel="Note title"/><label>Your note<textarea name="message" required minLength={10} maxLength={800} rows={4} placeholder="Share a thought, a hello, or what you’re making…"/></label><label className="community-honeypot" aria-hidden="true">Leave this empty<input name="website" tabIndex={-1} autoComplete="off"/></label><div className="community-form-foot"><small>Your note is reviewed before it appears publicly.</small><button className="button button-dark" type="submit" disabled={busy}><PenLine size={15}/>{busy ? 'Sending…' : 'Sign the guest book'}</button></div>{notice && <p role="status" className="community-success">{notice}</p>}{error && <p role="alert" className="community-error">{error}</p>}</form>;
}

export function ReviewForm() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null), [name, setName] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('');
  useEffect(() => {let active = true; fetch('/api/account/me', {cache: 'no-store'}).then(async response => {if (!active) return; if (!response.ok) {setSignedIn(false); return;} const result = await response.json(); if (active) {setName(result.user?.name || ''); setSignedIn(true);}}).catch(() => {if (active) setSignedIn(false);}); return () => {active = false;};}, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(''); setError('');
    const formElement = event.currentTarget, form = new FormData(formElement);
    try {const response = await fetch('/api/reviews', {method: 'POST', body: form}); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not save your review.'); setNotice(result.message || 'Thanks for sharing.'); formElement.reset();}
    catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not save your review.');} finally {setBusy(false);}
  }
  if (signedIn === null) return <p className="community-muted">Checking sign-in…</p>;
  if (!signedIn) return <p className="community-signin-note">Want to leave a review? <Link href={`/signin?next=${encodeURIComponent('/reviews#share')}`}>Sign in to your account <ArrowUpRight size={14}/></Link></p>;
  return <form id="share" className="community-form review-form" onSubmit={submit} encType="multipart/form-data"><label>Your name<input name="displayName" value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={100}/></label><CommunityProfileFields titleLabel="Review title"/><label>Your review<textarea name="message" required minLength={15} maxLength={1000} rows={5} placeholder="What would you like others to know about your experience with LearnWithRich?"/></label><label>Rating<select name="rating" defaultValue="5"><option value="5">★★★★★ — Excellent</option><option value="4">★★★★ — Very good</option><option value="3">★★★ — Good</option><option value="2">★★ — Fair</option><option value="1">★ — Needs work</option></select></label><div className="community-form-foot"><small>Reviews appear after approval. You can update yours by submitting again.</small><button type="submit" className="button button-dark" disabled={busy}><Heart size={15}/>{busy ? 'Sending…' : 'Share a review'}</button></div>{notice && <p role="status" className="community-success">{notice}</p>}{error && <p role="alert" className="community-error">{error}</p>}</form>;
}

export function CommunityHome({entries, reviews}: {entries: Entry[]; reviews: Review[]}) {
  return <section className="community-home" aria-labelledby="community-title"><div className="ref-container"><header className="community-home-heading"><span className="maker-kicker">A PLACE FOR YOUR VOICE</span><h2 id="community-title">Learning is better <i>together.</i></h2><p>Say hello, share what you think, and help this community grow.</p></header><div className="community-home-grid">
    <section className="community-board" aria-labelledby="guestbook-title"><header><span className="community-icon"><MessageCircle size={18}/></span><div><span className="maker-kicker">OPEN TO EVERYONE</span><h3 id="guestbook-title">The guest book</h3><p>A note from you makes this place feel more like a community.</p></div></header>{entries.length ? <div className="guestbook-entries">{entries.slice(0,4).map((entry,index)=><blockquote key={entry.id}><span>0{index+1}</span><div>{entry.imageAssetId&&<img className="community-entry-avatar" src={`/api/public-media/${entry.imageAssetId}`} alt="" width="36" height="36"/>}{entry.title&&<strong className="community-card-title">{entry.title}</strong>}<p>“{entry.message}”</p><cite>{entry.name}{entry.country&&<small>{entry.country}</small>}</cite></div></blockquote>)}</div> : <div className="community-empty-note">Be the first to leave a little hello here.</div>}<div className="community-board-actions"><Link href="/guestbook" className="text-link">Read all notes <ArrowRight size={15}/></Link><Link href="/guestbook#sign" className="button button-dark">Sign the guest book <ArrowUpRight size={15}/></Link></div></section>
    <section className="community-board community-review-board" aria-labelledby="reviews-title"><header><span className="community-icon"><Quote size={18}/></span><div><span className="maker-kicker">COMMUNITY STORIES</span><h3 id="reviews-title">What people say</h3><p>Honest reflections from people learning, building, and putting new ideas to work.</p></div></header>{reviews.length ? <div className="review-cards">{reviews.slice(0,3).map(review=><article key={review.id}><div className="community-review-person">{review.imageAssetId?<img src={`/api/public-media/${review.imageAssetId}`} alt="" width="38" height="38"/>:<span className="community-review-avatar" aria-hidden="true">{review.displayName.slice(0,1).toUpperCase()}</span>}<div>{review.title&&<strong className="community-card-title">{review.title}</strong>}<strong>{review.displayName}</strong>{review.country&&<small>{review.country}</small>}</div></div><div aria-label={`${review.rating} out of 5 stars`} className="review-stars">{Array.from({length:5},(_,index)=><Star key={index} size={13} fill={index<review.rating?'currentColor':'none'}/>)}</div><p>“{review.message}”</p></article>)}</div> : <div className="community-empty-note">Your perspective can be the first review.</div>}<div className="community-board-actions"><Link href="/reviews" className="text-link">Read all reviews <ArrowRight size={15}/></Link><Link href="/reviews#share" className="button button-dark">Add a review <ArrowUpRight size={15}/></Link></div></section>
  </div><div className="community-service-nudge"><div><span className="maker-kicker">HAVE A PROJECT IN MIND?</span><h3>Let’s make the next step clearer.</h3><p>Share the idea, your timeline and an optional budget. I’ll review it and prepare a quote.</p></div><Link href="/services/request" className="button button-orange">Request a service <ArrowUpRight size={16}/></Link></div></div></section>;
}
