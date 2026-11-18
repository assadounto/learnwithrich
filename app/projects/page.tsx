import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from '@/components/navigation-link';
import { ArrowRight, ArrowUpRight, CircuitBoard, Code2, FileText } from 'lucide-react';
import { DrawnUnderline } from '@/components/decorative-marks';
import { ProjectBrowser } from '@/components/project-browser';
import {LiveCatalogBrowser} from '@/components/live-catalog-browser';
import {listings} from '@/lib/xonbay/server';
import {isProject,productHref} from '@/lib/live-catalog';
export const dynamic='force-dynamic';
export const metadata: Metadata = { title: 'Projects — code, circuits and useful ideas', description: 'Explore published electronics and software projects with components, build steps and downloads.' };
export default async function ProjectsPage() {
 const data=await listings();const published=data.items.filter(isProject);const featured=published[0];
 return <div className="folio-page"><div className="ref-container">
  <section className="projects-hero" aria-labelledby="projects-title"><div><span className="maker-kicker">THE PROJECT WORKBENCH</span><h1 id="projects-title">Less “one day”.<br/><i>More “let’s build”.</i><DrawnUnderline className="orange-scribble"/></h1><p>Code, circuits and useful ideas. Explore how a project comes together, then find a starting point for your own.</p><a href="#project-collection" className="button button-orange">Find a project<ArrowRight size={17}/></a><div className="projects-hero-topics"><span><CircuitBoard size={16}/>Electronics & IoT</span><span><Code2 size={16}/>Software</span><span><FileText size={16}/>Project notes</span></div></div><Link className="project-hero-feature" href={featured?productHref(featured):"/resources/solar-hybrid-power-system"}><div className={featured?"folio-project-image live-project-cover":"folio-project-image studio-photo-solar"} role="img" aria-label={featured?featured.title:"Illustrative solar controller prototype and solar panel"}>{featured&&(featured.cover_url?<img className="live-feature-image" src={featured.cover_url} alt=""/>:<><CircuitBoard size={65}/><span>Made to be useful.</span></>)}</div><span className="feature-paper-tag">ON THE WORKBENCH</span><div><span className="maker-kicker">{featured?'FEATURED PROJECT':'FEATURED PROJECT OUTLINE'}</span><h2>{featured?featured.title:<>A smarter way<br/>to think about power.</>}</h2><span>{featured?'Explore this project':'Explore the solar hybrid project'}<ArrowUpRight size={21}/></span></div></Link></section>
  {data.error?<p role="status" className="account-notice">Projects could not load. Please refresh and try again.</p>:<LiveCatalogBrowser items={published} projectsOnly/>}
  <details className="project-planning-samples"><summary>Explore planning samples & concepts</summary><p>These sample outlines are separate from published projects above.</p><Suspense fallback={<p>Loading the workbench…</p>}><ProjectBrowser/></Suspense></details>
  <section className="folio-bottom-callout"><div><span className="maker-kicker">THE PROCESS MATTERS, TOO</span><h2>Every build has a story.</h2><p>Meet the maker behind the code, circuits and notes.</p></div><Link href="/about" className="button button-outline">Meet Richmond<ArrowUpRight size={17}/></Link></section>
 </div></div>;
}
