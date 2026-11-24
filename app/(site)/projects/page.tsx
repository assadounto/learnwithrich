import type {Metadata} from 'next';
import Link from '@/components/navigation-link';
import {browseCatalog, type BrowseParams} from '@/lib/server/resources/browse';
import {ResourceCatalog} from '@/components/resource-catalog';
import {ArrowRight, CircuitBoard, Code2, FileText} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'Projects — code, circuits and useful ideas', description: 'Explore LearnWithRich projects with practical build notes, materials and source code.', alternates: {canonical: '/projects'}, openGraph: {url: '/projects'}};
export default async function ProjectsPage({searchParams}: {searchParams: Promise<BrowseParams>}) {
  const data = await browseCatalog(await searchParams, 'PROJECT');
  return <div className="owned-projects-page ref-container"><header className="owned-projects-hero"><div><span className="maker-kicker">FROM THE LEARNWITHRICH WORKBENCH</span><h1>Good ideas deserve<br/>to <i>be built.</i></h1><p>Explore the code, circuits and thinking behind useful things. Find a project. Make it your own.</p><div className="project-hero-actions"><a href="#project-collection" className="button button-dark">Explore the projects <ArrowRight size={16}/></a> <Link href="/project-ideas" className="button button-outline">Browse project ideas <ArrowRight size={16}/></Link></div></div><div className="owned-projects-art" aria-hidden="true"><CircuitBoard size={125} strokeWidth={.8}/><span>IDEA<br/>→<br/>BUILD</span></div></header>
    <div className="owned-project-disciplines"><span><CircuitBoard size={20}/><strong>Electronics & IoT</strong><small>Connect the physical world.</small></span><span><Code2 size={20}/><strong>Software & systems</strong><small>Give useful ideas a working form.</small></span><span><FileText size={20}/><strong>The build process</strong><small>Understand the decisions in between.</small></span></div>
    <section id="project-collection" className="owned-project-collection"><header><div><span className="maker-kicker">THE PROJECT COLLECTION</span><h2>Choose something to make.</h2></div></header><ResourceCatalog data={data} path="/projects"/></section>
  </div>;
}
