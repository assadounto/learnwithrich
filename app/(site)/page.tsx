import type {Metadata} from 'next';
import { Suspense } from 'react';
import { HomeLoading } from '@/components/page-loaders';
export const metadata: Metadata = {
  alternates: {canonical: '/'},
  openGraph: {
    url: 'https://learnwithrich.com',
    images: [{url: '/images/hero-collage.webp', alt: 'LearnWithRich maker collage featuring projects, a maker book and illustrations'}],
  },
  twitter: {images: ['/images/hero-collage.webp']},
};
export const dynamic='force-dynamic';
import { resources } from '@/lib/server/resources';
import { HomeResourceSections } from '@/components/home-resource-sections';
import Link from '@/components/navigation-link';
import { SkillsPlayground } from '@/components/skills-playground';
import { MakerPaths } from '@/components/home-sections';
import { HomeMotion } from '@/components/home-motion';
import { ArrowRight, ArrowUpRight, Cpu, Code2, Layers, Pencil } from 'lucide-react';
import {CreatorPortrait} from '@/components/creator-portrait';
import { DrawnUnderline, AccentRays } from '@/components/decorative-marks';
import { SearchForm, Newsletter } from '@/components/site-shell';
import {CommunityHome} from '@/components/community-home';
import {database} from '@/lib/server/database';
export default function Home(){return <Suspense fallback={<HomeLoading/>}><HomeContent/></Suspense>}
async function HomeContent(){const [sections,entries,reviews]=await Promise.all([resources().homepage(),database().guestbookEntry.findMany({where:{status:'APPROVED'},orderBy:{createdAt:'desc'},take:4,select:{id:true,name:true,message:true,createdAt:true}}),database().review.findMany({where:{status:'APPROVED'},orderBy:{createdAt:'desc'},take:3,select:{id:true,displayName:true,message:true,rating:true,createdAt:true}})]);return <HomeMotion>
<section className="reference-hero"><div className="ref-container ref-hero-inner"><div className="ref-hero-copy"><div className="ref-eyebrow">THE INTERNET IS FULL OF IDEAS. LET’S BUILD SOME.<DrawnUnderline className="orange-scribble"/></div><h1><span className="hero-title-line">A little <i>curiosity.</i> </span><span className="hero-title-line">A lot of possibility.</span><AccentRays className="hero-rays"/></h1><p>Projects, books, illustrations and practical<br className="ref-desktop-break"/> courses by Richmond Adu-Kyere.</p><div className="ref-hero-actions"><Link className="button button-orange" href="/projects">Find your next project</Link><Link className="text-link" href="/services/request">Request a service <ArrowUpRight size={18}/></Link></div></div><div className="ref-hero-art" role="img" aria-label="Maker collage with an ESP32 board, Practical Maker book, African portrait illustrations and a project notebook"/></div></section>
<div className="ref-manifesto">LOOK FOR A NEW ANGLE. KEEP MOVING FORWARD.</div>
<section className="ref-discovery ref-container"><h2>What are you curious about?<DrawnUnderline className="olive-scribble"/></h2><div className="ref-search-wrap"><SearchForm/><AccentRays className="search-rays"/></div><div className="ref-topic-links">{[[Cpu,'Electronics'],[Code2,'Software'],[Layers,'Guides'],[Pencil,'Documentation']].map(([Icon,label])=>{const I=Icon as typeof Cpu;return <Link key={String(label)} href={String(label)==='Guides'?'/resources?category=guide':`/resources?q=${encodeURIComponent(String(label))}`} ><I size={25}/>{String(label)}</Link>})}</div></section>
<HomeResourceSections sections={sections}/>
<MakerPaths/>
<SkillsPlayground/>
<CommunityHome entries={entries.map(item=>({...item,createdAt:item.createdAt.toISOString()}))} reviews={reviews.map(item=>({...item,createdAt:item.createdAt.toISOString()}))}/>

<section className="ref-about"><div className="ref-container ref-about-inner"><div className="ref-stamp"><CreatorPortrait variant="intro"/></div><div className="ref-about-copy"><h2>Hi, I’m Richmond.<br/><span>I build things—and share the process.</span></h2><p>Software, electronics and the lessons in between.</p><Link href="/about" className="text-link">Meet the maker <ArrowRight size={15}/></Link></div><span className="about-ticks" aria-hidden="true"><svg viewBox="0 0 50 40" fill="none"><path d="M5 27 23 5M24 31 40 13" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></span><div className="ref-grid-paper" aria-hidden="true"/></div></section><Newsletter/></HomeMotion>}
