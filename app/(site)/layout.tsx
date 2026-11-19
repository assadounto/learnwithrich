import {Header, Footer} from '@/components/site-shell';
export default function SiteLayout({children}: {children: React.ReactNode}) {
  return <><Header/><main id="main-content">{children}</main><Footer/></>;
}
