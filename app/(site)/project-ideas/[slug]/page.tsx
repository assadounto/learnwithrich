import {notFound} from 'next/navigation';
import {ArrowLeft, ArrowRight, Lightbulb} from 'lucide-react';
import Link from '@/components/navigation-link';
import {disciplineLabel} from '@/lib/project-ideas';
import {publishedIdea} from '@/lib/server/project-ideas';
import {ProjectCatalogHero} from '@/components/project-catalog-hero';
import styles from '../ideas.module.css';

export const dynamic = 'force-dynamic';

export default async function ProjectIdeaDetail({params}: {params: Promise<{slug: string}>}) {
  const idea = await publishedIdea((await params).slug);
  if (!idea) notFound();
  return <article className={`ref-container ${styles.page}`}>
    <Link className="text-link idea-back" href="/project-ideas"><ArrowLeft size={16}/>All project ideas</Link>
    <ProjectCatalogHero label={disciplineLabel(idea.discipline)} title={idea.title}
      artwork={<Lightbulb size={125} strokeWidth={.8}/>}
      actions={<><Link className="button button-dark" href={`/services/request?idea=${idea.slug}`}>Request help <ArrowRight size={16}/></Link><Link className="button button-outline" href="/projects">Explore projects <ArrowRight size={16}/></Link></>}>
      <h2 className="idea-abstract-title">Project abstract</h2>
      <p className="idea-abstract">{idea.abstract}</p>
      <ul className={styles.tags} aria-label="Tags">{idea.tags.map(tag => <li key={tag}><Link href={`/project-ideas?${new URLSearchParams({tag})}#ideas`}>{tag}</Link></li>)}</ul>
    </ProjectCatalogHero>
  </article>;
}
