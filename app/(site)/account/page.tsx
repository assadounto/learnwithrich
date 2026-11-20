import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Link from '@/components/navigation-link';
import {ArrowRight, Bookmark, BookOpen, Download, PackageCheck} from 'lucide-react';
import {currentUser} from '@/lib/server/identity/current-user';
import {database} from '@/lib/server/database';
import {PaymentVerification, SignOutButton} from '@/components/account-actions';
import styles from './account.module.css';

export const metadata: Metadata = {title: 'Your learning account'};
export const dynamic = 'force-dynamic';

export default async function AccountPage({searchParams}: {searchParams: Promise<{payment?: string; reference?: string}>}) {
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent('/account')}`);
  const {payment, reference} = await searchParams;
  const db = database();
  const [saved, purchases, serviceRequests] = await Promise.all([
    db.savedResource.findMany({where: {userId: user.id, resource: {status: 'PUBLISHED', publishedAt: {lte: new Date()}}}, orderBy: {createdAt: 'desc'}, take: 100, select: {resource: {select: {slug: true, title: true, summary: true, type: true, coverUrl: true}}}}),
    db.purchase.findMany({where: {userId: user.id, status: 'PAID'}, orderBy: {paidAt: 'desc'}, take: 100, select: {id: true, amountMinor: true, currency: true, paidAt: true, resource: {select: {slug: true, title: true}}, resourceMedia: {select: {id: true, title: true, resource: {select: {id: true, slug: true, title: true}}, mediaAsset: {select: {originalName: true}}}}}}),
    db.serviceRequest.findMany({where: {userId: user.id}, orderBy: {createdAt: 'desc'}, take: 30, select: {id:true,status:true,serviceType:true,description:true,budgetMinor:true,currency:true,timeline:true,quoteMinor:true,quoteNote:true,createdAt:true,updatedAt:true}}),
  ]);
  return <div className={`container ${styles.account}`}>
    <header className={styles.welcome}><div><span className="maker-kicker">YOUR LEARNWITHRICH ACCOUNT</span><h1>Welcome back,<br/><i>{user.name.split(' ')[0]}.</i></h1><p>Pick up a saved idea or open something you’ve already unlocked.</p></div><div className={styles.profile}><div className={styles.avatar}>{user.image?<img src={user.image} alt=""/>:user.name.slice(0,1).toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.email}</small></div><SignOutButton/></div></header>
    {payment === 'return' && reference && <PaymentVerification reference={reference}/>}
    <section className={styles.section}><header><div><span className="maker-kicker">PICK UP WHERE YOU LEFT OFF</span><h2><Bookmark size={22}/>Saved resources <small>{saved.length}</small></h2></div><Link className="text-link" href="/resources">Browse the library <ArrowRight size={15}/></Link></header>
      {saved.length?<div className={styles.savedGrid}>{saved.map(({resource})=><Link href={`/resources/${resource.slug}`} className={styles.savedCard} key={resource.slug}>{resource.coverUrl?<img src={resource.coverUrl} alt=""/>:<span className={styles.savedCover}><BookOpen size={26}/></span>}<span><small>{resource.type}</small><strong>{resource.title}</strong><p>{resource.summary}</p><em>Open resource <ArrowRight size={14}/></em></span></Link>)}</div>:<div className={styles.empty}><Bookmark size={23}/><p>Your saved resources will appear here.</p><Link href="/resources" className="button button-outline">Find something useful</Link></div>}
    </section>
    <section className={styles.section}><header><div><span className="maker-kicker">YOUR PURCHASES</span><h2><PackageCheck size={22}/>Purchased resources <small>{purchases.length}</small></h2></div></header>
      {purchases.length?<div className={styles.purchaseList}>{purchases.map(purchase=><article className={styles.purchase} key={purchase.id}><span className={styles.purchaseIcon}>{purchase.resource?<BookOpen size={20}/>:<Download size={20}/>}</span><div className={styles.purchaseCopy}>{purchase.resource?<><small>RESOURCE BUNDLE</small><strong>{purchase.resource.title}</strong><Link href={`/resources/${purchase.resource.slug}`}>Open bundle <ArrowRight size={13}/></Link></>:purchase.resourceMedia?<><small>INDIVIDUAL FILE · {purchase.resourceMedia.resource.title}</small><strong>{purchase.resourceMedia.title}</strong><a href={`/api/resource-files/${purchase.resourceMedia.id}?resourceId=${purchase.resourceMedia.resource.id}`}>Download {purchase.resourceMedia.mediaAsset.originalName} <Download size={13}/></a></>:<strong>Resource purchase</strong>}</div><div className={styles.purchaseMeta}><strong>{(purchase.amountMinor/100).toFixed(2)} {purchase.currency}</strong><time>{purchase.paidAt?.toISOString().slice(0,10)}</time></div></article>)}</div>:<div className={styles.empty}><PackageCheck size={24}/><p>Your completed purchases will appear here.</p></div>}
    </section>
    <section className={styles.section}><header><div><span className="maker-kicker">WORK WITH RICH</span><h2>Service requests <small>{serviceRequests.length}</small></h2></div><Link className="text-link" href="/services/request">Start a new request <ArrowRight size={15}/></Link></header>{serviceRequests.length?<div className={styles.requestList}>{serviceRequests.map(item=><article className={styles.request} key={item.id}><div className={styles.requestHeading}><div><small>{item.serviceType.replaceAll('_',' ')}</small><strong>Request {item.id.slice(0,8).toUpperCase()}</strong></div><span className={styles.requestStatus}>{item.status.replaceAll('_',' ').toLowerCase()}</span></div><p>{item.description}</p><div className={styles.requestFacts}><span>Sent {item.createdAt.toISOString().slice(0,10)}</span>{item.budgetMinor!=null&&<span>Budget { (item.budgetMinor/100).toFixed(2)} {item.currency}</span>}{item.quoteMinor!=null&&<strong>Quote { (item.quoteMinor/100).toFixed(2)} {item.currency}</strong>}</div>{item.quoteNote&&<div className={styles.quoteNote}><strong>Rich’s note</strong><p>{item.quoteNote}</p></div>}</article>)}</div>:<div className={styles.empty}><p>Your service requests and quote updates will appear here.</p><Link className="button button-outline" href="/services/request">Tell me about your project</Link></div>}</section>
  </div>;
}
