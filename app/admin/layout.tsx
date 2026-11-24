import type {Metadata} from 'next';
import './admin.css';
import './studio.css';
import './surface.css';
export const metadata: Metadata = {title: 'Resource studio', robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';
export default function AdminLayout({children}: {children: React.ReactNode}) { return <main id="main-content" className="admin-experience">{children}</main>; }
