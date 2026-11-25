import {CatalogPagination} from '@/components/catalog-pagination';
import {StudioPageSize} from '@/components/admin/studio-page-size';
import {requestedPage, studioPageSize} from '@/lib/pagination';
import {SelectMenu} from '@/components/selection-dialog';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {updateNewsletterSignup} from './actions';

export default async function NewsletterAdmin({searchParams}: {
  searchParams: Promise<{q?: string; status?: string; page?: string; per?: string}>;
}) {
  await requireOwner();
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 254) : '';
  const status = ['pending', 'verified'].includes(params.status ?? '') ? params.status : undefined;
  const requested = requestedPage(params.page);
  const pageSize = studioPageSize(params.per, 50);
  const where = {
    ...(query ? {email: {contains: query, mode: 'insensitive' as const}} : {}),
    ...(status === 'pending' ? {verifiedAt: null} : status === 'verified' ? {verifiedAt: {not: null}} : {}),
  };
  const db = database();
  const total = await db.newsletterSignup.count({where});
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, pages);
  const signups = await db.newsletterSignup.findMany({
    where, orderBy: [{createdAt: 'desc'}, {email: 'asc'}], skip: (page - 1) * pageSize, take: pageSize,
    select: {email: true, createdAt: true, verifiedAt: true},
  });
  const href = (number: number) => `/admin/community/newsletter?${new URLSearchParams({q: query, status: status ?? '', page: String(number), per: String(pageSize)})}`;

  return <div className="newsletter-admin">
    <header className="admin-page-heading"><div><h1>Newsletter signups</h1><p>Review collected addresses and mark them verified after checking them. Status changes do not send email.</p></div></header>
    <section className="admin-panel">
      <form className="newsletter-admin-toolbar" action="/admin/community/newsletter" key={href(1)}>
        <label>Find an email<input name="q" type="search" defaultValue={query} maxLength={254}/></label>
        <label>Status<SelectMenu name="status" defaultValue={status ?? ''}><option value="">All</option><option value="pending">Pending</option><option value="verified">Verified</option></SelectMenu></label>
        <StudioPageSize value={pageSize}/>
        <button type="submit" className="button button-outline">Filter</button>
      </form>
      {signups.length ? <ul className="newsletter-admin-list">
        {signups.map(signup => <li key={signup.email}>
          <div><strong>{signup.email}</strong><small>Signed up <time dateTime={signup.createdAt.toISOString()}>{signup.createdAt.toISOString().slice(0, 10)}</time></small></div>
          <span className="admin-status">{signup.verifiedAt ? 'Verified' : 'Pending'}</span>
          <form action={updateNewsletterSignup.bind(null, signup.email, signup.verifiedAt ? 'pending' : 'verify')}>
            <button className="button button-outline">{signup.verifiedAt ? 'Mark pending' : 'Mark verified'}</button>
          </form>
          <details><summary>Remove</summary>
            <form action={updateNewsletterSignup.bind(null, signup.email, 'remove')}>
              <button className="button button-outline">Confirm removal</button>
            </form>
          </details>
        </li>)}
      </ul> : <p className="admin-help">{query || status ? 'No matching signups.' : 'No newsletter signups yet.'}</p>}
      <p className="admin-help">{total} {total === 1 ? 'signup' : 'signups'}</p>
      <CatalogPagination page={page} pages={pages} href={href} label="Newsletter signup pages"/>
    </section>
  </div>;
}
