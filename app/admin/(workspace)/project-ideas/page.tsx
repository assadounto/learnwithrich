import {SelectMenu} from '@/components/selection-dialog';
import type {ResourceStatus} from '@/lib/generated/prisma/client';
import Link from '@/components/navigation-link';
import {ProjectIdeaForm} from '@/components/admin/project-idea-form';
import {disciplineLabel} from '@/lib/project-ideas';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';

type Params = Promise<{edit?: string; q?: string; status?: string; page?: string; saved?: string}>;

export default async function ProjectIdeasAdmin({searchParams}: {searchParams: Params}) {
  await requireOwner();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 120) : '';
  const requestedStatus = params.status;
  const status: ResourceStatus | undefined = requestedStatus === 'PUBLISHED' || requestedStatus === 'DRAFT' || requestedStatus === 'ARCHIVED'
    ? requestedStatus : undefined;
  const edit = typeof params.edit === 'string' ? params.edit.slice(0, 120) : '';
  const requested = typeof params.page === 'string' && /^\d{1,6}$/.test(params.page) ? Math.max(1, Number(params.page)) : 1;
  const where = {status, ...(q ? {title: {contains: q, mode: 'insensitive' as const}} : {})};
  const db = database();
  const [total, selected] = await Promise.all([db.projectIdea.count({where}), edit ? db.projectIdea.findUnique({where: {slug: edit}}) : null]);
  const pages = Math.max(1, Math.ceil(total / 30));
  const page = Math.min(requested, pages);
  const ideas = await db.projectIdea.findMany({where, orderBy: [{updatedAt: 'desc'}, {slug: 'asc'}], skip: (page - 1) * 30, take: 30});
  function href(number: number, slug = '') {
    return `/admin/project-ideas?${new URLSearchParams({page: String(number), q, status: status ?? '', edit: slug})}`;
  }
  return <div className="newsletter-admin">
    <header className="admin-page-heading"><div><h1>Project ideas</h1><p>Write abstracts, organize ideas with tags, and review drafts submitted by your tools.</p></div>
      <Link href="/project-ideas" className="button button-outline">View public page</Link></header>
    {params.saved === '1' && <p role="status">Idea saved.</p>}
    <ProjectIdeaForm key={selected ? selected.slug + selected.updatedAt.toISOString() : (params.saved === '1' ? 'saved' : 'new')} idea={selected ? {...selected, updatedAt: selected.updatedAt.toISOString()} : undefined}/>
    <section className="admin-panel">
      <form action="/admin/project-ideas" className="newsletter-admin-toolbar">
        <label>Find an idea<input name="q" type="search" defaultValue={q} maxLength={120}/></label>
        <label>Status<SelectMenu name="status" defaultValue={status ?? ''}><option value="">All</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></SelectMenu></label>
        <button className="button button-outline">Filter</button>
        {selected && <Link href={href(page)} className="button button-outline">New idea</Link>}
      </form>
      {ideas.length ? <ul className="newsletter-admin-list">{ideas.map(idea => <li key={idea.slug}>
        <div><strong>{idea.title}</strong><small>{disciplineLabel(idea.discipline)}{idea.tags.length ? ` · ${idea.tags.join(', ')}` : ''}</small></div>
        <span className="admin-status">{idea.status}</span>
        <Link href={href(page, idea.slug)} className="button button-outline">Edit</Link>
      </li>)}</ul> : <p>No ideas found.</p>}
      {pages > 1 && <nav className="newsletter-admin-pages" aria-label="Idea pages">
        {page > 1 && <Link href={href(page - 1)} className="button button-outline">Previous</Link>}
        <span>Page {page} of {pages}</span>
        {page < pages && <Link href={href(page + 1)} className="button button-outline">Next</Link>}
      </nav>}
      <p className="admin-help"><Link href="/admin/resource-api">API instructions for adding ideas with an LLM</Link></p>
    </section>
  </div>;
}
