'use client';
import {SelectMenu} from '@/components/selection-dialog';
import Link from '@/components/navigation-link';
import {useEffect, useRef, useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowLeft, ArrowDown, ArrowUp, Plus, Trash2, Eye, FileText, Save, Columns2, FolderOpen, Layers3, ListTree, Settings2, Upload, Image as ImageIcon, Link2, Music2, RotateCcw, Video, Youtube} from 'lucide-react';
import {GuideText} from '@/components/guide-text';
import {saveResource, changeResourceStatus, refreshResourceChoices} from '@/app/admin/actions';
import {resourceTypes, type ResourceKind, type AccessMode} from '@/lib/server/resources/validation';
import {editorHeadingKeys, resourceDefinitions, slugFromTitle, publishingIssues, type ResourceDetails} from '@/lib/resource-types';
import {useAdminDirty} from './workspace-shell';
import {moveItem, priceToMinor} from '@/lib/resource-editor';
import {MediaLibraryModal} from './media-library-modal';
import styles from './resource-editor.module.css';

type Section = {key: string; title: string};
type Item = {resourceId: string; sectionKey: string | null};
type AttachedMedia = {mediaAssetId: string; title: string; priceMinor: number; originalName: string; mimeType: string; sizeBytes: number};
type Choice = {id: string; title: string; type: string; status: string};
type Initial = {
  id: string; version: number; updatedAt: string; status: string; title: string; slug: string; type: ResourceKind;
  summary: string; coverUrl: string; access: AccessMode; priceMinor: number; currency: string;
  details: ResourceDetails; bodyMarkdown: string; tags: string[]; sections: Section[]; items: Item[];
  media: AttachedMedia[];
  history: {action: string; version: number; createdAt: string; name: string}[];
};
const typeNames: Record<string, string> = {PROJECT: 'Project', ARTICLE: 'Article', COURSE: 'Course', PATH: 'Learning path', LESSON: 'Lesson', DOWNLOAD: 'Download', BOOK: 'Book', GUIDE: 'Guide', ILLUSTRATION: 'Illustration'};
const editorPanels = [
  {id: 'resource-basics', label: 'Basics', icon: FileText},
  {id: 'resource-content', label: 'Markdown', icon: ListTree},
  {id: 'resource-details', label: 'Details', icon: Settings2},
  {id: 'resource-files', label: 'Files', icon: FolderOpen},
  {id: 'resource-collection', label: 'Collection', icon: Layers3},
  {id: 'resource-settings', label: 'Cover & access', icon: ImageIcon},
  {id: 'resource-publishing', label: 'Publishing', icon: Upload},
] as const;
type EditorPanel = typeof editorPanels[number]['id'];

