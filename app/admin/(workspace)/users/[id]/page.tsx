import {ArrowLeft, ArrowUpRight} from 'lucide-react';
import {notFound} from 'next/navigation';
import Link from '@/components/navigation-link';
import {LearnerActions} from '@/components/admin/learner-actions';
import {WorkspacePageTitle} from '@/components/admin/workspace-shell';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {serviceLabel} from '@/lib/service-offerings';
import styles from './user.module.css';

const date = new Intl.DateTimeFormat('en-GH', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Accra'});
const readStatus = (status: string) => status.toLowerCase().replaceAll('_', ' ');

function Activity({title, count, rows}: {title: string; count: number; rows: {id: string; label: string; at: Date; status?: string; href?: string}[]}) {
  return <section className={styles.panel}><h2>{title} <small>{count}</small></h2>
    {rows.length ? <ul className={styles.activity}>{rows.map(row => <li key={row.id}>
      {row.href ? <Link href={row.href}>{row.label} <ArrowUpRight size={14}/></Link> : <strong>{row.label}</strong>}
      <span>{row.status && `${readStatus(row.status)} · `}<time dateTime={row.at.toISOString()}>{date.format(row.at)}</time></span>
    </li>)}</ul> : <p>No activity recorded.</p>}
  </section>;
}

export default async function UserDetail({params}: {params: Promise<{id: string}>}) {
  const owner = await requireOwner();
  const {id} = await params;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) notFound();
  const user = await database().user.findUnique({where: {id}, select: {
    id: true, name: true, email: true, emailVerified: true, role: true, createdAt: true,
    _count: {select: {purchases: true, servicePayments: true, savedResources: true, serviceRequests: true, reviews: true, audits: true,
      sessions: {where: {expiresAt: {gt: new Date()}}}}},
    sessions: {orderBy: {createdAt: 'desc'}, take: 1, select: {createdAt: true}},
    savedResources: {orderBy: {createdAt: 'desc'}, take: 5, select: {createdAt: true, resource: {select: {id: true, title: true}}}},
    purchases: {orderBy: {createdAt: 'desc'}, take: 5, select: {id: true, createdAt: true, status: true, resource: {select: {title: true}}, resourceMedia: {select: {title: true}}}},
    serviceRequests: {orderBy: {updatedAt: 'desc'}, take: 5, select: {id: true, updatedAt: true, status: true, serviceType: true}},
    servicePayments: {orderBy: {createdAt: 'desc'}, take: 5, select: {id: true, createdAt: true, status: true, serviceRequest: {select: {serviceType: true}}}},
    reviews: {orderBy: {createdAt: 'desc'}, take: 5, select: {id: true, createdAt: true, title: true, rating: true, status: true}},
  }});
  if (!user) notFound();
  const name = user.name || user.email;
  const manageable = user.role === 'LEARNER' && user.id !== owner.id;
  const canDelete = !user._count.purchases && !user._count.servicePayments && !user._count.audits;
  return <div className={styles.page}>
    <WorkspacePageTitle title={name}/>
    <Link href="/admin/users" className={styles.back}><ArrowLeft size={16}/>Users</Link>
    <header className={styles.heading}><div><h1>{name}</h1><p>{user.email}</p></div><span className="admin-status">{user.role === 'OWNER' ? 'Owner' : 'Learner'}</span></header>
    <section className={styles.panel}><h2>Account details</h2>
      <dl className={styles.facts}>
        <div><dt>Joined</dt><dd>{date.format(user.createdAt)}</dd></div>
        <div><dt>Email</dt><dd>{user.emailVerified ? 'Verified' : 'Unverified'}</dd></div>
        <div><dt>Latest recorded sign-in</dt><dd>{user.sessions[0] ? date.format(user.sessions[0].createdAt) : 'No session recorded'}</dd></div>
        <div><dt>Active sessions</dt><dd>{user._count.sessions}</dd></div>
      </dl>
      {manageable ? <LearnerActions id={user.id} name={name} canDelete={canDelete}/> : <p>Studio owner account.</p>}
    </section>
    <div className={styles.grid}>
      <Activity title="Saved resources" count={user._count.savedResources} rows={user.savedResources.map(({resource, createdAt}) => ({id: resource.id, label: resource.title, at: createdAt, href: `/admin/resources/${resource.id}`}))}/>
      <Activity title="Resource purchases" count={user._count.purchases} rows={user.purchases.map(row => ({id: row.id, label: row.resource?.title ?? row.resourceMedia?.title ?? 'Resource purchase', at: row.createdAt, status: row.status}))}/>
      <Activity title="Service requests" count={user._count.serviceRequests} rows={user.serviceRequests.map(row => ({id: row.id, label: serviceLabel(row.serviceType), at: row.updatedAt, status: row.status, href: `/admin/community/service-requests?request=${row.id}`}))}/>
      <Activity title="Service payments" count={user._count.servicePayments} rows={user.servicePayments.map(row => ({id: row.id, label: serviceLabel(row.serviceRequest.serviceType), at: row.createdAt, status: row.status}))}/>
      <Activity title="Reviews" count={user._count.reviews} rows={user.reviews.map(row => ({id: row.id, label: row.title || `Rated ${row.rating}/5`, at: row.createdAt, status: row.status}))}/>
    </div>
  </div>;
}
