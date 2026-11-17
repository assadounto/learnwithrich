import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from '@/components/navigation-link';
import { ArrowRight, ArrowUpRight, CircuitBoard, Code2, FileText } from 'lucide-react';
import { DrawnUnderline } from '@/components/decorative-marks';
import { ProjectBrowser } from '@/components/project-browser';
export const metadata: Metadata = { title: 'Projects — code, circuits and useful ideas', description: 'Explore Richmond Adu-Kyere’s electronics and software project outlines, with tools, suggested levels and free planning samples.' };
export default function ProjectsPage() {
 return <div className="folio-page"><div className="ref-container">
  <section className="projects-hero" aria-labelledby="projects-title"><div><span className="maker-kicker">THE PROJECT WORKBENCH</span><h1 id="projects-title">Less “one day”.<br/><i>More “let’s build”.</i><DrawnUnderline className="orange-scribble"/></h1><p>Code, circuits and useful ideas. Explore how a project comes together, then find a starting point for your own.</p><a href="#project-collection" className="button button-orange">Find a project<ArrowRight size={17}/></a><div className="projects-hero-topics"><span><CircuitBoard size={16}/>Electronics & IoT</span><span><Code2 size={16}/>Software</span><span><FileText size={16}/>Project notes</span></div></div><Link className="project-hero-feature" href="/resources/solar-hybrid-power-system"><div className="folio-project-image studio-photo-solar" role="img" aria-label="Illustrative solar controller prototype and solar panel"/><span className="feature-paper-tag">ON THE WORKBENCH</span><div><span className="maker-kicker">FEATURED PROJECT OUTLINE</span><h2>A smarter way<br/>to think about power.</h2><span>Explore the solar hybrid project<ArrowUpRight size={21}/></span></div></Link></section>
  <Suspense fallback={<p>Loading the workbench…</p>}><ProjectBrowser/></Suspense>
  <section className="folio-bottom-callout"><div><span className="maker-kicker">THE PROCESS MATTERS, TOO</span><h2>Every build has a story.</h2><p>Meet the maker behind the code, circuits and notes.</p></div><Link href="/about" className="button button-outline">Meet Richmond<ArrowUpRight size={17}/></Link></section>
 </div></div>;
}