export function ResourceEditor({initial, choices: initialChoices, initialType = 'ARTICLE'}: {initial?: Initial; choices: Choice[]; initialType?: ResourceKind}) {
  const [choices, setChoices] = useState(initialChoices);
  const router = useRouter(); const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initial?.title ?? ''); const [slug, setSlug] = useState(initial?.slug ?? '');
  const [type, setType] = useState<ResourceKind>(initial?.type ?? initialType);
  const [summary, setSummary] = useState(initial?.summary ?? ''); const [body, setBody] = useState(initial?.bodyMarkdown ?? '');
  const [cover, setCover] = useState(initial?.coverUrl ?? ''); const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [access, setAccess] = useState<AccessMode>(initial?.access ?? 'PUBLIC');
  const [price, setPrice] = useState(((initial?.priceMinor ?? 0) / 100).toFixed(2)); const [currency, setCurrency] = useState(initial?.currency ?? 'GHS');
  const [sections, setSections] = useState<Section[]>(initial?.sections ?? []); const [items, setItems] = useState<Item[]>(initial?.items ?? []);
  const [selected, setSelected] = useState('');
  const [panel, setPanel] = useState<EditorPanel>(initial ? 'resource-content' : 'resource-basics');
  const [editorView, setEditorView] = useState<'write' | 'split' | 'preview'>('write');
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [details, setDetails] = useState<ResourceDetails>(initial?.details ?? {});
  const [slugEdited, setSlugEdited] = useState(!!initial);
  const [pickerQuery, setPickerQuery] = useState('');
  const [mediaItems, setMediaItems] = useState<(AttachedMedia & {priceText: string})[]>((initial?.media ?? []).map(item => ({...item, priceText: (item.priceMinor / 100).toFixed(2)})));
  const [mediaPicker, setMediaPicker] = useState<{filter: 'any' | 'image' | 'audio' | 'video' | 'document'; field: string} | null>(null);
  const [customizeHeadings, setCustomizeHeadings] = useState(false);
  const bodyInput = useRef<HTMLTextAreaElement>(null);
  useAdminDirty(dirty);
  const definition = resourceDefinitions[type];
  const issues = publishingIssues({type, summary, bodyMarkdown: body, details, itemCount: items.length});
  function chooseType(next: ResourceKind) {
    if (next === type) return;
    if ((Object.keys(details).length || sections.length || items.length) && !window.confirm('Changing the type clears type-specific fields and collection items. Your title and content are kept. Continue?')) return;
    setType(next); setDetails({}); setSections([]); setItems([]); setSelected(''); markDirty();
  }
  function insertMarkdown(value: string) {
    const input = bodyInput.current; const start = input?.selectionStart ?? body.length; const end = input?.selectionEnd ?? start;
    setBody(body.slice(0, start) + value + body.slice(end)); markDirty();
    requestAnimationFrame(() => {input?.focus(); input?.setSelectionRange(start + value.length, start + value.length);});
  }
  const collection = type === 'COURSE' || type === 'PATH';
  const available = choices.filter(choice => choice.id !== initial?.id && !items.some(item => item.resourceId === choice.id) && (type !== 'COURSE' || choice.type === 'LESSON') && (!pickerQuery || choice.title.toLowerCase().includes(pickerQuery.toLowerCase())));
  const markDirty = () => {setDirty(true); setNotice('');};
  const headingDefaults = {essentials: 'The essentials', body: definition.bodyLabel, details: `${definition.name} details`, media: 'Files and extras', collection: type === 'COURSE' ? 'Course lessons' : 'Build the learning journey', cover: 'Cover image', pricing: 'Access & pricing', publishing: 'Publishing', history: 'Recent changes'};
  const headingKeys = {essentials: editorHeadingKeys[0], body: editorHeadingKeys[1], details: editorHeadingKeys[2], media: editorHeadingKeys[3], collection: editorHeadingKeys[4], cover: editorHeadingKeys[5], pricing: editorHeadingKeys[6], publishing: editorHeadingKeys[7], history: editorHeadingKeys[8]};
  const sectionHeading = (name: keyof typeof headingDefaults) => typeof details[headingKeys[name]] === 'string' && String(details[headingKeys[name]]).trim() ? String(details[headingKeys[name]]) : headingDefaults[name];
  const updateSectionHeading = (name: keyof typeof headingDefaults, value: string) => {const next = {...details}; if (value.trim()) next[headingKeys[name]] = value; else delete next[headingKeys[name]]; setDetails(next); markDirty();};
  const resetSectionHeadings = () => {const next = {...details}; for (const key of editorHeadingKeys) delete next[key]; setDetails(next); markDirty();};
  const insertYouTube = () => {const url = window.prompt('Paste a YouTube video URL'); if (url?.trim()) insertMarkdown(`\n${url.trim()}\n`);};
  const insertLink = () => {const url = window.prompt('Paste an HTTPS link'); if (url?.trim()) insertMarkdown(`[link text](${url.trim()})`);};
  const rememberAsset = (asset: AttachedMedia) => setMediaItems(rows => rows.some(row => row.mediaAssetId === asset.mediaAssetId) ? rows : [...rows, {...asset, priceText: '0.00'}]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {event.preventDefault(); event.returnValue = '';};
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (initial) {
      let previous: string | null;
      try { previous = sessionStorage.getItem(`resource-editor-panel:${initial.id}`); }
      catch { return; }
      const stored = editorPanels.find(candidate => candidate.id === previous);
      if (stored && (stored.id !== 'resource-collection' || initial.type === 'COURSE' || initial.type === 'PATH')) setPanel(stored.id);
    }
  }, [initial?.id, initial?.type]);

  function openPanel(nextPanel: EditorPanel) {
    if (panel === nextPanel) return;
    setPanel(nextPanel);
    if (initial) {
      try { sessionStorage.setItem(`resource-editor-panel:${initial.id}`, nextPanel); }
      catch { /* The editor works without browser storage. */ }
    }
  }

  useEffect(() => {
    const saveOnShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== 's') return;
      event.preventDefault();
      if (!pending && !mediaPicker && !event.repeat) formRef.current?.requestSubmit();
    };
    window.addEventListener('keydown', saveOnShortcut);
    return () => window.removeEventListener('keydown', saveOnShortcut);
  }, [mediaPicker, pending]);

  function validateVisibleAndHiddenFields(form: HTMLFormElement) {
    const invalid = Array.from(form.elements).find(field =>
      (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)
      && field.willValidate && !field.validity.valid,
    ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined;
    if (!invalid) return true;
    const target = invalid.closest<HTMLElement>('[data-editor-panel]')?.dataset.editorPanel as EditorPanel | undefined;
    if (target) openPanel(target);
    requestAnimationFrame(() => invalid.reportValidity());
    return false;
  }

  const submit = () => {
    setError(''); setNotice(''); let priceMinor = 0;
    let attachments: AttachedMedia[];
    try {
      if (access === 'PAID') priceMinor = priceToMinor(price);
      attachments = mediaItems.map(item => {
        if (!/^(?:\d{1,8}(?:\.\d{1,2})?)?$/.test(item.priceText)) throw new Error(`Enter a valid price for ${item.title}.`);
        const minor = item.priceText ? Math.round(Number(item.priceText) * 100) : 0;
        if (!Number.isSafeInteger(minor) || minor < 0 || minor > 2147483647) throw new Error(`Enter a valid price for ${item.title}.`);
        return {mediaAssetId: item.mediaAssetId, title: item.title, priceMinor: minor, originalName: item.originalName, mimeType: item.mimeType, sizeBytes: item.sizeBytes};
      });
    } catch (error) {setError(error instanceof Error ? error.message : 'Invalid price.'); return;}
    startTransition(async () => {
      try {
        const result = await saveResource({id: initial?.id ?? null, version: initial?.version, updatedAt: initial?.updatedAt,
          title, slug, type, summary, bodyMarkdown: body, coverUrl: cover, tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          access, priceMinor, currency, sections, items, media: attachments.map(({mediaAssetId,title,priceMinor}) => ({mediaAssetId,title,priceMinor})), details: Object.fromEntries(Object.entries(details).map(([key, value]) => [key, Array.isArray(value) ? value.map(item => item.trim()).filter(Boolean) : value]))});
        if (!result.ok) {setError(result.error); return;}
        setDirty(false); setNotice('Resource saved.');
        if (!initial) router.replace(`/admin/resources/${result.id}`);
        router.refresh();
      } catch {setError('Could not save. Check your connection and try again.');}
    });
  };
  const publish = (action: string) => {
    if (!initial || dirty) return; setError(''); setNotice('');
    startTransition(async () => {
      try { const result = await changeResourceStatus(initial.id, initial.version, initial.updatedAt, action); if (!result.ok) setError(result.error); else router.refresh(); }
      catch {setError('Could not update publishing. Please try again.');}
    });
  };
  return <><div className={styles.root} aria-busy={pending}>
    <header className={styles.header}>
      <div className={styles.heading}>
        <Link href="/admin/resources" className={styles.breadcrumb}><ArrowLeft size={14}/>Resources</Link>
        <h1>{initial ? title || 'Edit resource' : `Create ${definition.name.toLowerCase()}`}</h1>
        <p>{initial ? `${definition.name} · Version ${initial.version}` : definition.description}</p>
      </div>
      <div className={styles.actions}>
        {initial && <span className={`admin-status admin-status-${initial.status.toLowerCase()}`}>{initial.status.toLowerCase()}</span>}
        <button type="button" className="button button-outline" aria-expanded={customizeHeadings} onClick={() => setCustomizeHeadings(value => !value)}><Settings2 size={15}/>Section names</button>
        <button type="submit" form="admin-resource-form" disabled={pending} aria-keyshortcuts="Control+S Meta+S" className="button button-dark"><Save size={15}/>{pending ? 'Saving…' : initial ? 'Save changes' : 'Save draft'}</button>
      </div>
    </header>
    {customizeHeadings && <section className="admin-heading-customizer" aria-label="Customize resource section names"><div><strong>Make the editor feel like your workflow.</strong><span>Rename these headings for this resource. You can restore the defaults any time.</span></div><div className="admin-heading-customizer-fields">{(Object.keys(headingDefaults) as (keyof typeof headingDefaults)[]).map(name => <label key={name}>{name === 'body' ? `${definition.name} content` : name === 'details' ? `${definition.name} details` : name === 'collection' ? 'Collection' : name === 'media' ? 'Attachments' : name === 'pricing' ? 'Access & price' : name === 'cover' ? 'Cover image' : name === 'publishing' ? 'Publishing' : name === 'history' ? 'Change history' : 'Basics'}<input value={sectionHeading(name)} maxLength={80} onChange={event => updateSectionHeading(name, event.target.value)}/></label>)}</div><button type="button" className="admin-text-button" onClick={resetSectionHeadings}><RotateCcw size={14}/>Use default names</button></section>}
    {error && <p role="alert" className="admin-alert">{error}</p>}
    {notice && <p role="status" className="admin-success">{notice}</p>}
    <div className={styles.workspace}>
      <nav className={styles.outline} aria-label="Resource editor sections">
        <span>Resource sections</span>
        {editorPanels.filter(item => item.id !== 'resource-collection' || collection || sections.length > 0 || items.length > 0).map(({id, label, icon: Icon}) =>
          <button type="button" key={id} aria-pressed={panel === id} aria-controls={id} onClick={() => openPanel(id)}>
            <Icon size={16}/>{label}{id === 'resource-files' && mediaItems.length > 0 && <small>{mediaItems.length}</small>}
          </button>
        )}
      </nav>
      <form ref={formRef} id="admin-resource-form" noValidate onSubmit={event => {
        event.preventDefault();
        if (!pending && validateVisibleAndHiddenFields(event.currentTarget)) submit();
      }}>
        <fieldset disabled={pending} className={styles.panels}>
          <section className="admin-panel" id="resource-basics" data-editor-panel="resource-basics" hidden={panel !== 'resource-basics'}>
            <div className="admin-panel-heading"><FileText size={18}/><h2>{sectionHeading('essentials')}</h2></div>
        <label>Resource title<input value={title} maxLength={180} required placeholder="What will someone learn or build?" onChange={event => {setTitle(event.target.value); if (!slugEdited) setSlug(slugFromTitle(event.target.value)); markDirty();}}/></label>
        <div className="admin-field-pair"><label>Resource type<SelectMenu value={type} onChange={event => {chooseType(event.target.value as ResourceKind);}}>{resourceTypes.map(value => <option key={value} value={value}>{typeNames[value]}</option>)}</SelectMenu></label><label>URL slug<input value={slug} required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="your-useful-resource" onChange={event => {setSlug(event.target.value); setSlugEdited(true); markDirty();}}/></label></div>
        <label>Short description<textarea value={summary} rows={3} maxLength={2000} placeholder="A clear reason to explore this resource." onChange={event => {setSummary(event.target.value); markDirty();}}/></label>
        <label>Topics<input value={tags} maxLength={1300} placeholder="electronics, esp32, getting started" onChange={event => {setTags(event.target.value); markDirty();}}/><small>Separate topics with commas. Up to 20.</small></label>
      </section>
      <section className="admin-panel" id="resource-content" data-editor-panel="resource-content" hidden={panel !== 'resource-content'}>
        <div className="admin-panel-heading">
          <h2>{sectionHeading('body')}</h2>
          <div className="admin-editor-tabs" role="group" aria-label="Markdown view">
            <button type="button" aria-pressed={editorView === 'write'} onClick={() => setEditorView('write')}>Write</button>
            <button type="button" aria-pressed={editorView === 'split'} onClick={() => setEditorView('split')}><Columns2 size={14}/>Split</button>
            <button type="button" aria-pressed={editorView === 'preview'} onClick={() => setEditorView('preview')}><Eye size={14}/>Preview</button>
          </div>
        </div>
        {editorView !== 'preview' && <div className="admin-writing-toolbar" role="group" aria-label="Content tools"><button type="button" onClick={() => insertMarkdown('\n## Heading\n\n')}>Heading</button><button type="button" onClick={() => insertMarkdown('\n- List item\n')}>List</button><button type="button" onClick={insertLink}><Link2 size={13}/>Link</button><button type="button" onClick={() => setMediaPicker({filter: 'image', field: 'bodyImage'})}><ImageIcon size={13}/>Image</button><button type="button" onClick={insertYouTube}><Youtube size={13}/>YouTube</button><button type="button" onClick={() => setMediaPicker({filter: 'video', field: 'bodyVideo'})}><Video size={13}/>Video file</button><button type="button" onClick={() => setMediaPicker({filter: 'audio', field: 'bodyAudio'})}><Music2 size={13}/>Audio</button><button type="button" onClick={() => insertMarkdown('\n```\nYour code here\n```\n')}>Code</button><button type="button" onClick={() => {if (!body || window.confirm('Replace the current content with a starter outline?')) {setBody(definition.template); markDirty();}}}>Use default outline</button><span>{body.trim() ? body.trim().split(/\s+/).length : 0} words</span></div>}
        <div className={`${styles.markdown} ${editorView === 'split' ? styles.split : ''}`}>
          {editorView !== 'preview' && <div className={styles.source}>
            <label htmlFor="resource-markdown">Markdown source</label>
            <textarea id="resource-markdown" ref={bodyInput} value={body} rows={18} maxLength={200000} spellCheck
              placeholder={'## Start writing\n\nShare your explanation, instructions, or lesson…'}
              onChange={event => {setBody(event.target.value); markDirty();}}/>
          </div>}
          {editorView !== 'write' && <div className={styles.preview}>
            <p className={styles.paneLabel}>Rendered preview</p>
            <div className="admin-body-preview">
              {body.trim() ? <GuideText text={body}/> : <p>Your content preview will appear here.</p>}
              <dl className="admin-preview-details">{definition.fields.filter(field => details[field.key] && (!Array.isArray(details[field.key]) || (details[field.key] as string[]).some(Boolean))).map(field => <div key={field.key}><dt>{field.label}</dt><dd>{Array.isArray(details[field.key]) ? (details[field.key] as string[]).filter(Boolean).join(' · ') : field.kind === 'url' && String(details[field.key]).startsWith('https://') ? <a href={String(details[field.key])} target="_blank" rel="noreferrer">{String(details[field.key])}</a> : String(details[field.key])}</dd></div>)}</dl>
            </div>
          </div>}
        </div>
      </section>
      <section className="admin-panel" id="resource-details" data-editor-panel="resource-details" hidden={panel !== 'resource-details'}><div className="admin-panel-heading"><h2>{sectionHeading('details')}</h2></div><p className="admin-help">{definition.description}</p><div className="admin-detail-fields">{definition.fields.map(field => <label key={`${type}-${field.key}`}>{field.label}{field.kind === 'list' ? <textarea rows={3} value={Array.isArray(details[field.key]) ? (details[field.key] as string[]).join('\n') : ''} onChange={event => {setDetails({...details, [field.key]: event.target.value.split('\n')}); markDirty();}}/> : field.kind === 'select' ? <SelectMenu value={String(details[field.key] ?? '')} onChange={event => {setDetails({...details, [field.key]: event.target.value}); markDirty();}}><option value="">Choose…</option>{field.options?.map(option => <option key={option}>{option}</option>)}</SelectMenu> : <><input type={field.kind === 'number' ? 'number' : 'text'} inputMode={field.kind === 'url' ? 'url' : undefined} min={field.kind === 'number' ? 1 : undefined} max={field.max} maxLength={field.kind === 'url' ? 2048 : 1000} placeholder={field.key === 'audioUrl' || field.key === 'videoUrl' ? 'Paste an HTTPS URL or choose from your library' : undefined} value={details[field.key] as string | number ?? ''} onChange={event => {setDetails({...details, [field.key]: field.kind === 'number' && event.target.value ? Number(event.target.value) : event.target.value}); markDirty();}}/>{field.key === 'audioUrl' && <button type="button" className="media-browse-button" onClick={() => setMediaPicker({filter: 'audio', field: 'audioUrl'})}><Music2 size={15}/>Choose audio from library</button>}{field.key === 'videoUrl' && <button type="button" className="media-browse-button" onClick={() => setMediaPicker({filter: 'video', field: 'videoUrl'})}><Video size={15}/>Choose video from library</button>}{['audioUrl','videoUrl'].includes(field.key) && typeof details[field.key] === 'string' && String(details[field.key]).startsWith('media://') && <small>Library file: {mediaItems.find(item => item.mediaAssetId === String(details[field.key]).slice(8))?.title ?? 'Attached media'} · choose a replacement or clear the URL to remove.</small>}</>}{field.help && <small>{field.help}</small>}</label>)}</div></section>
      <section className="admin-panel" id="resource-files" data-editor-panel="resource-files" hidden={panel !== 'resource-files'}><div className="admin-panel-heading"><h2>{sectionHeading('media')}</h2><button type="button" className="button button-outline" onClick={() => setMediaPicker({filter: 'any', field: 'attachment'})}><Plus size={14}/>Add file</button></div><p className="admin-help">Attach PDFs, Word files, images, audio, video and other learning materials. {access === 'PAID' ? 'Every file is included in the resource bundle price.' : 'A zero price makes a file free; set a price to sell it individually.'}</p>
        {mediaItems.length ? <div className="resource-media-editor">{mediaItems.map((item,index) => <div className="resource-media-editor-row" key={item.mediaAssetId}><span className="resource-media-type">{item.mimeType.startsWith('image/')?'IMG':item.mimeType.startsWith('audio/')?'AUD':item.mimeType.startsWith('video/')?'VID':'DOC'}</span><div className="resource-media-editor-main"><label>Display title<input value={item.title} maxLength={180} onChange={event => {setMediaItems(rows => rows.map((row,at) => at===index?{...row,title:event.target.value}:row));markDirty();}}/></label><small><Link href={`/admin/files/${item.mediaAssetId}`}>Open {item.originalName}</Link> · {(item.sizeBytes/1024/1024).toFixed(1)} MB</small></div>{access !== 'PAID' && <label className="resource-media-price">Individual price ({currency})<input inputMode="decimal" value={item.priceText} placeholder="0.00" onChange={event => {setMediaItems(rows => rows.map((row,at) => at===index?{...row,priceText:event.target.value}:row));markDirty();}}/><small>Set 0.00 for free</small></label>}<button type="button" className="admin-icon-button" aria-label={`Remove ${item.title}`} onClick={() => {setMediaItems(rows => rows.filter((_,at)=>at!==index));markDirty();}}><Trash2 size={15}/></button></div>)}</div> : <div className="resource-media-empty"><FileText size={22}/><span>No files attached yet. Add downloads, readings, audio or video for this resource.</span></div>}
      </section>
      {(collection || sections.length > 0 || items.length > 0) && <section className="admin-panel" id="resource-collection" data-editor-panel="resource-collection" hidden={panel !== 'resource-collection'}><div className="admin-panel-heading"><h2>{sectionHeading('collection')}</h2><span>{items.length} {items.length === 1 ? 'item' : 'items'}</span></div><p className="admin-help">{type === 'COURSE' ? 'Arrange existing lessons into a course.' : 'Combine existing resources into an ordered path.'} Shared resources stay in sync when edited. A public collection does not unlock paid items.</p>
        {!collection && <p className="admin-alert">Remove all items and sections before saving this resource as a non-collection type.</p>}
        <div className="admin-section-list"><h3>Sections <small>optional</small></h3>{sections.map((section, index) => <div className="admin-section-row" key={section.key}><label className="sr-only" htmlFor={`section-${section.key}`}>Section {index + 1} title</label><input id={`section-${section.key}`} value={section.title} required maxLength={180} placeholder="Section title" onChange={event => {setSections(sections.map(value => value.key === section.key ? {...value, title: event.target.value} : value)); markDirty();}}/><button type="button" className="admin-icon-button" disabled={index === 0} aria-label={`Move section ${index + 1} up`} onClick={() => {setSections(moveItem(sections, index, -1)); markDirty();}}><ArrowUp size={14}/></button><button type="button" className="admin-icon-button" disabled={index === sections.length - 1} aria-label={`Move section ${index + 1} down`} onClick={() => {setSections(moveItem(sections, index, 1)); markDirty();}}><ArrowDown size={14}/></button><button type="button" className="admin-icon-button" aria-label={`Remove section ${index + 1}`} onClick={() => {setSections(sections.filter(value => value.key !== section.key)); setItems(items.map(item => item.sectionKey === section.key ? {...item, sectionKey: null} : item)); markDirty();}}><Trash2 size={14}/></button></div>)}<button type="button" className="admin-text-button" disabled={sections.length >= 40 || !collection} onClick={() => {setSections([...sections, {key: crypto.randomUUID(), title: ''}]); markDirty();}}><Plus size={14}/>Add a section</button></div>
        <ol className="admin-item-list">{items.map((item, index) => {const choice = choices.find(value => value.id === item.resourceId); return <li key={item.resourceId}><div className="admin-item-title"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{choice?.title ?? 'Included resource'}</strong><small>{choice ? `${typeNames[choice.type]} · ${choice.status.toLowerCase()}` : item.resourceId}</small></div></div><div className="admin-item-controls"><label><span className="sr-only">Section for item {index + 1}</span><SelectMenu value={item.sectionKey ?? ''} onChange={event => {setItems(items.map((value, at) => at === index ? {...value, sectionKey: event.target.value || null} : value)); markDirty();}}><option value="">No section</option>{sections.map(section => <option key={section.key} value={section.key}>{section.title || 'Untitled section'}</option>)}</SelectMenu></label><button type="button" className="admin-icon-button" disabled={index === 0} aria-label={`Move item ${index + 1} up`} onClick={() => {setItems(moveItem(items, index, -1)); markDirty();}}><ArrowUp size={14}/></button><button type="button" className="admin-icon-button" disabled={index === items.length - 1} aria-label={`Move item ${index + 1} down`} onClick={() => {setItems(moveItem(items, index, 1)); markDirty();}}><ArrowDown size={14}/></button><button type="button" className="admin-icon-button" aria-label={`Remove item ${index + 1}`} onClick={() => {setItems(items.filter((_, at) => at !== index)); markDirty();}}><Trash2 size={14}/></button></div></li>;})}</ol>
        <div className="admin-library-actions"><Link href={`/admin/resources/new?type=${type === 'COURSE' ? 'LESSON' : 'ARTICLE'}`} target="_blank" rel="noopener noreferrer" className="admin-text-button">Create {type === 'COURSE' ? 'lesson' : 'resource'} in a new tab</Link><button type="button" className="admin-text-button" onClick={() => startTransition(async () => {try {const result = await refreshResourceChoices(); if (result.ok) {setChoices(result.choices); setSelected(''); setNotice('Resource library refreshed.');} else setError(result.error);} catch {setError('Could not refresh the library. Please try again.');}})}>Refresh library</button></div><label>Find a resource<input type="search" placeholder="Search existing resources…" value={pickerQuery} onChange={event => {setPickerQuery(event.target.value); setSelected('');}}/></label><div className="admin-add-item"><label><span className="sr-only">Resource to add</span><SelectMenu value={selected} onChange={event => setSelected(event.target.value)} disabled={!collection}><option value="">Choose {type === 'COURSE' ? 'a lesson' : 'a resource'}…</option>{available.map(choice => <option key={choice.id} value={choice.id}>{choice.title} · {typeNames[choice.type]} · {choice.status.toLowerCase()}</option>)}</SelectMenu></label><button type="button" className="button button-outline" disabled={!selected || items.length >= 200 || !collection} onClick={() => {setItems([...items, {resourceId: selected, sectionKey: null}]); setSelected(''); markDirty();}}><Plus size={15}/>Add</button></div><p className="admin-help">{available.length === 0 ? 'No additional matches. Create another resource or refresh your library. ' : ''}The list order is the learning sequence; sections provide grouping. The picker shows up to 500 resources.</p>
      </section>}
      <div id="resource-settings" className={styles.settings} data-editor-panel="resource-settings" hidden={panel !== 'resource-settings'}><section className="admin-panel"><h2>{sectionHeading('cover')}</h2>{cover && <img className="admin-cover-preview" src={cover.replace('/api/public-media/', '/api/media/')} alt="Resource cover preview" referrerPolicy="no-referrer" onError={event => {event.currentTarget.style.display = 'none';}} key={cover}/>}<label>Image URL<input type="text" value={cover} maxLength={2048} placeholder="https://…" onChange={event => {setCover(event.target.value); markDirty();}}/><small>Use a public HTTPS URL or select an image from the private media library.</small></label><button type="button" className="media-browse-button" onClick={() => setMediaPicker({filter: 'image', field: 'cover'})}>Browse image library</button><p className="admin-help">Choose a clear image that represents your resource.</p></section>
      <section className="admin-panel"><h2>{sectionHeading('pricing')}</h2><label>Who can open it?<SelectMenu value={access} onChange={event => {setAccess(event.target.value as AccessMode); markDirty();}}><option value="PUBLIC">Public — no sign-in</option><option value="FREE_ACCOUNT">Free account</option><option value="PAID">Paid resource</option></SelectMenu></label>{access === 'PAID' && <div className="admin-field-pair"><label>Bundle price<input inputMode="decimal" value={price} required maxLength={11} onChange={event => {setPrice(event.target.value); markDirty();}}/></label><label>Currency<input value={currency} required maxLength={3} pattern="[A-Z]{3}" onChange={event => {setCurrency(event.target.value.toUpperCase()); markDirty();}}/></label></div>}<p className="admin-help">A paid resource price unlocks its content and every attached file as one bundle. Free resources can offer attached files for free or as individual purchases. Paystack handles checkout; learner purchases appear in their account.</p></section>
      </div>
      <section className="admin-panel" id="resource-publishing" data-editor-panel="resource-publishing" hidden={panel !== 'resource-publishing'}><h2>{sectionHeading('publishing')}</h2><div className="admin-readiness"><strong>{issues.length ? 'Before you publish' : 'Ready to publish'}</strong>{issues.length ? <ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p>The required content is in place. Preview and save your changes.</p>}</div>{initial ? <><p className="admin-help">{dirty ? 'Save changes before updating publishing.' : initial.status === 'PUBLISHED' ? 'This resource is published. Saving changes updates the published content immediately.' : 'Preview your content, then publish when it is ready.'}</p><div className="admin-publishing-actions">{initial.status !== 'PUBLISHED' ? <button type="button" className="button button-dark" disabled={pending || dirty || issues.length > 0} onClick={() => publish('PUBLISH')}>Publish resource</button> : <button type="button" className="button button-outline" disabled={pending || dirty} onClick={() => publish('UNPUBLISH')}>Return to draft</button>}{initial.status !== 'ARCHIVED' && <button type="button" className="admin-text-button" disabled={pending || dirty} onClick={() => publish('ARCHIVE')}>Archive resource</button>}</div></> : <p className="admin-help">New resources start as drafts. Save first, then publish from the editor.</p>}</section>
      {initial?.history.length ? <section className={`admin-panel ${styles.history}`} hidden={panel !== 'resource-publishing'}><h2>{sectionHeading('history')}</h2><ul className="admin-history">{initial.history.map(event => <li key={event.version}><strong>{event.action.toLowerCase()} · v{event.version}</strong><span>{event.name}</span><time dateTime={event.createdAt}>{new Date(event.createdAt).toISOString().slice(0, 16).replace('T', ' ')} UTC</time></li>)}</ul><p className="admin-help">Saved snapshots are kept in the audit history.</p></section> : null}
        </fieldset>
        <footer className={styles.status}>
          <span aria-live="polite">{dirty ? 'Unsaved changes' : initial ? 'All changes saved' : 'New draft'}</span>
          <span>{panel === 'resource-content' && editorView !== 'preview' ? `${body ? body.split('\n').length : 1} lines · Markdown` : definition.name}</span>
        </footer>
      </form>
    </div>
    </div><MediaLibraryModal open={!!mediaPicker} filter={mediaPicker?.filter ?? 'any'} onClose={() => setMediaPicker(null)} onSelect={(_url, asset) => {const field = mediaPicker?.field; const selectedMedia = {mediaAssetId: asset.id, title: asset.originalName, priceMinor: 0, originalName: asset.originalName, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes}; const safeLabel = asset.originalName.replace(/[\r\n\]]/g, ' ').replace(/\s+/g, ' ').trim(); if (field === 'cover') setCover(`/api/public-media/${asset.id}`); else {rememberAsset(selectedMedia); if (field === 'audioUrl' || field === 'videoUrl') setDetails(value => ({...value, [field]: `media://${asset.id}`})); else if (field === 'bodyImage') insertMarkdown(`![${safeLabel}](media://${asset.id})`); else if (field === 'bodyVideo') insertMarkdown(`![video: ${safeLabel}](media://${asset.id})`); else if (field === 'bodyAudio') insertMarkdown(`![audio: ${safeLabel}](media://${asset.id})`);} if (field !== 'cover') markDirty(); setMediaPicker(null);}}/></>;
}
