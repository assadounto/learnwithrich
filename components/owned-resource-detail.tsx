import Link from '@/components/navigation-link';
import {ArrowRight, ArrowUpRight, BookOpen, Check, CircleCheck, Clock3, Download, FileDown, FileText, Gauge, Headphones, Layers3, LockKeyhole, Play, Sparkles, ChevronRight} from 'lucide-react';
import type {ResourceKind, AccessMode} from '@/lib/server/resources/validation';
import type {ResourceDetails} from '@/lib/resource-types';
import {resourceDefinitions} from '@/lib/resource-types';
import {money} from '@/lib/money';
import {PurchaseButton} from '@/components/purchase-button';
import {SaveButton} from '@/components/resource-card';
import {RichMarkdown, youtubeId} from '@/components/rich-markdown';
import {ResourceDetailTabs} from '@/components/resource-detail-tabs';
import {ResourceDetailGallery, type ResourceGalleryImage} from '@/components/resource-detail-gallery';
import {ResourceLearningSidebar} from '@/components/resource-learning-sidebar';

type ResourceItem = {id: string; slug: string; title: string; summary: string; type: ResourceKind; coverUrl: string | null; tags: string[]; access: AccessMode; priceMinor: number; currency: string};
type ResourceCollection = {id: string; slug: string; title: string; type: ResourceKind; sections: {id: string; title: string; position: number}[]; items: {position: number; sectionId: string | null; resource: ResourceItem}[]};
type Resource = {id: string; slug: string; type: ResourceKind; title: string; summary: string; coverUrl: string | null; access: AccessMode; priceMinor: number; currency: string; tags: string[]; details: ResourceDetails | null; bodyMarkdown: string | null; requiresAccess: boolean; hasBundle: boolean; signedIn: boolean; media: {id: string; title: string; priceMinor: number; originalName: string; mimeType: string; sizeBytes: number; includedInBundle: boolean; owned: boolean}[]; sections: {id: string; title: string; position: number}[]; items: {position: number; sectionId: string | null; resource: ResourceItem}[]; collections: ResourceCollection[]};

const names: Record<ResourceKind, string> = {PROJECT: 'Project', ARTICLE: 'Article', COURSE: 'Course', PATH: 'Learning path', LESSON: 'Lesson', DOWNLOAD: 'Download', BOOK: 'Book', GUIDE: 'Guide', ILLUSTRATION: 'Illustration'};
const detailHeadings: Record<ResourceKind, string> = {PROJECT: 'A useful idea to explore', ARTICLE: 'The idea behind the article', COURSE: 'Build your understanding', PATH: 'A guided learning journey', LESSON: 'One clear step forward', DOWNLOAD: 'A resource to put to work', BOOK: 'Ideas worth keeping', GUIDE: 'A practical guide', ILLUSTRATION: 'A visual resource to use'};
const nextSteps: Record<ResourceKind, {title: string; description: string; action: string}> = {
  PROJECT: {title: 'Ready to make it?', description: 'Explore the build, gather what you need, and work through each step at your own pace.', action: 'Start the project'},
  ARTICLE: {title: 'Make time to read', description: 'Settle in with the article, then save it to return whenever you need it.', action: 'Read the article'},
  COURSE: {title: 'Build your skills', description: 'Follow the lessons in order and put each idea into practice as you go.', action: 'Explore the course'},
  PATH: {title: 'Take the next step', description: 'A guided sequence of resources will help you move from the foundations to a finished outcome.', action: 'Start this path'},
  LESSON: {title: 'Let’s learn something', description: 'Work through the explanation, try the exercise, and check what you’ve learned.', action: 'Start the lesson'},
  DOWNLOAD: {title: 'Get the files', description: 'Review what’s included, then download the materials for your next project.', action: 'View download'},
  BOOK: {title: 'Open your next chapter', description: 'Explore the book details and accompanying materials in one place.', action: 'Explore the book'},
  GUIDE: {title: 'Follow along, step by step', description: 'Use this guide as a practical companion while you work through the task.', action: 'Open the guide'},
  ILLUSTRATION: {title: 'Use this visual', description: 'Review the image details and usage notes before adding it to your work.', action: 'View illustration'},
};

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
}

