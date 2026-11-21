import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';
import Link from '@/components/navigation-link';
import {ArrowLeft, BookOpen, CheckCircle, Download, FileText} from 'lucide-react';
import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {money} from '@/lib/money';
import styles from '../../account.module.css';

export const metadata: Metadata = {title: 'Purchase details | Your account', robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';

export default async function PurchaseDetailPage({params}: {params: Promise<{id: string}>}) {
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent('/account/purchases')}`);
  const {id} = await params;
  const item = await database().purchase.findFirst({where: {id, userId: user.id, status: 'PAID'}, select: {id: true, amountMinor: true, currency: true, paidAt: true, reference: true, resource: {select: {id: true, slug: true, title: true, summary: true}}, resourceMedia: {select: {id: true, title: true, resource: {select: {id: true, slug: true, title: true}}, mediaAsset: {select: {id: true, originalName: true}}}}}});
  if (!item) notFound();
  return <>
    <Link href="/account/purchases" className={styles.backLink}><ArrowLeft size={15}/>All purchases</Link>
    <header className={styles.pageHeading}><span className="maker-kicker">PURCHASE DETAILS</span><h1>{item.resource?.title ?? item.resourceMedia?.title ?? 'Resource purchase'}</h1><p>Confirmed {item.paidAt?.toISOString().slice(0,10) ?? 'payment'} · {money(item.amountMinor, item.currency)}</p><span className={styles.headingCount}><CheckCircle size={14}/> Payment confirmed</span></header>
    <section className={styles.detailPanel}><h2><BookOpen size={19}/> Your materials</h2>{item.resource ? <><p>{item.resource.summary}</p><Link className={styles.detailAction} href={`/resources/${item.resource.slug}`}>Open resource bundle <ArrowLeft size={14}/></Link></> : null}{item.resourceMedia ? <div className={styles.downloadRow}><span><FileText size={18}/><span><strong>{item.resourceMedia.title}</strong><small>{item.resourceMedia.mediaAsset.originalName}</small></span></span><a href={`/api/resource-files/${item.resourceMedia.id}?resourceId=${item.resourceMedia.resource.id}`} download={item.resourceMedia.mediaAsset.originalName}>Download <Download size={15}/></a></div> : null}</section>
    <section className={styles.receiptPanel}><span className="maker-kicker">PAYMENT RECORD</span><dl><div><dt>Amount</dt><dd>{money(item.amountMinor, item.currency)}</dd></div><div><dt>Status</dt><dd>Paid</dd></div><div><dt>Reference</dt><dd>{item.reference}</dd></div></dl></section>
  </>;
}
