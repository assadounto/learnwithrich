'use client';

import {useState, type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {ArrowUpRight, Bookmark, Files, Globe2, LayoutDashboard, Menu, PackageCheck, Wrench} from 'lucide-react';
import Link from '@/components/navigation-link';
import {Brand} from '@/components/brand';
import {SignOutButton} from '@/components/account-actions';
import {ThemeSwitcher} from '@/components/theme-switcher';
import styles from '@/app/(learner)/account/account.module.css';

const items = [
  {href: '/account', label: 'Overview', Icon: LayoutDashboard},
  {href: '/account/saved', label: 'Saved resources', Icon: Bookmark},
  {href: '/account/purchases', label: 'Purchases', Icon: PackageCheck},
  {href: '/account/services', label: 'Service requests', Icon: Wrench},
];

export function AccountWorkspace({children}: {children: ReactNode}) {
  const [explorerOpen, setExplorerOpen] = useState(true);
  const pathname = usePathname();
  const current = items.find(({href}) => href === '/account' ? pathname === href : pathname === href || pathname.startsWith(href + '/')) ?? items[0];
  return <div className={`${styles.account} ${styles.workspace}`} data-account-workspace="" data-explorer-open={explorerOpen}>
    <header className={styles.workspaceHeader}>
      <div className={styles.workspaceBrand}>
        <button className={styles.explorerToggle} type="button" aria-label="Toggle account explorer" aria-controls="account-explorer"
          aria-expanded={explorerOpen} onClick={() => setExplorerOpen(value => !value)}><Menu size={21}/></button>
        <Brand emblem/><span className={styles.workspaceLabel}>Learning workspace</span>
      </div>
      <div className={styles.workspaceLinks}>
        <ThemeSwitcher className="studio-theme-switch"/>
        <Link href="/" className={styles.mainSiteLink}><Globe2 size={17}/>Main site<ArrowUpRight size={13}/></Link>
      </div>
    </header>
    <aside id="account-explorer" className={styles.workspaceRail} hidden={!explorerOpen}>
      <span className={styles.railHeading}><Files size={15}/> Account explorer</span>
      <nav className={styles.navigation} aria-label="Account sections">
        {items.map(({href, label, Icon}) => <Link key={href} href={href}
          aria-current={current.href === href ? (pathname === href ? 'page' : 'location') : undefined}
          className={current.href === href ? styles.navigationActive : ''}><Icon size={17}/><span>{label}</span></Link>)}
      </nav>
      <div className={styles.workspaceShortcuts}><Link href="/resources">Browse resources <ArrowUpRight size={15}/></Link></div>
    </aside>
    <div className={styles.workspaceBody}>
      <div className={styles.activeStrip}><Link href={current.href}><current.Icon size={15}/>{current.label}</Link></div>
      <main id="main-content" className={styles.accountMain}>{children}</main>
      <footer className={styles.workspaceFooter}><Link href="/">Back to LearnWithRich</Link><SignOutButton/></footer>
    </div>
  </div>;
}
