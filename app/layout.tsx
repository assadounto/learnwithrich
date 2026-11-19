import type { Metadata } from 'next';
import './globals.css';
import './typography.css';
import './final-polish.css';
import './interior-pages.css';
import './home-motion.css';
import './home-sections.css';
import './folio-pages.css';
import './project-guides.css';
import './skills-playground.css';
import './site-polish.css';
import './commerce.css';
import './account-dashboard.css';
import './live-projects.css';
import './catalog-card-rows.css';
import './white-theme.css';
import { NavigationFeedback } from '@/components/navigation-feedback';
export const metadata: Metadata = { title: { default: 'LearnWithRich — Learn it. Build it. Make it real.', template: '%s | LearnWithRich' }, description: 'Practical projects, useful resources, books, illustrations and courses by Richmond Adu-Kyere. A little curiosity. A lot of possibility.', icons: { icon: '/icon.svg' } };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to content</a><NavigationFeedback>{children}</NavigationFeedback></body></html>}
