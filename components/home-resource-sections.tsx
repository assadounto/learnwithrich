import Link from '@/components/navigation-link';
import {ArrowRight, ArrowUpRight, Sparkles} from 'lucide-react';
import {OwnedResourceGrid, type ResourceCardData} from './owned-resource-card';
import type {HomepageSection} from '@/lib/server/admin/homepage';

type PopulatedSection = HomepageSection & {items: ResourceCardData[]};
export function HomeResourceSections({sections}: {sections: PopulatedSection[]}) {
  if (!sections.length) return <section className="owned-home-empty ref-container"><Sparkles size={21}/><span className="maker-kicker">THE LEARNWITHRICH COLLECTION</span><h2>New ideas are taking shape.</h2><p>Projects, courses, guides and useful resources will appear here as they’re published.</p><Link href="/resources" className="text-link">Explore the resource library <ArrowRight size={16}/></Link></section>;
  return <div className="owned-home-sections">{sections.map((section, index) => <section key={section.id} className={`owned-home-section ${index % 2 ? 'is-soft' : ''}`}>
    <div className="ref-container"><header className="owned-home-section-heading"><div><span className="maker-kicker">{section.eyebrow || 'LEARNWITHRICH / THE LIBRARY'}</span><h2>{section.title}</h2>{section.description && <p>{section.description}</p>}</div><Link href={section.type === 'ALL' ? '/resources' : `/resources?type=${section.type.toLowerCase()}`} className="text-link">Explore all <ArrowUpRight size={16}/></Link></header>
    {section.items.length ? <OwnedResourceGrid items={section.items}/> : <p className="owned-home-section-empty">New {section.type === 'ALL' ? 'resources' : section.type.toLowerCase().replace('_', ' ')} are on the way.</p>}
    </div>
  </section>)}</div>;
}
