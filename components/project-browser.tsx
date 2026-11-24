'use client';
import {SelectMenu} from '@/components/selection-dialog';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from '@/components/navigation-link';
import { ArrowUpRight, Search, SlidersHorizontal, FileText } from 'lucide-react';
import { projects } from '@/lib/projects';
export function ProjectBrowser() {
 const params = useSearchParams();
 const [query, setQuery] = useState('');
 const [topic, setTopic] = useState(['Software', 'Electronics & IoT'].includes(params.get('topic') || '') ? params.get('topic')! : 'All');
 const [level, setLevel] = useState('All');
 const filtered = projects.filter(project => (topic === 'All' || project.topic === topic) && (level === 'All' || project.level === level) && `${project.title} ${project.description} ${project.tools.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
 const clear = () => { setQuery(''); setTopic('All'); setLevel('All'); };
 return <section id="planning-project-collection" className="project-collection" aria-labelledby="project-collection-title">
  <div className="folio-section-heading"><div><span className="maker-kicker">EXPLORE THE WORKBENCH</span><h2 id="project-collection-title">Find your next <i>“what if”.</i></h2></div><span className="folio-small-note">Suggested levels · project outlines</span></div>
  <div className="project-filter-controls"><div className="project-search"><Search size={19} aria-hidden="true"/><label htmlFor="project-search" className="sr-only">Search projects</label><input id="project-search" type="search" placeholder="Try ESP32, solar, Rails…" value={query} onChange={event => setQuery(event.target.value)}/></div><label className="project-level"><SlidersHorizontal size={16} aria-hidden="true"/><span className="sr-only">Suggested level</span><SelectMenu value={level} onChange={event => setLevel(event.target.value)}><option value="All">All levels</option><option>Intermediate</option><option>Advanced</option></SelectMenu></label></div>
  <div className="project-filter-bottom"><div className="project-topic-tabs" role="group" aria-label="Project topic">{['All', 'Electronics & IoT', 'Software'].map(value => <button type="button" aria-pressed={topic === value} onClick={() => setTopic(value)} key={value}>{value === 'All' ? 'All projects' : value}</button>)}</div><span role="status">{filtered.length} {filtered.length === 1 ? 'project' : 'projects'}</span></div>
  {filtered.length ? <div className="folio-project-grid">{filtered.map(project => <article className="folio-project-card" key={project.slug}><Link href={`/resources/${project.slug}`} className="folio-project-image-link" aria-label={`Explore ${project.title}`}><div className={`folio-project-image studio-photo-${project.image}`} role="img" aria-label={`Illustrative ${project.title} concept`}/><span className="folio-image-label">{project.topic}</span><span className="folio-image-arrow"><ArrowUpRight size={22}/></span></Link><div className="folio-project-copy"><div className="folio-project-intro"><div className="folio-project-meta"><span>{project.level}</span><span>Project outline</span></div><h3><Link href={`/resources/${project.slug}`}>{project.title}</Link></h3></div><p>{project.description}</p><div className="folio-tool-list">{project.tools.map(tool => <span key={tool}>{tool}</span>)}</div><div className="folio-project-card-foot"><span>{project.focus}</span>{project.download && <a href={project.download} download aria-label={`Download ${project.title} planning outline`}><FileText size={17}/><span>Free outline</span></a>}</div></div></article>)}</div> : <div className="project-empty"><Search size={30}/><h3>No projects match just yet.</h3><p>Try a different word, topic or level to explore the collection.</p><button type="button" className="button button-outline" onClick={clear}>Clear filters</button></div>}
  <p className="folio-project-note">A growing collection of project plans and illustrative concepts. Available downloads are planning samples; full builds and files will be added as they are ready.</p>
 </section>;
}
