import type {ReactNode} from 'react';
import {AccountWorkspace} from '@/components/account-navigation';
import {SiteAccountProvider} from '@/components/site-account';
import '../../community.css';
import '../../community-enhancements.css';

export const metadata = {robots: {index: false, follow: false}};

export default function AccountLayout({children}: {children: ReactNode}) {
  return <SiteAccountProvider><AccountWorkspace>{children}</AccountWorkspace></SiteAccountProvider>;
}
