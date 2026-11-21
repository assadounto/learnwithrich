import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Link from '@/components/navigation-link';
import {ArrowRight, BookOpen, Download, PackageCheck} from 'lucide-react';
import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {money} from '@/lib/money';
import styles from '../account.module.css';

export const metadata: Metadata = {title: 'Purchases | Your account', robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent('/account/purchases')}`);
  const rows = await database().purchase.findMany({where: {userId: user.id, status: 'PAID'}, orderBy: {paidAt: 'desc'}, take: 100, select: {id: true, amountMinor: true, currency: true, paidAt: true, resource: {select: {title: true}}, resourceMedia: {select: {title: true, mediaAsset: {select: {originalName: true}}}}}});
  return <>
    <header className={styles.pageHeading}><span className="maker-kicker">YOUR UNLOCKED MATERIALS</span><h1>Purchases</h1><p>Open a resource bundle or find a confirmed download.</p><span className={styles.headingCount}>{rows.length} purchases</span></header>
    {rows.length ? <div className={styles.purchaseList}>{rows.map(item=><Link href={`/account/purchases/${item.id}`} className={styles.purchaseRow} key={item.id}><span className={styles.purchaseIcon}>{item.resource ? <BookOpen size={20}/> : <Download size={20}/>}</span><span className={styles.purchaseCopy}><small>{item.resource ? 'RESOURCE BUNDLE' : 'INDIVIDUAL FILE'}</small><strong>{item.resource?.title ?? item.resourceMedia?.title ?? 'Resource purchase'}</strong><em>{item.resourceMedia?.mediaAsset.originalName ?? 'View purchase details'} <ArrowRight size={14}/></em></span><span className={styles.purchaseMeta}><strong>{money(item.amountMinor, item.currency)}</strong><small>{item.paidAt?.toISOString().slice(0,10) ?? 'Paid'}</small></span><ArrowRight className={styles.rowArrow} size={16}/></Link>)}</div> : <div className={styles.empty}><PackageCheck size={25}/><h2>Your purchases will be kept here.</h2><p>Once you unlock a resource, you can return here to open it again.</p><Link href="/resources" className="button button-dark">Explore resources <ArrowRight size={15}/></Link></div>}
  </>;
}
