import {SiteAccountProvider} from '@/components/site-account';
import {Header} from '@/components/site-header';
import {Newsletter} from '@/components/site-shell';
import {Footer} from '@/components/site-footer';
import {SiteStructuredData} from '@/components/site-structured-data';
import '../community.css';
import '../community-enhancements.css';
import '../site-footer.css';
export default function SiteLayout({children}: {children: React.ReactNode}) {
  return <SiteAccountProvider><SiteStructuredData/><Header/><main id="main-content">{children}</main><Newsletter/><Footer/></SiteAccountProvider>;
}
