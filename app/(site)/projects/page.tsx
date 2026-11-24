import type {Metadata} from 'next';
import Link from '@/components/navigation-link';
import {resources} from '@/lib/server/resources';
import {OwnedResourceGrid} from '@/components/owned-resource-card';
import {ArrowRight, CircuitBoard, Code2, FileText} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'Projects — code, circuits and useful ideas', description: 'Explore LearnWithRich projects with practical build notes, materials and source code.', alternates: {canonical: '/projects'}, openGraph: {url: '/projects'}};
export default async function ProjectsPage() {
  const {items, total} = await resources().listPublic(new URLSearchParams({type: 'PROJECT', limit: '48'}));
  const free = items.filter(item => item.access === 'PUBLIC').length;
  return <div className="owned-projects-page ref-container"><header className="owned-projects-hero"><div><span className="maker-kicker">FROM THE LEARNWITHRICH WORKBENCH</span><h1>Good ideas deserve<br/>to <i>be built.</i></h1><p>Explore the code, circuits and thinking behind useful things. Find a project. Make it your own.</p><a href="#project-collection" className="button button-dark">Explore the projects <ArrowRight size={16}/></a> <Link href="/project-ideas" className="button button-outline">Browse project ideas <ArrowRight size={16}/></Link></div><div className="owned-projects-art" aria-hidden="true"><CircuitBoard size={125} strokeWidth={.8}/><span>IDEA<br/>→<br/>BUILD</span></div></header>
    <div className="owned-project-disciplines"><span><CircuitBoard size={20}/><strong>Electronics & IoT</strong><small>Connect the physical world.</small></span><span><Code2 size={20}/><strong>Software & systems</strong><small>Give useful ideas a working form.</small></span><span><FileText size={20}/><strong>The build process</strong><small>Understand the decisions in between.</small></span></div>
    <section id="project-collection" className="owned-project-collection"><header><div><span className="maker-kicker">THE PROJECT COLLECTION</span><h2>Choose something to make.</h2></div><p>{total} {total === 1 ? 'project' : 'projects'} · {free} open to explore</p></header>{items.length ? <OwnedResourceGrid items={items}/> : <div className="owned-catalog-empty"><h2>The next project is taking shape.</h2><p>Published projects will appear here as they’re ready to build.</p><Link className="text-link" href="/resources">Browse all resources <ArrowRight size={16}/></Link></div>}</section>
  </div>;
}
