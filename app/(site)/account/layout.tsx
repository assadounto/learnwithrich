import type {ReactNode} from 'react';
import {AccountNavigation} from '@/components/account-navigation';
import styles from './account.module.css';

export default function AccountLayout({children}: {children: ReactNode}) {
  return <div className={`container ${styles.account}`}><AccountNavigation/><div className={styles.accountMain}>{children}</div></div>;
}
