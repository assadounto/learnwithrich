'use client';
import Link from '@/components/navigation-link';
import {useEffect, useRef, useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowLeft, ArrowDown, ArrowUp, Plus, Trash2, Eye, FileText, Save} from 'lucide-react';
import {GuideText} from '@/components/guide-text';
import {saveResource, changeResourceStatus, refreshResourceChoices} from '@/app/admin/actions';
import {resourceTypes, type ResourceKind, type AccessMode} from '@/lib/server/resources/validation';
import {resourceDefinitions, slugFromTitle, publishingIssues, type ResourceDetails} from '@/lib/resource-types';
import {useAdminDirty} from './workspace-shell';
import {moveItem, priceToMinor} from '@/lib/resource-editor';

type Section = {key: string; title: string};
type Item = {resourceId: string; sectionKey: string | null};
type Choice = {id: string; title: string; type: string; status: string};
type Initial = {
  id: string; version: number; updatedAt: string; status: string; title: string; slug: string; type: ResourceKind;
  summary: string; coverUrl: string; access: AccessMode; priceMinor: number; currency: string;
  details: ResourceDetails; bodyMarkdown: string; tags: string[]; sections: Section[]; items: Item[];
  history: {action: string; version: number; createdAt: string; name: string}[];
};
const typeNames: Record<string, string> = {PROJECT: 'Project', ARTICLE: 'Article', COURSE: 'Course', PATH: 'Learning path', LESSON: 'Lesson', DOWNLOAD: 'Download', BOOK: 'Book', GUIDE: 'Guide', ILLUSTRATION: 'Illustration'};
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
  const [selected, setSelected] = useState(''); const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [details, setDetails] = useState<ResourceDetails>(initial?.details ?? {});
  const [slugEdited, setSlugEdited] = useState(!!initial);
  const [pickerQuery, setPickerQuery] = useState('');
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
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {event.preventDefault(); event.returnValue = '';};
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const submit = () => {
    setError(''); setNotice(''); let priceMinor = 0;
    try { if (access === 'PAID') priceMinor = priceToMinor(price); } catch (error) {setError(error instanceof Error ? error.message : 'Invalid price.'); return;}
    startTransition(async () => {
      try {
        const result = await saveResource({id: initial?.id ?? null, version: initial?.version, updatedAt: initial?.updatedAt,
          title, slug, type, summary, bodyMarkdown: body, coverUrl: cover, tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          access, priceMinor, currency, sections, items, details: Object.fromEntries(Object.entries(details).map(([key, value]) => [key, Array.isArray(value) ? value.map(item => item.trim()).filter(Boolean) : value]))});
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
  return <div aria-busy={pending}>
    <Link href="/admin" className="admin-back"><ArrowLeft size={15}/>All resources</Link>
    <header className="admin-editor-heading"><div><span className="admin-kicker">{initial ? 'SHAPE YOUR RESOURCE' : 'START WITH AN IDEA'}</span><h1>{initial ? title || 'Edit resource' : `Create ${definition.name.toLowerCase()}`}</h1><p>{initial ? `Version ${initial.version} · ${typeNames[type]} · ${dirty ? 'Unsaved changes' : 'All changes saved'}` : definition.description}</p></div><div className="admin-editor-actions">{initial && <span className={`admin-status admin-status-${initial.status.toLowerCase()}`}>{initial.status.toLowerCase()}</span>}<button type="submit" form="admin-resource-form" disabled={pending} className="button button-dark"><Save size={15}/>{pending ? 'Working…' : initial ? 'Save changes' : 'Save draft'}</button></div></header>
    {!initial && <div className="admin-type-picker" role="group" aria-label="Choose resource type">{resourceTypes.map(kind => <button key={kind} type="button" disabled={pending} aria-pressed={type === kind} onClick={() => chooseType(kind)}><strong>{resourceDefinitions[kind].name}</strong><span>{resourceDefinitions[kind].description}</span></button>)}</div>}
    {error && <p role="alert" className="admin-alert">{error}</p>}{notice && <p role="status" className="admin-success">{notice}</p>}
    <form id="admin-resource-form" onSubmit={event => {event.preventDefault(); submit();}}><fieldset disabled={pending} className="admin-editor-grid">
      <div className="admin-editor-main"><section className="admin-panel"><div className="admin-panel-heading"><FileText size={18}/><h2>The essentials</h2></div>
        <label>Resource title<input value={title} maxLength={180} required placeholder="What will someone learn or build?" onChange={event => {setTitle(event.target.value); if (!slugEdited) setSlug(slugFromTitle(event.target.value)); markDirty();}}/></label>
        <div className="admin-field-pair"><label>Resource type<select value={type} onChange={event => {chooseType(event.target.value as ResourceKind);}}>{resourceTypes.map(value => <option key={value} value={value}>{typeNames[value]}</option>)}</select></label><label>URL slug<input value={slug} required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="your-useful-resource" onChange={event => {setSlug(event.target.value); setSlugEdited(true); markDirty();}}/></label></div>
        <label>Short description<textarea value={summary} rows={3} maxLength={2000} placeholder="A clear reason to explore this resource." onChange={event => {setSummary(event.target.value); markDirty();}}/></label>
        <label>Topics<input value={tags} maxLength={1300} placeholder="electronics, esp32, getting started" onChange={event => {setTags(event.target.value); markDirty();}}/><small>Separate topics with commas. Up to 20.</small></label>
      </section>
      <section className="admin-panel"><div className="admin-panel-heading"><h2>{definition.bodyLabel}</h2><div className="admin-editor-tabs" role="group" aria-label="Editor view"><button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button><button type="button" aria-pressed={preview} onClick={() => setPreview(true)}><Eye size={13}/>Preview</button></div></div>
        {!preview && <div className="admin-writing-toolbar" role="group" aria-label="Content tools"><button type="button" onClick={() => insertMarkdown('\n## Heading\n\n')}>Heading</button><button type="button" onClick={() => insertMarkdown('\n- List item\n')}>List</button><button type="button" onClick={() => insertMarkdown('\n```\nYour code here\n```\n')}>Code block</button><button type="button" onClick={() => {if (!body || window.confirm('Replace the current content with a starter outline?')) {setBody(definition.template); markDirty();}}}>Use {definition.name.toLowerCase()} outline</button><span>{body.trim() ? body.trim().split(/\s+/).length : 0} words</span></div>}
        {preview ? <div className="admin-body-preview">{body ? <GuideText text={body}/> : <p>Your content preview will appear here.</p>}<dl className="admin-preview-details">{definition.fields.filter(field => details[field.key] && (!Array.isArray(details[field.key]) || (details[field.key] as string[]).some(Boolean))).map(field => <div key={field.key}><dt>{field.label}</dt><dd>{Array.isArray(details[field.key]) ? (details[field.key] as string[]).filter(Boolean).join(' · ') : field.kind === 'url' && String(details[field.key]).startsWith('https://') ? <a href={String(details[field.key])} target="_blank" rel="noreferrer">{String(details[field.key])}</a> : String(details[field.key])}</dd></div>)}</dl></div> : <label className="admin-body-label">Content<textarea ref={bodyInput} value={body} rows={18} maxLength={200000} spellCheck placeholder={'## A good starting point\n\nShare your explanation, instructions, or lesson…'} onChange={event => {setBody(event.target.value); markDirty();}}/><small>Use Markdown headings, lists, and fenced code. HTML is displayed as text.</small></label>}
      </section>
      <section className="admin-panel"><div className="admin-panel-heading"><h2>{definition.name} details</h2></div><p className="admin-help">{definition.description}</p><div className="admin-detail-fields">{definition.fields.map(field => <label key={`${type}-${field.key}`}>{field.label}{field.kind === 'list' ? <textarea rows={3} value={Array.isArray(details[field.key]) ? (details[field.key] as string[]).join('\n') : ''} onChange={event => {setDetails({...details, [field.key]: event.target.value.split('\n')}); markDirty();}}/> : field.kind === 'select' ? <select value={String(details[field.key] ?? '')} onChange={event => {setDetails({...details, [field.key]: event.target.value}); markDirty();}}><option value="">Choose…</option>{field.options?.map(option => <option key={option}>{option}</option>)}</select> : <input type={field.kind === 'url' ? 'url' : field.kind === 'number' ? 'number' : 'text'} min={field.kind === 'number' ? 1 : undefined} max={field.max} maxLength={field.kind === 'url' ? 2048 : 1000} value={details[field.key] as string | number ?? ''} onChange={event => {setDetails({...details, [field.key]: field.kind === 'number' && event.target.value ? Number(event.target.value) : event.target.value}); markDirty();}}/>}{field.help && <small>{field.help}</small>}</label>)}</div></section>
      {(collection || sections.length > 0 || items.length > 0) && <section className="admin-panel"><div className="admin-panel-heading"><h2>{type === 'COURSE' ? 'Course lessons' : 'Build the learning journey'}</h2><span>{items.length} {items.length === 1 ? 'item' : 'items'}</span></div><p className="admin-help">{type === 'COURSE' ? 'Arrange existing lessons into a course.' : 'Combine existing resources into an ordered path.'} Shared resources stay in sync when edited. A public collection does not unlock paid items.</p>
        {!collection && <p className="admin-alert">Remove all items and sections before saving this resource as a non-collection type.</p>}
        <div className="admin-section-list"><h3>Sections <small>optional</small></h3>{sections.map((section, index) => <div className="admin-section-row" key={section.key}><label className="sr-only" htmlFor={`section-${section.key}`}>Section {index + 1} title</label><input id={`section-${section.key}`} value={section.title} required maxLength={180} placeholder="Section title" onChange={event => {setSections(sections.map(value => value.key === section.key ? {...value, title: event.target.value} : value)); markDirty();}}/><button type="button" className="admin-icon-button" disabled={index === 0} aria-label={`Move section ${index + 1} up`} onClick={() => {setSections(moveItem(sections, index, -1)); markDirty();}}><ArrowUp size={14}/></button><button type="button" className="admin-icon-button" disabled={index === sections.length - 1} aria-label={`Move section ${index + 1} down`} onClick={() => {setSections(moveItem(sections, index, 1)); markDirty();}}><ArrowDown size={14}/></button><button type="button" className="admin-icon-button" aria-label={`Remove section ${index + 1}`} onClick={() => {setSections(sections.filter(value => value.key !== section.key)); setItems(items.map(item => item.sectionKey === section.key ? {...item, sectionKey: null} : item)); markDirty();}}><Trash2 size={14}/></button></div>)}<button type="button" className="admin-text-button" disabled={sections.length >= 40 || !collection} onClick={() => {setSections([...sections, {key: crypto.randomUUID(), title: ''}]); markDirty();}}><Plus size={14}/>Add a section</button></div>
        <ol className="admin-item-list">{items.map((item, index) => {const choice = choices.find(value => value.id === item.resourceId); return <li key={item.resourceId}><div className="admin-item-title"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{choice?.title ?? 'Included resource'}</strong><small>{choice ? `${typeNames[choice.type]} · ${choice.status.toLowerCase()}` : item.resourceId}</small></div></div><div className="admin-item-controls"><label><span className="sr-only">Section for item {index + 1}</span><select value={item.sectionKey ?? ''} onChange={event => {setItems(items.map((value, at) => at === index ? {...value, sectionKey: event.target.value || null} : value)); markDirty();}}><option value="">No section</option>{sections.map(section => <option key={section.key} value={section.key}>{section.title || 'Untitled section'}</option>)}</select></label><button type="button" className="admin-icon-button" disabled={index === 0} aria-label={`Move item ${index + 1} up`} onClick={() => {setItems(moveItem(items, index, -1)); markDirty();}}><ArrowUp size={14}/></button><button type="button" className="admin-icon-button" disabled={index === items.length - 1} aria-label={`Move item ${index + 1} down`} onClick={() => {setItems(moveItem(items, index, 1)); markDirty();}}><ArrowDown size={14}/></button><button type="button" className="admin-icon-button" aria-label={`Remove item ${index + 1}`} onClick={() => {setItems(items.filter((_, at) => at !== index)); markDirty();}}><Trash2 size={14}/></button></div></li>;})}</ol>
        <div className="admin-library-actions"><Link href={`/admin/resources/new?type=${type === 'COURSE' ? 'LESSON' : 'ARTICLE'}`} target="_blank" rel="noopener noreferrer" className="admin-text-button">Create {type === 'COURSE' ? 'lesson' : 'resource'} in a new tab</Link><button type="button" className="admin-text-button" onClick={() => startTransition(async () => {try {const result = await refreshResourceChoices(); if (result.ok) {setChoices(result.choices); setSelected(''); setNotice('Resource library refreshed.');} else setError(result.error);} catch {setError('Could not refresh the library. Please try again.');}})}>Refresh library</button></div><label>Find a resource<input type="search" placeholder="Search existing resources…" value={pickerQuery} onChange={event => {setPickerQuery(event.target.value); setSelected('');}}/></label><div className="admin-add-item"><label><span className="sr-only">Resource to add</span><select value={selected} onChange={event => setSelected(event.target.value)} disabled={!collection}><option value="">Choose {type === 'COURSE' ? 'a lesson' : 'a resource'}…</option>{available.map(choice => <option key={choice.id} value={choice.id}>{choice.title} · {typeNames[choice.type]} · {choice.status.toLowerCase()}</option>)}</select></label><button type="button" className="button button-outline" disabled={!selected || items.length >= 200 || !collection} onClick={() => {setItems([...items, {resourceId: selected, sectionKey: null}]); setSelected(''); markDirty();}}><Plus size={15}/>Add</button></div><p className="admin-help">{available.length === 0 ? 'No additional matches. Create another resource or refresh your library. ' : ''}The list order is the learning sequence; sections provide grouping. The picker shows up to 500 resources.</p>
      </section>}
      </div><aside className="admin-editor-aside"><section className="admin-panel"><h2>Cover image</h2>{cover.startsWith('https://') && <img className="admin-cover-preview" src={cover} alt="Resource cover preview" referrerPolicy="no-referrer" onError={event => {event.currentTarget.style.display = 'none';}} key={cover}/>}<label>Image URL<input type="url" value={cover} maxLength={2048} placeholder="https://…" onChange={event => {setCover(event.target.value); markDirty();}}/><small>Use a public HTTPS image URL.</small></label><p className="admin-help">Choose a clear hosted image that represents your resource.</p></section>
      <section className="admin-panel"><h2>Access & pricing</h2><label>Who can open it?<select value={access} onChange={event => {setAccess(event.target.value as AccessMode); markDirty();}}><option value="PUBLIC">Public — no sign-in</option><option value="FREE_ACCOUNT">Free account</option><option value="PAID">Paid resource</option></select></label>{access === 'PAID' && <div className="admin-field-pair"><label>Price<input inputMode="decimal" value={price} required maxLength={11} onChange={event => {setPrice(event.target.value); markDirty();}}/></label><label>Currency<input value={currency} required maxLength={3} pattern="[A-Z]{3}" onChange={event => {setCurrency(event.target.value.toUpperCase()); markDirty();}}/></label></div>}<p className="admin-help">Paid and account-only content stays private in the public catalog. Checkout and learner access are not enabled yet.</p></section>
      <section className="admin-panel"><h2>Publishing</h2><div className="admin-readiness"><strong>{issues.length ? 'Before you publish' : 'Ready to publish'}</strong>{issues.length ? <ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p>The required content is in place. Preview and save your changes.</p>}</div>{initial ? <><p className="admin-help">{dirty ? 'Save changes before updating publishing.' : initial.status === 'PUBLISHED' ? 'This resource is published. Saving changes updates the published content immediately.' : 'Preview your content, then publish when it is ready.'}</p><div className="admin-publishing-actions">{initial.status !== 'PUBLISHED' ? <button type="button" className="button button-dark" disabled={pending || dirty || issues.length > 0} onClick={() => publish('PUBLISH')}>Publish resource</button> : <button type="button" className="button button-outline" disabled={pending || dirty} onClick={() => publish('UNPUBLISH')}>Return to draft</button>}{initial.status !== 'ARCHIVED' && <button type="button" className="admin-text-button" disabled={pending || dirty} onClick={() => publish('ARCHIVE')}>Archive resource</button>}</div></> : <p className="admin-help">New resources start as drafts. Save first, then publish from the editor.</p>}</section>
      {initial?.history.length ? <section className="admin-panel"><h2>Recent changes</h2><ul className="admin-history">{initial.history.map(event => <li key={event.version}><strong>{event.action.toLowerCase()} · v{event.version}</strong><span>{event.name}</span><time dateTime={event.createdAt}>{new Date(event.createdAt).toISOString().slice(0, 16).replace('T', ' ')} UTC</time></li>)}</ul><p className="admin-help">Saved snapshots are kept in the audit history.</p></section> : null}
      </aside></fieldset><div className="admin-editor-bottom-actions"><span>{dirty ? 'You have unsaved changes.' : initial ? 'Your resource is up to date.' : 'Save your first draft to keep working.'}</span><button type="submit" className="button button-dark" disabled={pending}><Save size={15}/>{pending ? 'Working…' : initial ? 'Save changes' : 'Save draft'}</button></div></form>
  </div>;
}
