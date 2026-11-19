'use client';
import {useEffect, useState} from 'react';
import Link from '@/components/navigation-link';
import {Bookmark, ArrowRight} from 'lucide-react';
import {resources} from '@/lib/catalog';
import {CompactResource} from './compact-resource';
import {DrawnUnderline} from './decorative-marks';

export function SavedLibrary() {
  const [saved, setSaved] = useState<string[]>([]), [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => {
      try {const value: unknown = JSON.parse(localStorage.getItem('lwr-saved') || '[]'); setSaved(Array.isArray(value) ? value.filter(item => typeof item === 'string') : []);}
      catch {setSaved([]);}
      setReady(true);
    };
    read(); window.addEventListener('lwr-saved-change', read); window.addEventListener('storage', read);
    return () => {window.removeEventListener('lwr-saved-change', read); window.removeEventListener('storage', read);};
  }, []);
  const items = resources.filter(resource => saved.includes(resource.slug));
  return <div className="owned-library-page">
    <header className="owned-library-heading"><span className="maker-kicker">YOUR PERSONAL COLLECTION</span><h1>Keep your next idea <i>close.</i><DrawnUnderline className="orange-scribble"/></h1><p>Resources you bookmark are saved in this browser, so you can find them again on this device.</p><Link className="text-link" href="/resources">Browse the resource library <ArrowRight size={16}/></Link></header>
    {!ready ? <p role="status">Opening your saved resources…</p> : items.length ? <><p className="owned-catalog-count">{items.length} saved {items.length === 1 ? 'resource' : 'resources'}</p><div className="studio-personal-resources">{items.map(resource => <CompactResource key={resource.slug} resource={resource}/>)}</div></> : <div className="owned-catalog-empty"><Bookmark size={28}/><h2>Your collection starts with a spark.</h2><p>Use the bookmark control on any resource to save it here.</p><Link className="button button-dark" href="/resources">Explore resources <ArrowRight size={16}/></Link></div>}
    <p className="owned-library-note">This is a browser-local bookmark list. Account profiles, purchases and course progress are not part of this release.</p>
  </div>;
}
