import type { Metadata } from 'next';
import { Header, Footer } from '@/components/site-shell';
import './globals.css';
import './typography.css';
import './final-polish.css';
import './interior-pages.css';
import './home-motion.css';
import './home-sections.css';
import './folio-pages.css';
import './project-guides.css';
export const metadata: Metadata = { title: { default: 'LearnWithRich — Learn it. Build it. Make it real.', template: '%s | LearnWithRich' }, description: 'Practical projects, useful resources, books, illustrations and courses by Richmond Adu-Kyere. A little curiosity. A lot of possibility.', icons: { icon: '/icon.svg' } };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to content</a><Header/><main id="main-content">{children}</main><Footer/></body></html>}
