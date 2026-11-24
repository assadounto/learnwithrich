import {serviceLabel} from '@/lib/service-offerings';
import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Link from '@/components/navigation-link';
import {ArrowRight, Clock3, Wrench} from 'lucide-react';
import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {money} from '@/lib/money';
import styles from '../account.module.css';

export const metadata: Metadata = {title: 'Service requests | Your account', robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';

export default async function ServiceRequestsPage() {
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent('/account/services')}`);
  const rows = await database().serviceRequest.findMany({where: {userId: user.id}, orderBy: {updatedAt: 'desc'}, take: 100, select: {id: true, status: true, serviceType: true, description: true, quoteMinor: true, currency: true, createdAt: true, updatedAt: true}});
  return <>
    <header className={styles.pageHeading}><span className="maker-kicker">WORK WITH RICH</span><h1>Service requests</h1><p>Follow your brief from first review through delivery and revisions.</p><span className={styles.headingCount}>{rows.length} {rows.length === 1 ? 'request' : 'requests'}</span></header>
    {rows.length ? <div className={styles.serviceList}>{rows.map(item=><Link href={`/account/services/${item.id}`} className={styles.serviceRow} key={item.id}><span className={styles.serviceIcon}><Wrench size={19}/></span><span className={styles.serviceCopy}><small>{serviceLabel(item.serviceType)} · Submitted {item.createdAt.toISOString().slice(0,10)}</small><strong>{item.description}</strong><em>Open project details <ArrowRight size={14}/></em></span><span className={`${styles.statusBadge} ${styles[`status_${item.status.toLowerCase()}`] ?? ''}`}><span/>{item.status.replaceAll('_',' ').toLowerCase()}</span><span className={styles.serviceQuote}>{item.quoteMinor == null ? <><Clock3 size={13}/>Quote pending</> : money(item.quoteMinor,item.currency)}</span><ArrowRight className={styles.rowArrow} size={16}/></Link>)}</div> : <div className={styles.empty}><Wrench size={25}/><h2>Ready to work on something together?</h2><p>Send a short brief and Rich will follow up with a quote and next steps.</p><Link href="/services/request" className="button button-dark">Start a project request <ArrowRight size={15}/></Link></div>}
  </>;
}
