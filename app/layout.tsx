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
import './live-projects.css';
import './owned-resources.css';
import './catalog-card-rows.css';
import './white-theme.css';
import './page-loaders.css';
import './readability.css';
import './home-hero.css';
import { NavigationFeedback } from '@/components/navigation-feedback';
const siteUrl = 'https://learnwithrich.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'LearnWithRich — Learn it. Build it. Make it real.', template: '%s | LearnWithRich' },
  description: 'Practical projects, useful resources, books, illustrations and courses by Richmond Adu-Kyere. A little curiosity. A lot of possibility.',
  applicationName: 'LearnWithRich',
  authors: [{ name: 'Richmond Adu-Kyere', url: siteUrl }],
  creator: 'Richmond Adu-Kyere',
  publisher: 'LearnWithRich',
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    siteName: 'LearnWithRich',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to content</a><NavigationFeedback>{children}</NavigationFeedback></body></html>}
