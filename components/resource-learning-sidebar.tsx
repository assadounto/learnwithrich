import {publicImageAttributes} from '@/lib/image-sizes';
import Link from '@/components/navigation-link';
import {ArrowUpRight, FileText, Play, Route} from 'lucide-react';
import type {ResourceKind} from '@/lib/server/resources/validation';

type SidebarResource = {slug: string; title: string; summary: string; type: ResourceKind; coverUrl: string | null; tags: string[]};
type Playlist = {slug: string; title: string; type: 'COURSE' | 'PATH'; sections: {id: string; title: string; position: number}[]; items: {position: number; sectionId: string | null; resource: SidebarResource}[]};

const kindLabel: Record<ResourceKind, string> = {PROJECT: 'Project', ARTICLE: 'Article', COURSE: 'Course', PATH: 'Learning path', LESSON: 'Lesson', DOWNLOAD: 'Download', BOOK: 'Book', GUIDE: 'Guide', ILLUSTRATION: 'Illustration'};

export function ResourceLearningSidebar({currentSlug, playlist, related}: {currentSlug: string; playlist: Playlist | null; related: SidebarResource[]}) {
  if (playlist) {
    const currentIndex = playlist.items.findIndex(item => item.resource.slug === currentSlug);
    const isViewingPlaylist = playlist.slug === currentSlug;
    const sections = playlist.sections.length
      ? [...playlist.sections, ...(playlist.items.some(item => !item.sectionId) ? [{id: 'ungrouped', title: 'More in this collection', position: playlist.sections.length}] : [])]
      : [{id: 'all', title: playlist.type === 'PATH' ? 'Learning path' : 'Course lessons', position: 0}];
    return <aside className="resource-learning-sidebar" aria-label={playlist.type === 'PATH' ? 'Learning path contents' : 'Course contents'}>
      <header className="resource-learning-sidebar-heading"><span className="maker-kicker"><Route size={13}/>{playlist.type === 'PATH' ? 'YOUR LEARNING PATH' : 'COURSE CURRICULUM'}</span><h2>{playlist.title}</h2><p>{playlist.items.length} {playlist.type === 'PATH' ? 'steps' : 'lessons'}{currentIndex >= 0 ? ` · ${currentIndex + 1} of ${playlist.items.length}` : ''}</p>{currentIndex >= 0 && <span className="resource-playlist-progress" role="progressbar" aria-label="Progress through this course" aria-valuemin={0} aria-valuemax={playlist.items.length} aria-valuenow={currentIndex + 1}><span style={{width: `${Math.max(8, (currentIndex + 1) / Math.max(playlist.items.length, 1) * 100)}%`}}/></span>}</header>
      {isViewingPlaylist && <div className="resource-playlist-overview" aria-current="page"><span className="resource-playlist-current-mark"><Route size={15}/></span><span><small>NOW VIEWING</small><strong>Path overview</strong></span></div>}
      <div className="resource-playlist-groups">{sections.map(section => {
        const items = playlist.items.filter(item => item.sectionId === section.id || ((section.id === 'all' || section.id === 'ungrouped') && !item.sectionId));
        if (!items.length) return null;
        return <section key={section.id} className="resource-playlist-group">{playlist.sections.length > 0 && <h3>{section.title}</h3>}<ol>{items.map(item => {
          const active = item.resource.slug === currentSlug;
          const itemIndex = playlist.items.findIndex(value => value.resource.slug === item.resource.slug);
          const content = <><span className="resource-playlist-number">{String(itemIndex + 1).padStart(2, '0')}</span>{item.resource.coverUrl ? <img className="resource-playlist-cover" decoding="async" {...publicImageAttributes(item.resource.coverUrl, [192], "96px")} alt="" loading="lazy"/> : <span className="resource-playlist-cover is-empty"><Play size={14}/></span>}<span className="resource-playlist-copy"><small>{kindLabel[item.resource.type]}{item.resource.tags[0] ? ` · ${item.resource.tags[0]}` : ''}</small><strong>{item.resource.title}</strong></span>{active && <span className="resource-playlist-playing" aria-hidden="true"><Play size={13} fill="currentColor"/></span>}</>;
          return <li key={item.resource.slug}>{active ? <div className="resource-playlist-item is-current" aria-current="page">{content}</div> : <Link className="resource-playlist-item" href={`/resources/${item.resource.slug}`}>{content}<ArrowUpRight className="resource-playlist-open" size={14}/></Link>}</li>;
        })}</ol></section>;
      })}</div>
      <Link className="resource-playlist-back" href={`/resources/${playlist.slug}`}>Open {playlist.type === 'PATH' ? 'learning path' : 'course'} overview <ArrowUpRight size={14}/></Link>
    </aside>;
  }

  return <aside className="resource-learning-sidebar" aria-label="Related resources">
    <header className="resource-learning-sidebar-heading"><span className="maker-kicker"><FileText size={13}/>KEEP EXPLORING</span><h2>Related resources</h2><p>More ideas connected to this resource.</p></header>
    {related.length ? <ol className="resource-related-list">{related.map(item => <li key={item.slug}><Link href={`/resources/${item.slug}`} className="resource-related-item">{item.coverUrl ? <img decoding="async" {...publicImageAttributes(item.coverUrl, [192], "96px")} alt="" loading="lazy"/> : <span className="resource-related-placeholder"><FileText size={17}/></span>}<span><small>{kindLabel[item.type]}{item.tags[0] ? ` · ${item.tags[0]}` : ''}</small><strong>{item.title}</strong><span className="resource-related-summary">{item.summary}</span></span><ArrowUpRight className="resource-related-open" size={14}/></Link></li>)}</ol> : <div className="resource-related-empty"><p>More resources are on the way.</p><Link href="/resources">Browse the full library <ArrowUpRight size={14}/></Link></div>}
  </aside>;
}
