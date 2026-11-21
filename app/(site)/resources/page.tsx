import {resources} from '@/lib/server/resources';
import {OwnedResourceGrid} from '@/components/owned-resource-card';
import {resourceDefinitions} from '@/lib/resource-types';
import {resourceTypes} from '@/lib/server/resources/validation';
import type {Metadata} from 'next';
import Link from '@/components/navigation-link';
import {Search} from 'lucide-react';

export const dynamic = 'force-dynamic';
export async function generateMetadata({searchParams}: {searchParams: Promise<Params>}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Boolean(params.q || params.type || params.page);
  return {
    title: 'Resource library',
    description: 'Explore projects, articles, courses, learning paths, books, guides, downloads and illustrations from LearnWithRich.',
    alternates: {canonical: '/resources'},
    openGraph: {url: '/resources'},
    ...(hasFilters ? {robots: {index: false, follow: true}} : {}),
  };
}
type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => typeof value === 'string' ? value : '';
export default async function ResourcesPage({searchParams}: {searchParams: Promise<Params>}) {
  const params = await searchParams;
  const type = one(params.type).toUpperCase();
  const query = one(params.q).slice(0, 200);
  const page = Math.max(1, Math.min(1000, Number.parseInt(one(params.page) || '1', 10) || 1));
  const filters = new URLSearchParams({limit: '48', page: String(page)});
  if (resourceTypes.includes(type as typeof resourceTypes[number])) filters.set('type', type);
  if (query) filters.set('q', query);
  const {items, total} = await resources().listPublic(filters);
  const pages = Math.max(1, Math.ceil(total / 48));
  const label = type && type in resourceDefinitions ? resourceDefinitions[type as keyof typeof resourceDefinitions].plural : 'The resource library';
  const pageLink = (value: number) => {const next = new URLSearchParams(filters); next.set('page', String(value)); return `/resources?${next.toString()}`;};
  return <section className="owned-catalog-page ref-container">
    <header className="owned-catalog-hero"><span className="maker-kicker">THE LEARNWITHRICH LIBRARY</span><h1>Useful ideas. Ready to <i>explore.</i></h1><p>A growing collection of hands-on projects, practical lessons, thoughtful writing and tools to help you make your next idea real.</p></header>
    <form action="/resources" method="get" className="owned-catalog-controls"><label className="sr-only" htmlFor="resource-search">Search the library</label><input id="resource-search" type="search" name="q" placeholder="Search titles, topics and ideas…" defaultValue={query}/><label className="sr-only" htmlFor="resource-type">Resource type</label><select id="resource-type" name="type" defaultValue={type}><option value="">All resource types</option>{resourceTypes.map(key => <option key={key} value={key}>{resourceDefinitions[key].plural}</option>)}</select><button className="button button-dark" type="submit"><Search size={16}/>Search library</button></form>
    <p className="owned-catalog-count">{total} {total === 1 ? 'resource' : 'resources'} · {label}{query && ` matching “${query}”`}</p>
    {items.length ? <OwnedResourceGrid items={items}/> : <div className="owned-catalog-empty"><h2>No published resources match yet.</h2><p>Try another search, or browse all resource types.</p><Link className="button button-outline" href="/resources">Clear filters</Link></div>}
    {pages > 1 && <nav className="owned-catalog-pagination" aria-label="Resource pages">{page > 1 && <Link href={pageLink(page - 1)}>Previous</Link>}<span aria-current="page">Page {page} of {pages}</span>{page < pages && <Link href={pageLink(page + 1)}>Next</Link>}</nav>}
  </section>;
}
