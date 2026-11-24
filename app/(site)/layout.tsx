import {PageAnalytics} from '@/components/page-analytics';
import {SiteAccountProvider} from '@/components/site-account';
import {Header} from '@/components/site-header';
import {Newsletter} from '@/components/site-shell';
import {Footer} from '@/components/site-footer';
import {SiteStructuredData} from '@/components/site-structured-data';
import '../community.css';
import '../community-enhancements.css';
import '../site-footer.css';
export const revalidate = 300;

export default function SiteLayout({children}: {children: React.ReactNode}) {
  return <SiteAccountProvider><SiteStructuredData/><PageAnalytics/><Header/><main id="main-content">{children}</main><Newsletter/><Footer/></SiteAccountProvider>;
}
