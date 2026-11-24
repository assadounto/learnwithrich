'use client';
import Link from '@/components/navigation-link';
import { Bookmark, ArrowUpRight, ArrowRight, Play, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {useSiteAccount} from './site-account';
import { Art } from './art';
import type { Resource } from '@/lib/catalog';
function localSaved(): string[] {
  const value: unknown = JSON.parse(localStorage.getItem('lwr-saved') ?? '[]');
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function SaveButton({slug, large = false}: {slug: string; large?: boolean}) {
  const account = useSiteAccount();
  const key = account?.id;
  const accountKnown = account !== undefined;
  const [state, setState] = useState<{slug: string; accountId?: string; saved: boolean; sync: boolean}>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/account/saved/${encodeURIComponent(slug)}`;
  useEffect(() => {
    if (!accountKnown) return;
    const controller = new AbortController();
    function readLocal() {
      let saved = false;
      try { saved = localSaved().includes(slug); } catch { /* Local storage can be disabled. */ }
      setState({slug, accountId: key, saved, sync: false});
    }
    if (key) {
      void fetch(endpoint, {cache: 'no-store', signal: controller.signal})
        .then(async response => {
          if (!response.ok) throw new Error('Bookmark unavailable');
          const result = await response.json();
          if (!controller.signal.aborted) setState({slug, accountId: key, saved: Boolean(result.saved), sync: true});
        })
        .catch(() => {if (!controller.signal.aborted) readLocal();});
    } else {
      readLocal();
      window.addEventListener('lwr-saved-change', readLocal);
      window.addEventListener('storage', readLocal);
    }
    return () => {
      controller.abort();
      window.removeEventListener('lwr-saved-change', readLocal);
      window.removeEventListener('storage', readLocal);
    };
  }, [accountKnown, endpoint, key, slug]);

  const ready = accountKnown && state?.slug === slug && state.accountId === key;
  const saved = ready && state.saved;
  async function toggle() {
    if (!ready || busy) return;
    setError('');
    if (state.sync) {
      setBusy(true);
      try {
        const response = await fetch(endpoint, {method: saved ? 'DELETE' : 'PUT'});
        if (!response.ok) throw new Error('Could not update your saved resources.');
        setState({...state, saved: !saved});
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not save this resource.');
      } finally { setBusy(false); }
      return;
    }
    try {
      const list = localSaved();
      localStorage.setItem('lwr-saved', JSON.stringify(saved ? list.filter(item => item !== slug) : [...new Set([...list, slug])]));
      setState({...state, saved: !saved});
      window.dispatchEvent(new Event('lwr-saved-change'));
    } catch { setError('Saving is unavailable in this browser.'); }
  }

  return <><button type="button" className={large ? 'button button-outline save-large' : 'save-button'} onClick={toggle} disabled={!ready || busy} aria-pressed={saved} aria-label={saved ? 'Remove from saved resources' : 'Save resource'} title={saved ? 'Remove from library' : 'Save to your library'}><Bookmark size={large ? 18 : 17} fill={saved ? 'currentColor' : 'none'}/>{large && (saved ? 'Saved to my library' : 'Save to my library')}</button>{error && <span role="alert" className="save-error">{error}</span>}</>;
}
export function ResourceCard({resource:r}:{resource:Resource}){return <article className="resource-card"><Link prefetch={false} href={`/resources/${r.slug}`} className="resource-image-link" aria-label={`Explore ${r.title}`}><Art kind={r.art}/>{r.type==='Course'&&<span className="play-circle"><Play size={22} fill="currentColor"/></span>}<span className="image-arrow"><ArrowUpRight size={20}/></span></Link><div className="resource-meta"><span>{r.type}</span><span className={`access-badge ${r.access==='Free'?'free':''}`}>{r.access==='Free'?'Free':'In the works'}</span><SaveButton slug={r.slug}/></div><Link className="resource-title" href={`/resources/${r.slug}`}>{r.title}</Link><p>{r.description}</p></article>}
export function CourseCard({resource:r}:{resource:Resource}){return <article className="course-card"><Link prefetch={false} href={`/resources/${r.slug}`} className="course-image"><Art kind={r.art}/><span className="play-circle"><Play size={22} fill="currentColor"/></span></Link><div><span className="tiny-label">THE HANDS-ON SERIES</span><h3><Link prefetch={false} href={`/resources/${r.slug}`}>{r.title}</Link></h3><p>{r.description}</p><div className="course-bottom"><span><Clock3 size={14}/>{r.duration} · Planned</span><Link prefetch={false} href={`/resources/${r.slug}`}>Explore course <ArrowRight size={16}/></Link></div></div></article>}
