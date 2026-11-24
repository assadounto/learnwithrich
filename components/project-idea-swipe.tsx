'use client';

import {useEffect, useState} from 'react';
import {ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Lightbulb} from 'lucide-react';
import Link from '@/components/navigation-link';
import {disciplineLabel} from '@/lib/project-ideas';
import {useSwipeGesture, useSwipeVisibility} from './swipe-gesture';

type PickedIdea = {slug: string; title: string};
type Idea = PickedIdea & {discipline: string; abstract: string; tags: string[]};
const storageKey = 'lwr-idea-shortlist';

function readShortlist(): PickedIdea[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(data) ? data.filter((row): row is PickedIdea => Boolean(row && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) && typeof row.title === 'string')) : [];
  } catch { return []; }
}

export function ProjectIdeaSwipe({ideas, nextHref}: {ideas: Idea[]; nextHref?: string}) {
  const [index, setIndex] = useState(0);
  const [shortlist, setShortlist] = useState<PickedIdea[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const stage = useSwipeVisibility(index);
  const idea = ideas[index];
  useEffect(() => {
    setShortlist(readShortlist());
    const refresh = () => setShortlist(readShortlist());
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  function saveList(items: PickedIdea[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      setShortlist(items);
      setError('');
      return true;
    } catch {
      setError('This browser could not update your shortlist.');
      return false;
    }
  }

  function advance(save: boolean) {
    if (!idea) return;
    const current = readShortlist();
    if (save && !current.some(item => item.slug === idea.slug) && !saveList([...current, {slug: idea.slug, title: idea.title}])) return;
    setNotice(save ? `Shortlisted ${idea.title}.` : `Skipped ${idea.title}.`);
    setIndex(index + 1);
  }

  return <section ref={stage} className="swipe-deck" aria-label="Swipe through project ideas">
    <header><div><h2>Swipe through ideas</h2><p>Swipe right to shortlist, left to skip. Tap an idea to read more.</p></div><span>{Math.min(index + 1, ideas.length)} / {ideas.length}</span></header>
    {idea ? <IdeaCard key={idea.slug} idea={idea} advance={advance} saved={shortlist.some(item => item.slug === idea.slug)}/> :
      <div className="swipe-finish"><h3>You’ve reached the end of this page.</h3>
        {nextHref && <Link className="button button-dark" href={nextHref}>Next page <ArrowRight size={16}/></Link>}
        <button type="button" className="button button-outline" onClick={() => setIndex(0)}>Restart this page</button>
      </div>}
    <div className="swipe-status">
      {index > 0 && <button type="button" className="button button-outline" onClick={() => {setIndex(index - 1);setNotice('Showing previous idea.');}}><ArrowLeft size={16}/>Previous idea</button>}
      <span role="status">{notice}</span>
    </div>
    {error && <p role="alert">{error}</p>}
    <details className="idea-shortlist">
      <summary>Shortlist on this device ({shortlist.length})</summary>
      {shortlist.length ? <ul>{shortlist.map(item => <li key={item.slug}>
        <Link href={`/project-ideas/${item.slug}`}>{item.title}</Link>
        <button type="button" className="button button-outline" aria-label={`Remove ${item.title}`} onClick={() => saveList(readShortlist().filter(row => row.slug !== item.slug))}>Remove</button>
      </li>)}</ul> : <p>Ideas you shortlist will appear here.</p>}
    </details>
  </section>;
}

function IdeaCard({idea, advance, saved}: {idea: Idea; advance: (save: boolean) => void; saved: boolean}) {
  const {offset, dragging, anchorProps} = useSwipeGesture(advance);
  return <>
    <div className="swipe-stage">
      <Link {...anchorProps} href={`/project-ideas/${idea.slug}`} prefetch={false}
        className={`swipe-card idea-swipe-card${dragging ? ' is-dragging' : ''}`} style={{transform: `translateX(${offset}px) rotate(${offset / 18}deg)`}}>
        <div className="idea-swipe-art"><Lightbulb size={40} strokeWidth={1.25} aria-hidden="true"/>
          {Math.abs(offset) > 30 && <span className={offset > 0 ? 'swipe-save-stamp' : 'swipe-skip-stamp'} aria-hidden="true">{offset > 0 ? 'Shortlist' : 'Skip'}</span>}
        </div>
        <div className="swipe-copy"><span className="maker-kicker">{disciplineLabel(idea.discipline)}</span><h3>{idea.title}</h3><p>{idea.abstract}</p>
          <span className="text-link">Read full abstract <ArrowUpRight size={16}/></span>
        </div>
      </Link>
    </div>
    <div className="swipe-actions">
      <button type="button" className="button button-outline" onClick={() => advance(false)}><ArrowLeft size={17}/>Skip</button>
      <button type="button" className="button button-dark" onClick={() => advance(true)}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'}/>{saved ? 'Keep & next' : 'Shortlist & next'}</button>
    </div>
  </>;
}
