import {serviceLabel} from '@/lib/service-offerings';
import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Link from '@/components/navigation-link';
import {ArrowRight, Wrench} from 'lucide-react';
import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {money} from '@/lib/money';
import {AccountTable} from '@/components/account-table';
import styles from '../account.module.css';

export const metadata: Metadata = {title: 'Service requests | Your account', robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';

export default async function ServiceRequestsPage() {
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent('/account/services')}`);
  const rows = await database().serviceRequest.findMany({where: {userId: user.id}, orderBy: {updatedAt: 'desc'}, take: 100, select: {id: true, status: true, serviceType: true, description: true, quoteMinor: true, currency: true, updatedAt: true}});
  return <>
    <header className={styles.pageHeading}><span className="maker-kicker">WORK WITH RICH</span><h1>Service requests</h1><p>Follow your brief from first review through delivery and revisions.</p><span className={styles.headingCount}>{rows.length} {rows.length === 1 ? 'request' : 'requests'}</span></header>
    {rows.length ? <AccountTable label="Service requests" columns={['Request', 'Status', 'Quote', 'Last updated']}>
      {rows.map(item => <tr key={item.id}>
        <th scope="row"><div className={styles.tableItem}>
          <Wrench size={19} aria-hidden="true"/>
          <div><Link href={`/account/services/${item.id}`}>{serviceLabel(item.serviceType)}<ArrowRight size={14}/></Link>
            <span className={styles.tableSnippet}>{item.description}</span></div>
        </div></th>
        <td><span className={styles.tableStatus}>{item.status.replaceAll('_', ' ').toLowerCase()}</span></td>
        <td>{item.quoteMinor == null ? 'Quote pending' : money(item.quoteMinor, item.currency)}</td>
        <td><time dateTime={item.updatedAt.toISOString()}>{item.updatedAt.toISOString().slice(0, 10)}</time></td>
      </tr>)}
    </AccountTable> : <div className={styles.empty}><Wrench size={25}/><h2>Ready to work on something together?</h2><p>Send a short brief and Rich will follow up with a quote and next steps.</p><Link href="/services/request" className="button button-dark">Start a project request <ArrowRight size={15}/></Link></div>}
  </>;
}
