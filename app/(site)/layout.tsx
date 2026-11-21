import {Header} from '@/components/site-header';
import {Footer} from '@/components/site-footer';
import {SiteStructuredData} from '@/components/site-structured-data';
import '../community.css';
export default function SiteLayout({children}: {children: React.ReactNode}) {
  return <><SiteStructuredData/><Header/><main id="main-content">{children}</main><Footer/></>;
}
