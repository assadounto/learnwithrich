import type {ResourceStatus} from '@/lib/generated/prisma/client';
import {ArrowLeft, ArrowRight, ArrowUpRight, Lightbulb, Plus, Search} from 'lucide-react';
import {redirect} from 'next/navigation';
import Link from '@/components/navigation-link';
import {SelectMenu} from '@/components/selection-dialog';
import {disciplineLabel, disciplines} from '@/lib/project-ideas';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import styles from './ideas.module.css';

type Params = Promise<{edit?: string; q?: string; status?: string; discipline?: string; page?: string; saved?: string}>;
const pageSize = 20;
const formatDate = new Intl.DateTimeFormat('en-GH', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Accra'});

export default async function ProjectIdeasAdmin({searchParams}: {searchParams: Params}) {
  await requireOwner();
  const params = await searchParams;
  if (typeof params.edit === 'string' && params.edit.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(params.edit)) {
    redirect(`/admin/project-ideas/${params.edit}/edit`);
  }
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 120) : '';
  const rawStatus = params.status;
  const status: ResourceStatus | undefined = rawStatus === 'PUBLISHED' || rawStatus === 'DRAFT' || rawStatus === 'ARCHIVED' ? rawStatus : undefined;
  const discipline = disciplines.find(item => item.id === params.discipline)?.id;
  const requested = typeof params.page === 'string' && /^\d{1,6}$/.test(params.page) ? Math.max(1, Number(params.page)) : 1;
  const where = {status, discipline, ...(q ? {OR: [
    {title: {contains: q, mode: 'insensitive' as const}},
    {abstract: {contains: q, mode: 'insensitive' as const}},
    {tags: {has: q.toLowerCase()}},
  ]} : {})};
  const db = database();
  const [total, ideas, page, pages] = await db.$transaction(async tx => {
    const total = await tx.projectIdea.count({where});
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requested, pages);
    const ideas = await tx.projectIdea.findMany({
      where, orderBy: [{updatedAt: 'desc'}, {slug: 'asc'}], skip: (page - 1) * pageSize, take: pageSize,
      select: {slug: true, title: true, discipline: true, tags: true, status: true, updatedAt: true},
    });
    return [total, ideas, page, pages] as const;
  }, {isolationLevel: 'RepeatableRead'});
  const filtered = Boolean(q || status || discipline);

  function href(number: number) {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (status) query.set('status', status);
    if (discipline) query.set('discipline', discipline);
    if (number > 1) query.set('page', String(number));
    return `/admin/project-ideas${query.size ? `?${query}` : ''}`;
  }

  return <div className={styles.index}>
    <header className={styles.heading}>
      <div><h1>Project ideas</h1><p>Manage research topics, capstone ideas, and drafts submitted through the API.</p></div>
      <div className={styles.actions}>
        <Link href="/project-ideas" className="button button-outline">View public page <ArrowUpRight size={15}/></Link>
        <Link href="/admin/project-ideas/new" className="button button-dark"><Plus size={17}/> New idea</Link>
      </div>
    </header>
    {params.saved === '1' && <p role="status" className="admin-success">Idea saved.</p>}
    <section className={styles.library} aria-labelledby="idea-library">
      <div className={styles.libraryHeading}><h2 id="idea-library">Idea library</h2><span>{total} {total === 1 ? 'idea' : 'ideas'}{filtered ? ' found' : ''}</span></div>
      <form action="/admin/project-ideas" className={styles.filters} key={href(1)}>
        <label>Search<input name="q" type="search" defaultValue={q} maxLength={120} placeholder="Title, abstract, or tag"/></label>
        <label>Discipline<SelectMenu name="discipline" defaultValue={discipline ?? ''}><option value="">All disciplines</option>
          {disciplines.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</SelectMenu></label>
        <label>Status<SelectMenu name="status" defaultValue={status ?? ''}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></SelectMenu></label>
        <button className="button button-outline"><Search size={16}/> Filter</button>
      </form>
      {ideas.length ? <>
        <div className={styles.columns} aria-hidden="true"><span>Idea</span><span>Status</span><span>Last updated</span><span/></div>
        <ul className={styles.rows}>{ideas.map(idea => <li key={idea.slug}>
          <div className={styles.idea}>
            <Link className={styles.ideaTitle} href={`/admin/project-ideas/${idea.slug}/edit`}>{idea.title}</Link>
            <p>{disciplineLabel(idea.discipline)}</p>
            {!!idea.tags.length && <ul className={styles.tags} aria-label="Tags">{idea.tags.slice(0, 3).map(tag => <li key={tag}>{tag}</li>)}
              {idea.tags.length > 3 && <li>+{idea.tags.length - 3} more</li>}
            </ul>}
          </div>
          <span className={styles.status} data-status={idea.status}>{idea.status.toLowerCase()}</span>
          <time dateTime={idea.updatedAt.toISOString()}>{formatDate.format(idea.updatedAt)}</time>
          <Link className={styles.editLink} href={`/admin/project-ideas/${idea.slug}/edit`} aria-label={`Edit ${idea.title}`}>Edit <ArrowRight size={15}/></Link>
        </li>)}</ul>
      </> : <div className={styles.empty}>
        <Lightbulb size={25} aria-hidden="true"/><h3>{filtered ? 'No ideas match these filters' : 'Add your first project idea'}</h3>
        <Link className="button button-outline" href={filtered ? '/admin/project-ideas' : '/admin/project-ideas/new'}>{filtered ? 'Clear filters' : 'New idea'}</Link>
      </div>}
      {pages > 1 && <nav className={styles.pagination} aria-label="Idea pages">
        <span>Page {page} of {pages}</span>
        {page > 1 && <Link href={href(page - 1)} className="button button-outline"><ArrowLeft size={15}/> Previous</Link>}
        {page < pages && <Link href={href(page + 1)} className="button button-outline">Next <ArrowRight size={15}/></Link>}
      </nav>}
    </section>
    <Link className={styles.api} href="/admin/resource-api">Add ideas with the Resource API <ArrowUpRight size={15}/></Link>
  </div>;
}
