import type {Metadata} from 'next';
import {Suspense} from 'react';
import Link from '@/components/navigation-link';
import {ArrowRight, ArrowUpRight, CircuitBoard, Code2, FileText, MoveUpRight} from 'lucide-react';
import {ProjectBrowser} from '@/components/project-browser';
import {LiveCatalogBrowser} from '@/components/live-catalog-browser';
import {listings} from '@/lib/xonbay/server';
import {isProject, productHref} from '@/lib/live-catalog';
import {money} from '@/lib/xonbay/contracts';
import {CreatorPortrait} from '@/components/creator-portrait';
import styles from './projects.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'Projects — code, circuits and useful ideas', description: 'Explore published electronics and software projects with components, build steps and downloads.'};

export default async function ProjectsPage() {
  const data = await listings();
  const published = data.items.filter(isProject);
  const featured = published[0];
  const freeCount = published.filter(item => item.price_minor === 0).length;
  return <div className={`${styles.index} ref-container`}>
    <div className={styles.collectionLabel}><span><span/> THE PROJECT COLLECTION</span><span>CODE. CIRCUITS. CURIOSITY.</span></div>
    <section className={styles.hero} aria-labelledby="projects-title">
      <div className={styles.heroCopy}>
        <span className={styles.kicker}>FROM THE LEARNWITHRICH WORKBENCH</span>
        <h1 id="projects-title">Good ideas<br/>deserve to<br/><i>be built.</i></h1>
        <p>Explore the code, the circuits, and the thinking behind useful things. Find a project. Make it your own.</p>
        <a href="#project-collection" className={styles.primary}>Explore the projects <ArrowUpRight size={18} aria-hidden="true"/></a>
        <Link href="/about" className={styles.maker}><CreatorPortrait/><span>Built & shared by <strong>Richmond Adu-Kyere</strong></span><ArrowUpRight size={14} aria-hidden="true"/></Link>
      </div>
      {featured ? <Link className={styles.feature} href={productHref(featured)} aria-label={`Explore featured project: ${featured.title}`}>
        <div className={styles.featureImage}>
          {featured.cover_url ? <img src={featured.cover_url} alt=""/> : <div className={styles.featureFallback}><CircuitBoard size={108} strokeWidth={.8} aria-hidden="true"/><span>FROM IDEA<br/>TO SOMETHING REAL.</span></div>}
          <span className={styles.featureFlag}>IN FOCUS <span>01</span></span>
          <span className={styles.featureArrow}><MoveUpRight size={24} aria-hidden="true"/></span>
        </div>
        <div className={styles.featureBody}><span className={styles.kicker}>FEATURED PROJECT</span><h2>{featured.title}</h2><p>{featured.description}</p><div className={styles.featureMeta}><span>{featured.project_details?.difficulty || 'A project to explore'}{featured.project_details?.duration && ` · ${featured.project_details.duration}`}</span><strong>{featured.price_minor === 0 ? 'Free to explore' : money(featured.price_minor, featured.currency)}</strong></div></div>
      </Link> : <div className={styles.invitation}><CircuitBoard size={100} strokeWidth={.75} aria-hidden="true"/><span className={styles.kicker}>A SPACE FOR WHAT’S NEXT</span><h2>Every useful thing<br/>starts with <i>“what if”.</i></h2><p>{data.error ? 'The workbench is taking a moment to load. You can still explore the planning collection below.' : 'Explore the planning collection while new published projects take shape.'}</p><a href="#planning-samples">Explore project concepts <ArrowUpRight size={17} aria-hidden="true"/></a></div>}
    </section>
    <div className={styles.disciplines} aria-label="Project disciplines"><span><CircuitBoard size={20} aria-hidden="true"/><strong>Electronics & IoT</strong><small>Connect the physical world.</small></span><span><Code2 size={20} aria-hidden="true"/><strong>Software & systems</strong><small>Give useful ideas a working form.</small></span><span><FileText size={20} aria-hidden="true"/><strong>The build process</strong><small>Understand the decisions in between.</small></span></div>
    {!data.error && published.length > 0 && <div className={styles.catalogNote}><span>THE PUBLISHED COLLECTION</span><p><strong>{published.length}</strong> {published.length === 1 ? 'project' : 'projects'} to explore <span aria-hidden="true">/</span> <strong>{freeCount}</strong> free</p></div>}
    {data.error ? <section id="project-collection" className={styles.loadError} role="status"><CircuitBoard size={25} aria-hidden="true"/><div><h2>The workbench needs a moment.</h2><p>Projects could not load. Refresh the page to try again, or explore the planning samples below.</p></div><a href="/projects" className="button button-outline">Try again <ArrowRight size={16} aria-hidden="true"/></a></section> : <LiveCatalogBrowser items={published} projectsOnly/>}
    <details className={`project-planning-samples ${styles.samples}`} id="planning-samples"><summary><span><span className={styles.kicker}>THE SKETCHBOOK</span>Ideas in the making.</span><span>Explore planning samples <ArrowUpRight size={18} aria-hidden="true"/></span></summary><p>Project outlines and early concepts, separate from the published collection.</p><Suspense fallback={<p>Loading the workbench…</p>}><ProjectBrowser/></Suspense></details>
    <section className={styles.closing}><div><span className={styles.kicker}>THERE’S A PERSON BEHIND EVERY BUILD</span><h2>A curious mind.<br/><i>A hands-on approach.</i></h2><p>Meet Richmond, and the thinking behind the work.</p></div><Link href="/about">Meet the maker <ArrowUpRight size={25} aria-hidden="true"/></Link></section>
  </div>;
}
