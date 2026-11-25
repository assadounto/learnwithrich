import {serviceLabel} from '@/lib/service-offerings';
import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Link from '@/components/navigation-link';
import {ArrowRight, Bookmark, BookOpen, CircleCheck, Clock3, PackageCheck, Sparkles, Wrench} from 'lucide-react';
import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {PaymentVerification} from '@/components/account-actions';
import styles from './account.module.css';

export const metadata: Metadata = {title: 'Your learning account', robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';

export default async function AccountPage({searchParams}: {searchParams: Promise<{payment?: string; reference?: string}>}) {
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent('/account')}`);
  const {payment, reference} = await searchParams;
  const db = database();
  const [savedCount, purchaseCount, serviceCount, recentSaved, recentPurchase, recentService] = await Promise.all([
    db.savedResource.count({where: {userId: user.id, resource: {status: 'PUBLISHED', publishedAt: {lte: new Date()}}}}),
    db.purchase.count({where: {userId: user.id, status: 'PAID'}}),
    db.serviceRequest.count({where: {userId: user.id}}),
    db.savedResource.findMany({where: {userId: user.id, resource: {status: 'PUBLISHED', publishedAt: {lte: new Date()}}}, orderBy: {createdAt: 'desc'}, take: 3, select: {resource: {select: {slug: true, title: true, type: true, coverUrl: true}}}}),
    db.purchase.findMany({where: {userId: user.id, status: 'PAID'}, orderBy: {paidAt: 'desc'}, take: 3, select: {id: true, paidAt: true, resource: {select: {title: true}}, resourceMedia: {select: {title: true}}}}),
    db.serviceRequest.findMany({where: {userId: user.id}, orderBy: {updatedAt: 'desc'}, take: 3, select: {id: true, status: true, serviceType: true, updatedAt: true}}),
  ]);
  const firstName = user.name.trim().split(/\s+/)[0] || 'learner';
  return <>
    <header className={styles.welcome}><div><span className="maker-kicker">YOUR LEARNWITHRICH ACCOUNT</span><h1>Good to have you back,<br/><i>{firstName}.</i></h1><p>Your saved ideas, purchases and projects are gathered here.</p></div><div className={styles.profile}><div className={styles.avatar}>{user.image ? <img src={user.image} alt=""/> : user.name.slice(0,1).toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.email}</small></div></div></header>
    {payment === 'return' && reference && <PaymentVerification reference={reference}/>}
    <section className={styles.dashboardSection}><header className={styles.sectionHeading}><div><span className="maker-kicker">YOUR LEARNING SPACE</span><h2>A quick overview</h2></div><span className={styles.lastUpdated}><Clock3 size={14}/>Always here when you need it</span></header>
      <div className={styles.summaryGrid}>
        <Link href="/account/saved" className={styles.summaryCard}><span className={styles.summaryIcon}><Bookmark size={18}/></span><span><small>LIBRARY</small><strong>{savedCount} saved {savedCount === 1 ? 'resource' : 'resources'}</strong><em>Pick up an idea you saved <ArrowRight size={13}/></em></span></Link>
        <Link href="/account/purchases" className={styles.summaryCard}><span className={styles.summaryIcon}><PackageCheck size={18}/></span><span><small>PURCHASES</small><strong>{purchaseCount} {purchaseCount === 1 ? 'purchase' : 'purchases'}</strong><em>Open your unlocked materials <ArrowRight size={13}/></em></span></Link>
        <Link href="/account/services" className={styles.summaryCard}><span className={styles.summaryIcon}><Wrench size={18}/></span><span><small>WORK WITH RICH</small><strong>{serviceCount} {serviceCount === 1 ? 'project request' : 'project requests'}</strong><em>See updates and next steps <ArrowRight size={13}/></em></span></Link>
      </div>
    </section>
    <section className={styles.dashboardSection}><header className={styles.sectionHeading}><div><span className="maker-kicker">A LITTLE MOMENTUM</span><h2>Recently in your account</h2></div></header>
      <div className={styles.recentGrid}>
        <article className={styles.recentCard}><header><Bookmark size={16}/><h3>Saved</h3><Link href="/account/saved" aria-label="View all saved resources"><ArrowRight size={16}/></Link></header>{recentSaved.length ? recentSaved.map(({resource})=><Link href={`/resources/${resource.slug}`} className={styles.recentRow} key={resource.slug}><span className={styles.recentThumb}>{resource.coverUrl ? <img src={resource.coverUrl} alt=""/> : <BookOpen size={17}/>}</span><span><small>{resource.type}</small><strong>{resource.title}</strong></span><ArrowRight size={14}/></Link>) : <p className={styles.recentEmpty}>Save a resource that catches your eye and it’ll show up here.</p>}</article>
        <article className={styles.recentCard}><header><PackageCheck size={16}/><h3>Purchases</h3><Link href="/account/purchases" aria-label="View all purchases"><ArrowRight size={16}/></Link></header>{recentPurchase.length ? recentPurchase.map(item=><Link href={`/account/purchases/${item.id}`} className={styles.recentRow} key={item.id}><span className={styles.recentThumb}><CircleCheck size={17}/></span><span><small>{item.paidAt?.toISOString().slice(0,10) ?? 'Paid'}</small><strong>{item.resource?.title ?? item.resourceMedia?.title ?? 'Resource purchase'}</strong></span><ArrowRight size={14}/></Link>) : <p className={styles.recentEmpty}>Your confirmed purchases and download links will appear here.</p>}</article>
        <article className={styles.recentCard}><header><Wrench size={16}/><h3>Projects</h3><Link href="/account/services" aria-label="View all service requests"><ArrowRight size={16}/></Link></header>{recentService.length ? recentService.map(item=><Link href={`/account/services/${item.id}`} className={styles.recentRow} key={item.id}><span className={styles.recentThumb}><Sparkles size={17}/></span><span><small>{item.status.replaceAll('_',' ')}</small><strong>{serviceLabel(item.serviceType)}</strong></span><ArrowRight size={14}/></Link>) : <p className={styles.recentEmpty}>Send a project brief when you’re ready to work together.</p>}</article>
      </div>
    </section>
  </>;
}
