'use client';
import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useSiteNavigation } from './navigation-feedback';
import { PaperEdges } from './paper-edges';
import { DrawnUnderline } from './decorative-marks';
export function Newsletter() {
  const [notice, setNotice] = useState<{text: string; error: boolean} | null>(null);
  const [pending, setPending] = useState(false);

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: values.get('email'), website: values.get('website')}),
      });
      const result = await response.json();
      if (!response.ok) {
        setNotice({error: true, text: result.error || 'Could not save your signup. Try again.'});
        return;
      }
      form.reset();
      setNotice({error: false, text: 'Thanks! Your newsletter signup was received.'});
    } catch {
      setNotice({error: true, text: 'Could not save your signup. Try again.'});
    } finally { setPending(false); }
  }

  return <section className="reference-newsletter" aria-labelledby="newsletter-heading">
    <PaperEdges/>
    <div className="ref-container ref-newsletter-inner">
      <h2 id="newsletter-heading">Something useful, every time.<DrawnUnderline className="white-scribble"/></h2>
      <div className="ref-newsletter-form">
        <p>Get new projects, learning resources and behind-the-scenes notes in your inbox.</p>
        <form action="/api/newsletter" method="post" onSubmit={subscribe}>
          <label className="sr-only" htmlFor="newsletter-email">Email address</label>
          <input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="Your email address" maxLength={254} required/>
          <span hidden><input name="website" tabIndex={-1} autoComplete="off" aria-label="Leave blank"/></span>
          <button className="button button-dark" type="submit" disabled={pending}>{pending ? 'Subscribing…' : 'Subscribe'}</button>
        </form>
        <p className="newsletter-consent">By subscribing, you agree to receive updates by email. <a href="/privacy#newsletter">Privacy details</a></p>
        <p className="ref-newsletter-notice" role={notice?.error ? 'alert' : 'status'}>{notice?.text ?? ''}</p>
      </div>
    </div>
  </section>;
}
export function SearchForm({compact=false}:{compact?:boolean}){const navigate=useSiteNavigation();return <form action="/resources" onSubmit={event=>{if(!navigate)return;event.preventDefault();const data=new FormData(event.currentTarget);const query=new URLSearchParams({q:String(data.get('q')||'')});navigate(`/resources?${query}`,{})}} className={`search-form ${compact?'compact':''}`}><Search size={21} aria-hidden="true"/><label className="sr-only" htmlFor={compact?'compact-search':'home-search'}>Search resources</label><input id={compact?'compact-search':'home-search'} type="search" name="q" placeholder="Search projects, books, guides, courses…"/><button type="submit" aria-label="Search resources"><ArrowRight size={21}/></button></form>}
