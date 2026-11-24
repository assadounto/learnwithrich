'use client';

import Link from '@/components/navigation-link';
import type {ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {ArrowUpRight, Bookmark, Files, LayoutDashboard, PackageCheck, Wrench} from 'lucide-react';
import styles from '@/app/(site)/account/account.module.css';

const items = [
  {href: '/account', label: 'Overview', Icon: LayoutDashboard},
  {href: '/account/saved', label: 'Saved resources', Icon: Bookmark},
  {href: '/account/purchases', label: 'Purchases', Icon: PackageCheck},
  {href: '/account/services', label: 'Service requests', Icon: Wrench},
];

export function AccountWorkspace({children}: {children: ReactNode}) {
  const pathname = usePathname();
  const current = items.find(({href}) => href === '/account' ? pathname === href : pathname === href || pathname.startsWith(href + '/')) ?? items[0];
  return <div className={`${styles.account} ${styles.workspace}`}>
    <header className={styles.workspaceHeader}>
      <span><Files size={18}/> Learning workspace</span>
      <Link href="/resources">Browse resources <ArrowUpRight size={15}/></Link>
    </header>
    <aside className={styles.workspaceRail}>
      <span className={styles.railHeading}>Account</span>
      <nav className={styles.navigation} aria-label="Account sections">
        {items.map(({href, label, Icon}) => <Link key={href} href={href}
          aria-current={current.href === href ? (pathname === href ? 'page' : 'location') : undefined}
          className={current.href === href ? styles.navigationActive : ''}><Icon size={17}/><span>{label}</span></Link>)}
      </nav>
    </aside>
    <div className={styles.workspaceBody}>
      <div className={styles.activeStrip}><Link href={current.href}><current.Icon size={15}/>{current.label}</Link></div>
      <div className={styles.accountMain}>{children}</div>
    </div>
  </div>;
}
