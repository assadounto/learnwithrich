import type {Metadata} from 'next';
import {ResourceCatalog} from '@/components/resource-catalog';
import {browseCatalog, type BrowseParams} from '@/lib/server/resources/browse';

export const dynamic = 'force-dynamic';
export async function generateMetadata({searchParams}: {searchParams: Promise<BrowseParams>}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Boolean(params.q || params.type || params.tag || params.page || params.mode || params.category || params.topic);
  return {
    title: 'Resource library',
    description: 'Explore projects, articles, courses, learning paths, books, guides, downloads and illustrations from LearnWithRich.',
    alternates: {canonical: '/resources'},
    openGraph: {url: '/resources'},
    ...(hasFilters ? {robots: {index: false, follow: true}} : {}),
  };
}
export default async function ResourcesPage({searchParams}: {searchParams: Promise<BrowseParams>}) {
  const data = await browseCatalog(await searchParams);
  return <section className="owned-catalog-page ref-container">
    <header className="owned-catalog-hero"><span className="maker-kicker">THE LEARNWITHRICH LIBRARY</span><h1>Useful ideas. Ready to <i>explore.</i></h1><p>A growing collection of hands-on projects, practical lessons, thoughtful writing and tools to help you make your next idea real.</p></header>
    <div id="catalog-results"><ResourceCatalog data={data} path="/resources"/></div>
  </section>;
}
