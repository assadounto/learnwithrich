import type {Metadata} from 'next';
import {ArrowRight, Lightbulb} from 'lucide-react';
import Link from '@/components/navigation-link';
import {disciplineLabel, disciplines} from '@/lib/project-ideas';
import {database} from '@/lib/server/database';
import styles from './ideas.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Project Ideas',
  description: 'Explore final-year project and research ideas across engineering, software and other disciplines.',
  alternates: {canonical: '/project-ideas'},
};

type Params = Promise<{discipline?: string; q?: string; tag?: string; page?: string}>;

export default async function ProjectIdeas({searchParams}: {searchParams: Params}) {
  const params = await searchParams;
  const discipline = disciplines.find(item => item.id === params.discipline)?.id ?? '';
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 120) : '';
  const tag = typeof params.tag === 'string' ? params.tag.trim().toLowerCase().slice(0, 40) : '';
  const requested = typeof params.page === 'string' && /^\d{1,6}$/.test(params.page) ? Math.max(1, Number(params.page)) : 1;
  const where = {
    status: 'PUBLISHED' as const,
    ...(discipline ? {discipline} : {}),
    ...(tag ? {tags: {has: tag}} : {}),
    ...(q ? {OR: [{title: {contains: q, mode: 'insensitive' as const}}, {abstract: {contains: q, mode: 'insensitive' as const}}, {tags: {has: q.toLowerCase()}}]} : {}),
  };
  const size = 12;
  const db = database();
  const count = await db.projectIdea.count({where});
  const pages = Math.max(1, Math.ceil(count / size));
  const page = Math.min(requested, pages);
  const ideas = await db.projectIdea.findMany({where, orderBy: [{title: 'asc'}, {slug: 'asc'}], skip: (page - 1) * size, take: size});
  function destination(number: number, nextTag = tag) {
    return `/project-ideas?${new URLSearchParams({q, discipline, tag: nextTag, page: String(number)})}#ideas`;
  }
  return <div className={`ref-container ${styles.page}`}>
    <header className={styles.hero}>
      <div><span className="maker-kicker">LEARNWITHRICH PROJECT IDEAS</span>
        <h1>Find a project worth <i>exploring.</i></h1>
        <p>Start with a final-year project, research topic, or independent build. Each abstract gives you a question to explore and a way to evaluate your work.</p>
        <Link href="/services/request" className="button button-outline">Discuss your own idea <ArrowRight size={16}/></Link>
      </div>
      <Lightbulb aria-hidden="true" strokeWidth={1} className={styles.heroIcon}/>
    </header>
    <section id="ideas" aria-label="Browse ideas">
      <form action="/project-ideas#ideas" className={styles.filters}>
        <label>Search ideas<input name="q" type="search" defaultValue={q} maxLength={120} placeholder="Try solar, sensors, or accessibility"/></label>
        <label>Discipline<select name="discipline" defaultValue={discipline}><option value="">All disciplines</option>{disciplines.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        {tag && <input type="hidden" name="tag" value={tag}/>}
        <button className="button button-dark">Find ideas</button>
      </form>
      <p className={styles.results}>{count} {count === 1 ? 'idea' : 'ideas'} {tag && <>· Tagged {tag} <Link href={destination(1, '')}>Clear tag</Link></>}</p>
      {ideas.length ? <div className={styles.grid}>{ideas.map(idea => <article key={idea.slug} className={styles.card}>
        <span className="maker-kicker">{disciplineLabel(idea.discipline)}</span>
        <h2>{idea.title}</h2><p>{idea.abstract}</p>
        <ul className={styles.tags} aria-label="Tags">{idea.tags.map(item => <li key={item}><Link href={destination(1, item)}>{item}</Link></li>)}</ul>
        <Link className="text-link" href={`/services/request?idea=${idea.slug}`} aria-label={`Request help with ${idea.title}`}>Request help with this idea <ArrowRight size={16}/></Link>
      </article>)}</div> : <p>No ideas match these filters. <Link className="text-link" href="/project-ideas#ideas">Clear filters</Link></p>}
      {pages > 1 && <nav className={styles.pagination} aria-label="Idea pages">
        {page > 1 && <Link href={destination(page - 1)} className="button button-outline">Previous</Link>}
        <span>Page {page} of {pages}</span>
        {page < pages && <Link href={destination(page + 1)} className="button button-outline">Next</Link>}
      </nav>}
    </section>
  </div>;
}
