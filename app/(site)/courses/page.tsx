import type {Metadata} from 'next';
import Link from '@/components/navigation-link';
import {catalogPage, pageNumber, type BrowseParams} from '@/lib/server/resources/browse';
import {CatalogPagination} from '@/components/catalog-pagination';
import {OwnedResourceGrid} from '@/components/owned-resource-card';
import {ArrowRight, BookOpenCheck, Route} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'Practical courses and learning paths', description: 'Learn by making with guided courses, lessons and learning paths from LearnWithRich.', alternates: {canonical: '/courses'}, openGraph: {url: '/courses'}};
export default async function CoursesPage({searchParams}: {searchParams: Promise<BrowseParams>}) {
  const params = await searchParams;
  const [courses, paths] = await Promise.all([
    catalogPage(new URLSearchParams({type: 'COURSE'}), pageNumber(params.coursePage)),
    catalogPage(new URLSearchParams({type: 'PATH'}), pageNumber(params.pathPage)),
  ]);
  function href(section: 'courses' | 'paths', page: number) {
    const next = new URLSearchParams({coursePage: String(section === 'courses' ? page : courses.page), pathPage: String(section === 'paths' ? page : paths.page)});
    return `/courses?${next}#${section}`;
  }
  return <div className="owned-courses-page ref-container"><header className="owned-courses-hero"><span className="maker-kicker">LEARN BY DOING</span><h1>Less watching.<br/><i>More making.</i></h1><p>Practical courses and guided learning paths built around useful projects. Work through a subject, one clear step at a time.</p><div><Link className="button button-dark" href="#courses"><BookOpenCheck size={16}/>Explore courses</Link><Link className="button button-outline" href="#paths"><Route size={16}/>Find a learning path</Link></div></header>
    <section className="owned-learning-section" id="courses"><header><div><span className="maker-kicker">PRACTICAL COURSES</span><h2>Build your understanding.</h2><p>Structured courses bring lessons together into a focused learning experience.</p></div><span className="owned-learning-count">{courses.total} {courses.total === 1 ? 'course' : 'courses'}</span></header>{courses.items.length ? <OwnedResourceGrid items={courses.items}/> : <div className="owned-catalog-empty"><h2>New courses are taking shape.</h2><p>Published courses will appear here when their lessons are ready.</p></div>}<CatalogPagination page={courses.page} pages={courses.pages} href={page => href('courses', page)} label="Course pages"/></section>
    <section className="owned-learning-section is-paths" id="paths"><header><div><span className="maker-kicker">LEARNING PATHS</span><h2>Connect ideas into a journey.</h2><p>Follow a curated sequence of resources, projects and courses toward a bigger goal.</p></div><span className="owned-learning-count">{paths.total} {paths.total === 1 ? 'path' : 'paths'}</span></header>{paths.items.length ? <OwnedResourceGrid items={paths.items}/> : <div className="owned-catalog-empty"><h2>Guided journeys are coming.</h2><p>Learning paths will appear here as they’re published.</p><Link className="text-link" href="/resources">Explore resources <ArrowRight size={16}/></Link></div>}<CatalogPagination page={paths.page} pages={paths.pages} href={page => href('paths', page)} label="Learning path pages"/></section>
  </div>;
}
