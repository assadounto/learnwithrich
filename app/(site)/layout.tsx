import {Header} from '@/components/site-header';
import {Footer} from '@/components/site-footer';
import '../community.css';
export default function SiteLayout({children}: {children: React.ReactNode}) {
  return <><Header/><main id="main-content">{children}</main><Footer/></>;
}
