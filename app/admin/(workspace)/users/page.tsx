import {ArrowRight, ChevronLeft, ChevronRight, Search, Users} from 'lucide-react';
import Link from '@/components/navigation-link';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import styles from '@/components/admin/community-inbox.module.css';

const pageSize = 20;
const date = new Intl.DateTimeFormat('en-GH', {dateStyle: 'medium', timeZone: 'Africa/Accra'});

export const metadata = {title: 'Users'};

export default async function UsersPage({searchParams}: {searchParams: Promise<{q?: string; page?: string; deleted?: string}>}) {
  await requireOwner();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 120) : '';
  const requested = typeof params.page === 'string' && /^\d{1,6}$/.test(params.page) ? Math.max(1, Number(params.page)) : 1;
  const where = q ? {OR: [{name: {contains: q, mode: 'insensitive' as const}}, {email: {contains: q, mode: 'insensitive' as const}}]} : {};
  const {users, page, pages, count} = await database().$transaction(async tx => {
    const count = await tx.user.count({where});
    const pages = Math.max(1, Math.ceil(count / pageSize));
    const page = Math.min(requested, pages);
    const users = await tx.user.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize, orderBy: [{createdAt: 'desc'}, {id: 'asc'}],
      select: {id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true},
    });
    return {users, page, pages, count};
  }, {isolationLevel: 'RepeatableRead'});

  function pageHref(number: number) {
    const query = new URLSearchParams({page: String(number)});
    if (q) query.set('q', q);
    return `/admin/users?${query}`;
  }

  return <div className={styles.root}>
    <header className={styles.pageHeader}><div><h1>Users</h1><p>Review registered accounts and their activity.</p></div>
      <span className={styles.total}><Users size={16}/>{count} {count === 1 ? 'account' : 'accounts'}</span>
    </header>
    {params.deleted === '1' && <p className="admin-success" role="status">Learner account deleted.</p>}
    <section className={styles.inbox} aria-label="Account directory">
      <form action="/admin/users" className={styles.toolbar} key={q}>
        <label className={styles.search}><Search size={16}/><span className="sr-only">Search users</span>
          <input type="search" name="q" defaultValue={q} maxLength={120} placeholder="Name or email"/>
        </label>
        <button type="submit" className="button button-outline">Search</button>
        {q && <Link className="button button-outline" href="/admin/users">Clear search</Link>}
      </form>
      {users.length ? <table className={styles.table}>
        <caption className="sr-only">Registered accounts</caption>
        <thead><tr><th scope="col">Account</th><th scope="col">Role</th><th scope="col" className={styles.dateColumn}>Joined</th><th scope="col" className={styles.openColumn}>Details</th></tr></thead>
        <tbody>{users.map(user => <tr className={styles.entry} key={user.id}>
          <th scope="row"><div className={styles.person}><div><strong>{user.name || 'Unnamed user'}</strong><span>{user.email}</span>
            <time className={styles.mobileDate} dateTime={user.createdAt.toISOString()}>{date.format(user.createdAt)}</time></div></div></th>
          <td><span className="admin-status">{user.role === 'OWNER' ? 'Owner' : 'Learner'}</span>{!user.emailVerified && <div className="admin-help">Email unverified</div>}</td>
          <td className={styles.dateColumn}><time dateTime={user.createdAt.toISOString()}>{date.format(user.createdAt)}</time></td>
          <td className={styles.openColumn}><Link className={styles.openDetails} href={`/admin/users/${encodeURIComponent(user.id)}`}
            aria-label={`Open account for ${user.name || user.email}`}><span>Open</span><ArrowRight size={16}/></Link></td>
        </tr>)}</tbody>
      </table> : <p className={styles.empty}>{q ? 'No accounts match your search.' : 'No registered accounts yet.'}</p>}
      {pages > 1 && <nav className={styles.pagination} aria-label="User directory pages">
        <span>Page {page} of {pages}</span>
        {page > 1 && <Link className="button button-outline" href={pageHref(page - 1)}><ChevronLeft size={16}/>Previous</Link>}
        {page < pages && <Link className="button button-outline" href={pageHref(page + 1)}>Next<ChevronRight size={16}/></Link>}
      </nav>}
    </section>
  </div>;
}
