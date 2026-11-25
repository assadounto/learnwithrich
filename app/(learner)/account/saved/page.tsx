import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Link from '@/components/navigation-link';
import {ArrowRight, BookOpen} from 'lucide-react';
import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {CatalogPagination} from '@/components/catalog-pagination';
import {pageNumber, type BrowseParams} from '@/lib/server/resources/browse';
import {resourceDefinitions} from '@/lib/resource-types';
import {AccountTable} from '@/components/account-table';
import styles from '../account.module.css';

export const metadata: Metadata = {title: 'Saved resources | Your account', robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';

export default async function SavedResourcesPage({searchParams}: {searchParams: Promise<BrowseParams>}) {
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent('/account/saved')}`);
  const requested = pageNumber((await searchParams).page);
  const db = database();
  const size = 24;
  const where = {userId: user.id, resource: {status: 'PUBLISHED' as const, publishedAt: {lte: new Date()}}};
  const [total, rows, page, pages] = await db.$transaction(async tx => {
    const total = await tx.savedResource.count({where});
    const pages = Math.min(1000, Math.max(1, Math.ceil(total / size)));
    const page = Math.min(requested, pages);
    const rows = await tx.savedResource.findMany({
      where, orderBy: [{createdAt: 'desc'}, {resourceId: 'desc'}], skip: (page - 1) * size, take: size,
      select: {createdAt: true, resource: {select: {slug: true, title: true, summary: true, type: true, coverUrl: true}}},
    });
    return [total, rows, page, pages] as const;
  }, {isolationLevel: 'RepeatableRead'});
  return <>
    <header className={styles.pageHeading}><span className="maker-kicker">YOUR PERSONAL LIBRARY</span><h1>Saved resources</h1><p>Ideas you’ve bookmarked for your next project or learning session.</p><span className={styles.headingCount}>{total} saved</span></header>
    {rows.length ? <AccountTable label="Saved resources" columns={['Resource', 'Type', 'Saved on']}>
      {rows.map(({resource, createdAt}) => <tr key={resource.slug}>
        <th scope="row"><div className={styles.tableItem}>
          {resource.coverUrl ? <img src={resource.coverUrl} alt="" loading="lazy" decoding="async"/> : <BookOpen size={19} aria-hidden="true"/>}
          <div><Link href={`/resources/${resource.slug}`}>{resource.title}<ArrowRight size={14}/></Link>
            {resource.summary && <span className={styles.tableSnippet}>{resource.summary}</span>}</div>
        </div></th>
        <td>{resourceDefinitions[resource.type].name}</td>
        <td><time dateTime={createdAt.toISOString()}>{createdAt.toISOString().slice(0, 10)}</time></td>
      </tr>)}
    </AccountTable> : <div className={styles.empty}><BookOpen size={25}/><h2>Your library is ready for a good idea.</h2><p>Save a resource from the library and it’ll be waiting for you here.</p><Link href="/resources" className="button button-dark">Explore resources <ArrowRight size={15}/></Link></div>}
    <CatalogPagination page={page} pages={pages} href={number => `/account/saved?page=${number}`} label="Saved resource pages"/>
  </>;
}
