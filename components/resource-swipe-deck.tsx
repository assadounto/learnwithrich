'use client';

import {useRef, useState, type PointerEvent} from 'react';
import {ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Layers} from 'lucide-react';
import Link from '@/components/navigation-link';
import {publicImageAttributes} from '@/lib/image-sizes';
import type {ResourceCardData} from './owned-resource-card';
import {useResourceBookmark} from './resource-card';

export function ResourceSwipeDeck({items, nextHref}: {items: ResourceCardData[]; nextHref?: string}) {
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState('');
  const item = items[index];

  return <section className="swipe-deck" aria-label="Swipe through matching resources">
    <header><div><h2>Find your next build</h2><p>Swipe right to save, left to skip. Tap a card to see the details.</p></div>
      <span>{Math.min(index + 1, items.length)} / {items.length}</span>
    </header>
    {item ? <SwipeCard key={item.id} item={item} advance={saved => {
      setMessage(saved ? `Saved ${item.title}.` : `Skipped ${item.title}.`);
      setIndex(previous => previous + 1);
    }}/> : <div className="swipe-finish">
      <Layers size={28} aria-hidden="true"/>
      <h3>You’ve reached the end of this page.</h3>
      {nextHref && <Link className="button button-dark" href={nextHref}>Continue to the next page <ArrowRight size={16}/></Link>}
      <button type="button" className="button button-outline" onClick={() => {setIndex(0); setMessage('Deck restarted.');}}>Restart this page</button>
    </div>}
    <div className="swipe-status">
      {index > 0 && <button type="button" className="button button-outline" onClick={() => {setIndex(previous => previous - 1); setMessage('Showing previous card.');}}><ArrowLeft size={16}/>Previous card</button>}
      <span role="status">{message}</span>
    </div>
  </section>;
}

function SwipeCard({item, advance}: {item: ResourceCardData; advance: (saved: boolean) => void}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{x: number; y: number; id: number} | null>(null);
  const suppressClick = useRef(false);
  const deciding = useRef(false);
  const {ready, saved, busy, error, setBookmark} = useResourceBookmark(item.slug);

  async function decide(save: boolean) {
    if (deciding.current || (save && !ready)) return;
    deciding.current = true;
    try {
      if (!save || await setBookmark(true)) advance(save);
    } finally { deciding.current = false; }
  }

  function begin(event: PointerEvent<HTMLAnchorElement>) {
    if (!event.isPrimary || event.button !== 0 || deciding.current) return;
    suppressClick.current = false;
    start.current = {x: event.clientX, y: event.clientY, id: event.pointerId};
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function move(event: PointerEvent<HTMLAnchorElement>) {
    const initial = start.current;
    if (!initial || initial.id !== event.pointerId) return;
    const dx = event.clientX - initial.x;
    if (Math.abs(dx) > 8) suppressClick.current = true;
    setOffset(Math.max(-130, Math.min(130, dx)));
  }

  function end(event: PointerEvent<HTMLAnchorElement>, cancelled = false) {
    const initial = start.current;
    if (!initial || initial.id !== event.pointerId) return;
    start.current = null;
    setDragging(false);
    setOffset(0);
    if (cancelled) { suppressClick.current = true; return; }
    const dx = event.clientX - initial.x, dy = event.clientY - initial.y;
    if (Math.abs(dx) >= 64 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      suppressClick.current = true;
      void decide(dx > 0);
    }
  }

  return <>
    <div className="swipe-stage">
      <Link className={`swipe-card${dragging ? ' is-dragging' : ''}`} href={`/resources/${encodeURIComponent(item.slug)}`} prefetch={false}
        draggable={false} onDragStart={event => event.preventDefault()}
        onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={event => end(event, true)}
        onLostPointerCapture={event => end(event, true)} onClick={event => {
          if (event.detail !== 0 && suppressClick.current) event.preventDefault();
          suppressClick.current = false;
        }}
        style={{transform: `translateX(${offset}px) rotate(${offset / 18}deg)`}}>
        <div className="swipe-cover">
          {item.coverUrl ? <img {...publicImageAttributes(item.coverUrl, [384, 768, 1280], '(max-width: 620px) 90vw, 560px')} alt="" decoding="async" draggable={false}/> : <Layers size={54} strokeWidth={1.2} aria-hidden="true"/>}
          {Math.abs(offset) > 30 && <span className={offset > 0 ? 'swipe-save-stamp' : 'swipe-skip-stamp'} aria-hidden="true">{offset > 0 ? 'Save' : 'Skip'}</span>}
        </div>
        <div className="swipe-copy">
          <span className="maker-kicker">{item.type.toLowerCase().replace(/^./, letter => letter.toUpperCase())}</span>
          <h3>{item.title}</h3>
          {item.summary && <p>{item.summary}</p>}
          {!!item.tags.length && <ul aria-label="Tags">{item.tags.slice(0, 3).map(tag => <li key={tag}>{tag}</li>)}</ul>}
          <span className="text-link">Open details <ArrowUpRight size={15}/></span>
        </div>
      </Link>
    </div>
    <div className="swipe-actions">
      <button type="button" className="button button-outline" disabled={busy} onClick={() => void decide(false)}><ArrowLeft size={17}/>Skip</button>
      <button type="button" className="button button-dark" disabled={!ready || busy} onClick={() => void decide(true)}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'}/>{busy ? 'Saving…' : saved ? 'Keep saved & next' : 'Save & next'}</button>
    </div>
    {error && <p role="alert">{error}</p>}
  </>;
}
