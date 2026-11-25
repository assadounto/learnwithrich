'use client';

import {useEffect, useState} from 'react';
import Link from '@/components/navigation-link';
import {Bookmark, ArrowRight} from 'lucide-react';
import {resources} from '@/lib/catalog';
import {bookmarkEvent, readBrowserBookmarks, writeBrowserBookmarks} from '@/lib/browser-bookmarks';
import {CompactResource} from './compact-resource';
import {OwnedResourceCard, type ResourceCardData} from './owned-resource-card';
import {DrawnUnderline} from './decorative-marks';
import {CatalogPagination} from '@/components/catalog-pagination';
import {useSiteAccount} from './site-account';

const pageSize = 12;

export function SavedLibrary() {
  const account = useSiteAccount();
  const [slugs, setSlugs] = useState<string[]>();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{key: string; items: ResourceCardData[]; error?: string}>();
  useEffect(() => {
    const read = () => setSlugs(readBrowserBookmarks());
    read();
    window.addEventListener(bookmarkEvent, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(bookmarkEvent, read);
      window.removeEventListener('storage', read);
    };
  }, []);

  const pages = Math.max(1, Math.ceil((slugs?.length ?? 0) / pageSize));
  const currentPage = Math.min(page, pages);
  const selected = slugs?.slice((currentPage - 1) * pageSize, currentPage * pageSize) ?? [];
  const query = new URLSearchParams(selected.filter(slug => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120).map(slug => ['slug', slug])).toString();

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    void fetch(`/api/public-bookmarks?${query}`, {signal: controller.signal})
      .then(async response => {
        if (!response.ok) throw new Error('Could not load all bookmarks. Try refreshing the page.');
        const data: {items: ResourceCardData[]} = await response.json();
        if (!controller.signal.aborted) setResult({key: query, items: data.items});
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({key: query, items: [], error: 'Could not load all bookmarks. Try refreshing the page.'});
      });
    return () => controller.abort();
  }, [query]);

  const ready = slugs !== undefined && (!query || result?.key === query);
  const bySlug = new Map((result?.key === query ? result.items : []).map(item => [item.slug, item]));

  return <div className="owned-library-page">
    <header className="owned-library-heading"><span className="maker-kicker">YOUR PERSONAL COLLECTION</span><h1>Keep your next idea <i>close.</i><DrawnUnderline className="orange-scribble"/></h1>
      <p>Browse bookmarks on this device. Published resources transfer to your account when you sign in.</p>
      {account && <Link className="text-link" href="/account/saved">Open account bookmarks <ArrowRight size={16}/></Link>}
    </header>
    {!ready ? <p role="status">Opening your saved resources…</p> : selected.length ? <>
      {result?.key === query && result.error && <p role="alert">{result.error}</p>}
      <div className="owned-resource-grid">{selected.map(slug => {
        const article = bySlug.get(slug);
        if (article) return <OwnedResourceCard key={slug} item={article}/>;
        const legacy = resources.find(resource => resource.slug === slug);
        return legacy ? <CompactResource key={slug} resource={legacy}/> : <div key={slug} className="owned-catalog-empty"><p>This resource is currently unavailable.</p><button className="button button-outline" type="button" onClick={() => writeBrowserBookmarks(readBrowserBookmarks().filter(value => value !== slug))}>Remove bookmark</button></div>;
      })}</div>
      <CatalogPagination page={currentPage} pages={pages} onPage={setPage} label="Device bookmark pages"/>
    </> : <div className="owned-catalog-empty"><Bookmark size={28}/><h2>Your collection starts with a spark.</h2><p>Save a resource to find it here again.</p><Link className="button button-dark" href="/resources">Explore resources <ArrowRight size={16}/></Link></div>}
  </div>;
}