function readable(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return stringList(value).join(' · ') || null;
  return null;
}

function humanFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function OwnedResourceDetail({resource, relatedResources}: {resource: Resource; relatedResources: ResourceItem[]}) {
  const details = resource.details ?? {};
  const file = typeof details.fileUrl === 'string' ? details.fileUrl : null;
  const fileName = typeof details.fileName === 'string' ? details.fileName : 'Open resource file';
  const audio = typeof details.audioUrl === 'string' ? details.audioUrl : null;
  const audioMedia = audio?.match(/^media:\/\/([a-f\d-]+)$/i)?.[1];
  const video = typeof details.videoUrl === 'string' ? details.videoUrl : null;
  const videoMedia = video?.match(/^media:\/\/([a-f\d-]+)$/i)?.[1];
  const audioSrc = audioMedia ? `/api/resource-assets/${audioMedia}?slug=${encodeURIComponent(resource.slug)}` : audio;
  const videoSrc = videoMedia ? `/api/resource-assets/${videoMedia}?slug=${encodeURIComponent(resource.slug)}` : video;
  const videoYoutube = videoSrc ? youtubeId(videoSrc) : null;
  const duration = typeof details.durationMinutes === 'number' ? `${details.durationMinutes} min` : null;
  const difficulty = typeof details.difficulty === 'string' ? details.difficulty : null;
  const author = typeof details.author === 'string' ? details.author : 'Richmond Adu-Kyere';
  const outcomes = stringList(details.outcomes);
  const prerequisites = stringList(details.prerequisites);
  const materials = stringList(details.materials);
  const mediaCount = resource.media.length;
  const hasPreview = !resource.requiresAccess;
  const next = nextSteps[resource.type];
  const allDetails = resourceDefinitions[resource.type].fields
    .filter(field => !['fileUrl', 'audioUrl', 'videoUrl', 'outcomes', 'difficulty', 'durationMinutes', 'author', 'prerequisites', 'materials'].includes(field.key))
    .flatMap(field => {
      const value = details[field.key];
      if (value == null || value === '') return [];
      return [{key: field.key, label: field.label, kind: field.kind, value}];
    });
  const groupList = resource.sections.length
    ? [...resource.sections.map(section => ({...section, items: resource.items.filter(item => item.sectionId === section.id)})), ...(resource.items.some(item => !item.sectionId) ? [{id: 'ungrouped', title: 'More in this collection', items: resource.items.filter(item => !item.sectionId)}] : [])]
    : [{id: 'ungrouped', title: resource.type === 'PATH' ? 'Your learning path' : 'Course lessons', items: resource.items}];
  const galleryImages: ResourceGalleryImage[] = [];
  if (resource.coverUrl) galleryImages.push({src: resource.coverUrl, alt: resource.type === 'ILLUSTRATION' && typeof details.altText === 'string' ? details.altText : resource.title, label: `${names[resource.type]} cover`});
  for (const item of resource.media) {
    if (item.mimeType.startsWith('image/') && item.owned) galleryImages.push({src: `/api/resource-files/${item.id}?resourceId=${resource.id}`, alt: item.title, label: item.title});
  }
  if (!galleryImages.length && resource.type === 'ILLUSTRATION' && file && /\.(png|jpe?g|webp|gif|svg)(?:[?#]|$)/i.test(file)) galleryImages.push({src: file, alt: typeof details.altText === 'string' ? details.altText : resource.title, label: fileName});

  const collectionTab = hasPreview && resource.items.length > 0 ? {
    id: 'collection',
    label: resource.type === 'PATH' ? 'Learning journey' : 'Curriculum',
    content: <div className="resource-detail-collection">
      <header><span className="maker-kicker">{resource.type === 'PATH' ? 'A GUIDED JOURNEY' : 'THE CURRICULUM'}</span><h2>{resource.type === 'PATH' ? 'Your path, step by step' : 'Explore the lessons'}</h2><p>{resource.items.length} {resource.type === 'PATH' ? 'stops to guide your progress' : 'lessons to help you build confidence'}</p></header>
      {groupList.map(group => <section key={group.id} className="resource-collection-group">{groupList.length > 1 && <h3>{group.title}</h3>}<ol>{group.items.map((item, index) => <li key={item.resource.id}><span className="resource-collection-number">{String(index + 1).padStart(2, '0')}</span><div><span className="maker-kicker">{names[item.resource.type]}{item.resource.tags[0] ? ` · ${item.resource.tags[0]}` : ''}</span><Link href={`/resources/${item.resource.slug}`}>{item.resource.title}<ArrowUpRight size={15}/></Link>{item.resource.summary && <p>{item.resource.summary}</p>}</div><ArrowRight size={17}/></li>)}</ol></section>)}
    </div>,
  } : null;

  const downloadsTab = file || mediaCount > 0 ? {
    id: 'downloads',
    label: 'Downloads',
    content: <section className="owned-detail-media">
      <header className="owned-detail-media-heading"><span className="maker-kicker">FILES & LEARNING MATERIALS</span><h2>Take the materials with you.</h2><p>{resource.access === 'PAID' ? 'Attachments are included with your resource bundle.' : 'Download a free extra or add an individual file to your collection.'}</p></header>
      {hasPreview && file && <article className="owned-detail-media-item resource-direct-file"><span className="owned-media-kind">{typeof details.fileFormat === 'string' ? details.fileFormat.toUpperCase() : 'FILE'}</span><div className="owned-media-copy"><strong>{fileName}</strong><small>Primary resource file</small></div><a className="button button-outline" href={file} target="_blank" rel="noreferrer"><FileDown size={15}/>Open file</a></article>}
      <div className="owned-detail-media-list">{resource.media.map(item => {
        const url = `/api/resource-files/${item.id}?resourceId=${resource.id}`;
        return <article className="owned-detail-media-item" key={item.id}><span className="owned-media-kind">{item.mimeType.startsWith('image/') ? 'IMAGE' : item.mimeType.startsWith('audio/') ? 'AUDIO' : 'FILE'}</span><div className="owned-media-copy"><strong>{item.title}</strong><small>{item.originalName} · {humanFileSize(item.sizeBytes)}</small>{item.owned && item.mimeType.startsWith('audio/') && <audio controls preload="none" src={url}>Your browser does not support audio playback.</audio>}</div><div className="owned-media-action">{item.owned ? <a className="button button-outline" href={url} download={item.originalName}><Download size={15}/>{item.mimeType.startsWith('audio/') ? 'Download audio' : 'Download'}</a> : item.includedInBundle ? <span className="owned-media-included"><LockKeyhole size={14}/>In bundle</span> : item.priceMinor > 0 ? <PurchaseButton resourceMediaId={item.id} label={`Buy · ${money(item.priceMinor, resource.currency)}`}/> : !resource.signedIn && resource.access === 'FREE_ACCOUNT' ? <Link href={`/signin?next=${encodeURIComponent(`/resources/${resource.slug}`)}`} className="button button-outline">Sign in to download</Link> : <span className="owned-media-included">Available after sign-in</span>}</div></article>;
      })}</div>
      {!resource.media.length && !file && <p>Files for this resource are being prepared.</p>}
    </section>,
  } : null;

  const overviewPanel = <div className="resource-detail-overview">
    <div className="resource-detail-overview-heading"><div><span className="maker-kicker">{resource.type === 'PROJECT' ? 'THE QUESTION' : 'THE BIG IDEA'}</span><h2>{detailHeadings[resource.type]}</h2></div><span className="resource-overview-type"><Sparkles size={15}/>{names[resource.type]}</span></div>
    <div className="resource-detail-overview-grid"><section><span className="maker-kicker">WHY IT MATTERS</span><h3>{resource.title}</h3><p>{resource.summary}</p></section><section><span className="maker-kicker">{outcomes.length ? 'WHAT YOU’LL TAKE AWAY' : 'A GOOD WAY TO BEGIN'}</span>{outcomes.length ? <ul className="resource-outcome-list">{outcomes.slice(0, 5).map((outcome, index) => <li key={`${outcome}-${index}`}><Check size={15}/>{outcome}</li>)}</ul> : <p>{resource.type === 'PROJECT' ? 'Start by understanding the idea, then make a small plan before choosing components or tools.' : next.description}</p>}</section></div>
    {resource.requiresAccess && <div className="owned-access-locked" role="note"><LockKeyhole size={18}/><div><strong>{resource.access === 'PAID' ? 'Full access is part of the bundle' : 'Sign in to view the complete resource'}</strong><p>{resource.access === 'PAID' ? 'This introduction stays visible. Unlock the bundle for the full material and included files.' : 'You can preview the introduction. Sign in for the complete learning material and downloads.'}</p></div></div>}
    {resource.type !== 'PROJECT' && resource.bodyMarkdown && <div className="resource-detail-prose"><RichMarkdown text={resource.bodyMarkdown} resourceSlug={resource.slug} className={`owned-markdown${resource.requiresAccess ? ' is-preview' : ''}`}/></div>}
    {hasPreview && audioSrc && <section className="owned-detail-audio"><div><Headphones size={19}/><div><span className="maker-kicker">AUDIO VERSION</span><h3>Listen to this resource</h3></div></div><audio controls preload="none" src={audioSrc}>Your browser does not support audio playback.</audio></section>}
    {!resource.requiresAccess && videoSrc && (videoYoutube ? <div className="rich-markdown-video"><iframe src={`https://www.youtube-nocookie.com/embed/${videoYoutube}`} title="Resource video" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/> </div> : <section className="owned-detail-video"><h3>Watch this resource</h3><video controls preload="metadata" playsInline src={videoSrc}>Video playback is not supported by this browser.</video></section>)}
  </div>;

  const tabItems = [{id: 'overview', label: 'Overview', content: overviewPanel}];
  if (resource.type === 'PROJECT' && materials.length > 0) tabItems.push({id: 'components', label: 'Components', content: <section className="resource-detail-components"><header><span className="maker-kicker">TOOLS FOR THE BUILD</span><h2>Components & materials</h2><p>Review the list and choose parts that suit your version of the project.</p></header><ol>{materials.map((material, index) => <li key={`${material}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{material}</strong><CircleCheck size={17}/></li>)}</ol></section>});
  if (resource.type === 'PROJECT') tabItems.push({id: 'build-plan', label: 'Build plan', content: <section className="resource-detail-build-plan"><header><span className="maker-kicker">PLAN · BUILD · TEST</span><h2>Work through the project.</h2></header>{resource.requiresAccess ? <div className="owned-catalog-empty"><h2>Unlock the build plan.</h2><p>The detailed steps and supporting materials are available with full resource access.</p></div> : resource.bodyMarkdown ? <RichMarkdown text={resource.bodyMarkdown} resourceSlug={resource.slug} className="owned-markdown"/> : <p>The build plan is being prepared. Save this project and check back soon.</p>}</section>});
  if (collectionTab) tabItems.push(collectionTab);
  if (allDetails.length > 0 || (resource.type !== 'PROJECT' && resource.tags.length > 0)) tabItems.push({id: 'details', label: 'Details', content: <section className="resource-detail-meta-panel"><header><span className="maker-kicker">RESOURCE DETAILS</span><h2>Good to know.</h2></header>{resource.tags.length > 0 && <div className="resource-detail-tag-list">{resource.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}{allDetails.length > 0 && <dl>{allDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.kind === 'url' && typeof field.value === 'string' ? <a href={field.value} target="_blank" rel="noreferrer">{field.label === 'Live demo' ? 'Try the live demo' : field.label === 'Source code repository' ? 'View the repository' : 'Open link'} <ArrowUpRight size={13}/></a> : <span>{Array.isArray(field.value) ? stringList(field.value).join(' · ') : String(field.value)}</span>}</dd></div>)}</dl>}{allDetails.length === 0 && <p>Explore the topics and tools connected to this resource.</p>}</section>});
  if (downloadsTab) tabItems.push(downloadsTab);

  const freeFile = hasPreview && resource.access !== 'PAID' && (Boolean(file) || resource.media.some(item => item.owned && item.priceMinor === 0 && !item.mimeType.startsWith('image/')));
  const glance = [
    {label: 'Suggested level', value: difficulty || (resource.type === 'ARTICLE' ? 'All readers' : 'Self-paced')},
    {label: 'Field', value: resource.tags.slice(0, 2).join(' · ') || 'Practical learning'},
    ...(duration ? [{label: 'Estimated time', value: duration}] : []),
    {label: 'Current format', value: readable(details.fileFormat) || resourceDefinitions[resource.type].name},
    ...(resource.items.length ? [{label: resource.type === 'PATH' ? 'Journey stops' : 'Lessons', value: String(resource.items.length)}] : []),
    ...(mediaCount ? [{label: 'Attached files', value: String(mediaCount)}] : []),
  ];
  const fallbackPrerequisites: Record<ResourceKind, string[]> = {
    PROJECT: ['Read the overview and project notes', 'Gather the listed tools and materials', 'Use a simulation or safe, low-voltage setup where relevant'],
    ARTICLE: ['Set aside a few minutes to read', 'Keep notes on ideas you want to revisit'],
    COURSE: ['Start with the first lesson', 'Make time to try each exercise'],
    PATH: ['Begin with the first stop', 'Move through the resources at your own pace'],
    LESSON: ['Read the lesson overview', 'Try the exercise as you go'],
    DOWNLOAD: ['Review the file format and requirements', 'Keep an original copy before editing'],
    BOOK: ['Check the book format and edition', 'Keep notes as you read'],
    GUIDE: ['Read the prerequisites', 'Gather the tools or files listed in the guide'],
    ILLUSTRATION: ['Review the usage rights', 'Keep any required attribution with your work'],
  };
  const beforeList = prerequisites.length ? prerequisites : fallbackPrerequisites[resource.type];
  const parentHref = resource.type === 'PROJECT' ? '/projects' : resource.type === 'COURSE' || resource.type === 'LESSON' ? '/courses' : '/resources';
  const parentLabel = resource.type === 'PROJECT' ? 'projects' : resource.type === 'COURSE' || resource.type === 'LESSON' ? 'courses' : 'resources';
  const playlist: ResourceCollection | null = resource.type === 'COURSE' || resource.type === 'PATH'
    ? {id: resource.id, slug: resource.slug, title: resource.title, type: resource.type, sections: resource.sections, items: resource.items}
    : resource.collections.find(item => item.type === 'PATH') ?? resource.collections.find(item => item.type === 'COURSE') ?? null;
  const coverAlt = resource.type === 'ILLUSTRATION' && typeof details.altText === 'string' ? details.altText : resource.title;
  const freeMedia = resource.media.find(item => item.owned && item.priceMinor === 0 && !item.mimeType.startsWith('image/'));
  const firstMediaUrl = freeMedia ? `/api/resource-files/${freeMedia.id}?resourceId=${resource.id}` : null;

  return <article className={`owned-detail ref-container owned-detail-${resource.type.toLowerCase()}`}>
    <nav className="owned-detail-breadcrumb" aria-label="Breadcrumb"><Link href={parentHref}>All {parentLabel}</Link><ChevronRight size={13} aria-hidden="true"/><span aria-current="page">{resource.title}</span></nav>
    <div className="resource-detail-showcase">
      <header className="resource-detail-intro">
        <span className="owned-detail-eyebrow"><span className="owned-detail-type-mark"><Sparkles size={14}/></span> LEARN WITH RICH <i/> {names[resource.type]}</span>
        <h1>{resource.title}</h1>
        <div className="resource-detail-author"><img src="/images/richmond-adu-kyere.jpeg" alt=""/><span>by <strong>{author}</strong></span>{duration && <span className="resource-author-duration"><Clock3 size={13}/>{duration}</span>}</div>
        <p>{resource.summary}</p>
        <div className="resource-detail-tags">{resource.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        <div className="owned-detail-facts">{difficulty && <span><Gauge size={15}/>{difficulty}</span>}{duration && <span><Clock3 size={15}/>{duration}</span>}{resource.items.length > 0 && <span><Layers3 size={15}/>{resource.items.length} {resource.type === 'PATH' ? 'stops' : resource.type === 'COURSE' ? 'lessons' : 'included resources'}</span>}{mediaCount > 0 && <span><FileText size={15}/>{mediaCount} {mediaCount === 1 ? 'file' : 'files'}</span>}</div>
      </header>

      <aside className="resource-detail-action-card">
        <div className="resource-action-heading"><span className="resource-action-icon">{resource.requiresAccess ? <LockKeyhole size={21}/> : freeFile ? <FileText size={23}/> : <BookOpen size={22}/>}</span><div><h2>{freeFile ? 'Free resource file' : resource.access === 'PAID' ? 'Complete resource bundle' : resource.access === 'FREE_ACCOUNT' ? 'Free learner resource' : 'Open resource'}</h2><p>{freeFile ? 'Start with the downloadable project notes and materials.' : resource.summary}</p></div></div>
        <div className="resource-action-buttons">
          {freeFile && file ? <a className="button button-orange" href={file} target="_blank" rel="noreferrer"><Download size={16}/>{fileName}</a> : freeFile && firstMediaUrl ? <a className="button button-orange" href={firstMediaUrl} download={freeMedia?.originalName}><Download size={16}/>Download free file</a> : resource.access === 'PUBLIC' ? <a className="button button-orange" href="#resource-tabs"><Play size={15} fill="currentColor"/>Explore this {names[resource.type].toLowerCase()}</a> : resource.access === 'FREE_ACCOUNT' ? resource.signedIn ? <a className="button button-orange" href="#resource-tabs">Continue learning <ArrowRight size={16}/></a> : <Link className="button button-orange" href={`/signin?next=${encodeURIComponent(`/resources/${resource.slug}`)}`}>Sign in for free <ArrowRight size={16}/></Link> : resource.hasBundle ? <a className="button button-orange" href="#resource-tabs">Continue learning <ArrowRight size={16}/></a> : <PurchaseButton resourceId={resource.id} label={`Unlock the bundle · ${money(resource.priceMinor, resource.currency)}`}/>}
          <SaveButton slug={resource.slug} large/>
        </div>
        <p className="resource-action-footnote">{freeFile ? `${typeof details.fileFormat === 'string' ? details.fileFormat : 'Download'} · Free resource` : resource.access === 'PAID' ? 'One-time purchase · Bundle access' : 'Save this resource to return when you’re ready.'}</p>
        {resource.access === 'PAID' && !resource.hasBundle && <span className="owned-detail-includes"><LockKeyhole size={13}/> Includes all material and attached files</span>}
      </aside>

      <div className="resource-detail-gallery-wrap"><ResourceDetailGallery images={galleryImages} kind={names[resource.type]} title={resource.title}/><p className="resource-gallery-note">{galleryImages.length > 1 ? `${galleryImages.length} images · ${names[resource.type]} preview` : galleryImages.length === 1 ? `${names[resource.type]} · Resource preview` : `${names[resource.type]} · Visual overview`}</p></div>

      <section className="resource-detail-glance"><header><span className="maker-kicker">AT A GLANCE</span><h2>A quick look.</h2></header><dl>{glance.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl><div className="resource-glance-tags">{resource.tags.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div></section>

      <section className="resource-detail-before"><span className="maker-kicker">GETTING STARTED</span><h2>Before you begin</h2><ul>{beforeList.slice(0, 4).map((item, index) => <li key={`${item}-${index}`}><Check size={14}/>{item}</li>)}</ul><Link href="/about" className="text-link">Meet the maker <ArrowRight size={15}/></Link></section>
    </div>

    <div className="resource-detail-lower-layout">
      <ResourceDetailTabs items={tabItems}/>
      <ResourceLearningSidebar currentSlug={resource.slug} playlist={playlist} related={relatedResources}/>
    </div>

    <footer className="owned-detail-next"><div><span className="maker-kicker">KEEP YOUR CURIOSITY GOING</span><h2>There’s always<br/><i>more to explore.</i></h2></div><Link href={parentHref} className="button button-outline">Browse more {names[resource.type].toLowerCase()}s <ArrowUpRight size={16}/></Link></footer>
  </article>;
}
