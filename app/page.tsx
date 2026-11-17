import Link from '@/components/navigation-link';
import { PaperEdges } from '@/components/paper-edges';
import { SkillsPlayground } from '@/components/skills-playground';
import { HomeTestimonials } from '@/components/home-testimonials';
import { MakerPaths, ProjectSpotlight, WorkbenchNotes } from '@/components/home-sections';
import { HomeMotion } from '@/components/home-motion';
import { ArrowRight, ArrowUpRight, Cpu, Code2, Layers, Pencil, Clock3, BookOpen, FileText, Image as ImageIcon } from 'lucide-react';
import { ReferenceArt } from '@/components/reference-art';
import { DrawnUnderline, AccentRays } from '@/components/decorative-marks';
import { SearchForm, Newsletter } from '@/components/site-shell';
const projects = [
 {slug:'solar-hybrid-power-system',art:'solar' as const,title:'Build a Solar Hybrid Power System',description:'A practical, low-cost setup that combines solar, battery and mains power.'},
 {slug:'smart-energy-monitor',art:'energy' as const,title:'Smart Energy Monitor with ESP32',description:'Track your power usage in real time and make smarter energy decisions.'},
 {slug:'maker-marketplace',art:'web' as const,title:'Build a Web Marketplace for Makers',description:'A full-stack project to create, list and manage maker products online.'},
];
const books = [
 {slug:'practical-maker',art:'book' as const,label:'Ebook · Preview', icon:BookOpen},
 {slug:'smart-energy-project-guide',art:'guide' as const,label:'PDF Guide · Sample', icon:FileText},
 {slug:'creative-circuit-illustrations',art:'illustration' as const,label:'Asset Pack · Preview', icon:ImageIcon},
];
const courses = [
 {slug:'esp32-first-connected-device',art:'esp' as const,title:'ESP32: Your first connected device',description:'Get up and running with the ESP32, connect it to Wi-Fi and build a simple, useful project.'},
 {slug:'build-a-web-app',art:'code' as const,title:'Build a web app from scratch',description:'Learn the fundamentals and build a real web app you can customise and extend.'},
];
export default function Home(){return <HomeMotion>
<section className="reference-hero"><div className="ref-container ref-hero-inner"><div className="ref-hero-copy"><div className="ref-eyebrow">THE INTERNET IS FULL OF IDEAS. LET’S BUILD SOME.<DrawnUnderline className="orange-scribble"/></div><h1><span className="hero-title-line">A little <i>curiosity.</i> </span><span className="hero-title-line">A lot of possibility.</span><AccentRays className="hero-rays"/></h1><p>Projects, books, illustrations and practical<br className="ref-desktop-break"/> courses by Richmond Adu-Kyere.</p><div className="ref-hero-actions"><Link className="button button-orange" href="/projects">Find your next project</Link><Link className="text-link" href="/resources">Explore the library <ArrowUpRight size={18}/></Link></div></div><div className="ref-hero-art" role="img" aria-label="Maker collage with an ESP32 board, Practical Maker book, African portrait illustrations and a project notebook"/></div></section>
<div className="ref-manifesto">LEARN SOMETHING. BUILD SOMETHING. SHARE SOMETHING.</div>
<section className="ref-discovery ref-container"><h2>What are you curious about?<DrawnUnderline className="olive-scribble"/></h2><div className="ref-search-wrap"><SearchForm/><AccentRays className="search-rays"/></div><div className="ref-topic-links">{[[Cpu,'Electronics & IoT'],[Code2,'Software'],[Layers,'Books & guides'],[Pencil,'Illustration']].map(([Icon,label])=>{const I=Icon as typeof Cpu;return <Link key={String(label)} href={`/resources?topic=${encodeURIComponent(String(label))}`}><I size={25}/>{String(label)}</Link>})}</div></section>
<MakerPaths/>
<section className="ref-projects ref-container"><div className="ref-section-heading"><h2>Fresh from the workbench</h2><Link href="/projects" className="text-link">View all projects <ArrowUpRight size={15}/></Link></div><div className="ref-project-grid">{projects.map(p=><article className="ref-project-card" key={p.slug}><Link href={`/resources/${p.slug}`} aria-label={p.title}><ReferenceArt kind={p.art}/></Link><div className="ref-project-info"><div className="ref-project-tags"><span>Project</span><span>Free</span></div><h3><Link href={`/resources/${p.slug}`}>{p.title}</Link></h3><p>{p.description}</p><Link className="ref-card-arrow" href={`/resources/${p.slug}`} aria-label={`Explore ${p.title}`}><ArrowRight size={25}/></Link></div></article>)}</div></section>
<ProjectSpotlight/>
<section className="ref-library"><PaperEdges/><div className="ref-container ref-library-inner"><div className="ref-library-copy"><h2>Good ideas deserve <br/>good resources.<DrawnUnderline className="olive-scribble"/></h2><p>Books, project guides, illustration assets<br className="ref-desktop-break"/> and more — practical resources to help<br className="ref-desktop-break"/> you learn, build and create.</p><Link href="/resources?view=library" className="button button-cream">Browse library <ArrowRight size={18}/></Link></div><div className="ref-book-shelf">{books.map(b=><Link key={b.slug} href={`/resources/${b.slug}`} className="ref-shelf-book"><ReferenceArt kind={b.art}/><span><b.icon size={16} strokeWidth={1.7}/>{b.label}</span></Link>)}<span className="ref-wood-shelf" aria-hidden="true"/><AccentRays className="library-rays"/></div></div></section>
<section className="ref-courses ref-container"><h2>Less watching. More making.<DrawnUnderline className="orange-scribble"/></h2><div className="ref-course-grid">{courses.map(c=><article className="ref-course-card" key={c.slug}><Link className="ref-course-image" href={`/resources/${c.slug}`} aria-label={c.title}><ReferenceArt kind={c.art}/></Link><div className="ref-course-info"><span className="ref-course-time"><Clock3 size={12}/> In preparation</span><h3><Link href={`/resources/${c.slug}`}>{c.title}</Link></h3><p>{c.description}</p><Link className="text-link" href={`/resources/${c.slug}`}>View course <ArrowRight size={15}/></Link></div></article>)}</div></section>
<SkillsPlayground/>
<WorkbenchNotes/>
<section className="ref-about"><div className="ref-container ref-about-inner"><div className="ref-stamp"><ReferenceArt kind="stamp"/></div><div className="ref-about-copy"><h2>Hi, I’m Richmond.<br/><span>I build things—and share the process.</span></h2><p>Software, electronics and the lessons in between.</p><Link href="/about" className="text-link">Meet the maker <ArrowRight size={15}/></Link></div><span className="about-ticks" aria-hidden="true"><svg viewBox="0 0 50 40" fill="none"><path d="M5 27 23 5M24 31 40 13" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></span><div className="ref-grid-paper" aria-hidden="true"/></div></section><HomeTestimonials/><Newsletter/></HomeMotion>}
