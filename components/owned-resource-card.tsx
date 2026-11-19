import Link from '@/components/navigation-link';
import {ArrowUpRight, BookOpen, CircuitBoard, FileText, Layers3, Image, Download, GraduationCap, Library, FolderOpen, Clock3, Gauge} from 'lucide-react';
import type {ResourceKind} from '@/lib/server/resources/validation';
import {money} from '@/lib/money';

type ResourceCardData = {id: string; slug: string; type: ResourceKind; title: string; summary: string; coverUrl: string | null; access: 'PUBLIC' | 'FREE_ACCOUNT' | 'PAID'; priceMinor: number; currency: string; tags: string[]};
const labels: Record<ResourceKind, string> = {PROJECT: 'Project', ARTICLE: 'Article', COURSE: 'Course', PATH: 'Learning path', LESSON: 'Lesson', DOWNLOAD: 'Download', BOOK: 'Book', GUIDE: 'Guide', ILLUSTRATION: 'Illustration'};
const icons = {PROJECT: CircuitBoard, ARTICLE: FileText, COURSE: GraduationCap, PATH: Layers3, LESSON: BookOpen, DOWNLOAD: Download, BOOK: Library, GUIDE: FolderOpen, ILLUSTRATION: Image};
export function OwnedResourceCard({item, featured = false}: {item: ResourceCardData; featured?: boolean}) {
  const Icon = icons[item.type];
  return <article className={`owned-resource-card${featured ? ' is-featured' : ''}`}>
    <Link href={`/resources/${item.slug}`} className="owned-resource-cover" aria-label={`Open ${item.title}`}>
      {item.coverUrl ? <img src={item.coverUrl} alt="" loading="lazy"/> : <span className="owned-resource-art"><Icon size={featured ? 48 : 35} strokeWidth={1.15}/><small>LEARNWITHRICH</small></span>}
      <span className="owned-resource-type">{labels[item.type]}</span><span className="owned-resource-arrow"><ArrowUpRight size={19}/></span>
    </Link>
    <div className="owned-resource-copy"><div className="owned-resource-meta"><span>{item.access === 'PUBLIC' ? 'Open resource' : item.access === 'PAID' ? 'Premium access' : 'Free account'}</span>{item.type === 'PROJECT' && <span>Build & learn</span>}</div><h3><Link href={`/resources/${item.slug}`}>{item.title}</Link></h3><p>{item.summary || 'A new resource from the LearnWithRich collection.'}</p>
      {!!item.tags.length && <div className="owned-resource-tags">{item.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div>}
      <div className="owned-resource-bottom"><span>{item.access === 'PAID' ? money(item.priceMinor, item.currency) : item.access === 'FREE_ACCOUNT' ? 'Free with an account' : 'Free to explore'}</span><Link href={`/resources/${item.slug}`} aria-label={`Explore ${item.title}`}>Explore <ArrowUpRight size={15}/></Link></div>
    </div>
  </article>;
}

export function OwnedResourceGrid({items}: {items: ResourceCardData[]}) {
  return <div className="owned-resource-grid">{items.map(item => <OwnedResourceCard key={item.id} item={item}/>)}</div>;
}

export type {ResourceCardData};
