'use client';

import Link from '@/components/navigation-link';
import {usePathname} from 'next/navigation';
import {ArrowRight, Bookmark, LayoutDashboard, PackageCheck, Wrench} from 'lucide-react';
import styles from '@/app/(site)/account/account.module.css';

const items = [
  {href: '/account', label: 'Overview', Icon: LayoutDashboard},
  {href: '/account/saved', label: 'Saved resources', Icon: Bookmark},
  {href: '/account/purchases', label: 'Purchases', Icon: PackageCheck},
  {href: '/account/services', label: 'Service requests', Icon: Wrench},
];

export function AccountNavigation() {
  const pathname = usePathname();
  return <nav className={styles.navigation} aria-label="Account sections">
    {items.map(({href, label, Icon}) => {
      const active = href === '/account' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? styles.navigationActive : ''}><Icon size={17}/><span>{label}</span>{active && <ArrowRight size={14}/>}</Link>;
    })}
  </nav>;
}
