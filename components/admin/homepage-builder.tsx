'use client';
import {SelectMenu} from '@/components/selection-dialog';
import {useState, useTransition} from 'react';
import {ArrowDown, ArrowUp, Eye, Plus, Save, Trash2} from 'lucide-react';
import {resourceDefinitions} from '@/lib/resource-types';
import {resourceTypes, type ResourceKind} from '@/lib/server/resources/validation';
import {saveHomepage} from '@/app/admin/actions';
import {useAdminDirty} from './workspace-shell';

type Choice = {id: string; title: string; type: ResourceKind; coverUrl: string | null; summary: string};
type Section = {id: string; eyebrow: string; title: string; description: string; type: ResourceKind | 'ALL'; source: 'AUTO' | 'SELECTED'; resourceIds: string[]; limit: number};
const defaults = (): Section => ({id: `section-${Math.random().toString(36).slice(2, 8)}`, eyebrow: 'LEARNWITHRICH', title: 'A good place to begin', description: '', type: 'ALL', source: 'AUTO', resourceIds: [], limit: 6});
const labels: Record<string, string> = {PROJECT: 'Projects', ARTICLE: 'Articles', COURSE: 'Courses', PATH: 'Learning paths', LESSON: 'Lessons', DOWNLOAD: 'Downloads', BOOK: 'Books', GUIDE: 'Guides', ILLUSTRATION: 'Illustrations'};

export function HomepageBuilder({initialSections, choices}: {initialSections: Section[]; choices: Choice[]}) {
  const [sections, setSections] = useState(initialSections), [baseline, setBaseline] = useState(JSON.stringify(initialSections)), [message, setMessage] = useState(''), [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(sections) !== baseline;
  useAdminDirty(dirty);
  function update(index: number, patch: Partial<Section>) {setSections(current => current.map((section, i) => i === index ? {...section, ...patch} : section)); setMessage('');}
  function move(index: number, offset: number) {setSections(current => {const next = [...current]; const target = index + offset; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next;});}
  function save() {startTransition(async () => {const result = await saveHomepage(sections); setMessage(result.ok ? 'Homepage saved. Your public homepage now uses these sections.' : result.error); if (result.ok) {setSections(result.sections as Section[]); setBaseline(JSON.stringify(result.sections));}});}
  return <div className="homepage-builder">
    <div className="homepage-builder-toolbar"><div><strong>{sections.length} of 12 sections</strong><span>Changes appear on the homepage after you save.</span></div><div><a href="/" target="_blank" rel="noreferrer" className="button button-outline"><Eye size={16}/>Preview homepage</a><button className="button button-dark" onClick={save} disabled={pending}><Save size={16}/>{pending ? 'Saving…' : 'Save homepage'}</button></div></div>
    {message && <p className={`homepage-save-message${message.startsWith('Homepage saved') ? ' success' : ''}`} role="status">{message}</p>}
    {!sections.length && <div className="admin-empty"><h2>Your homepage is ready for its first section.</h2><p>Add a section, choose a resource type, and publish it when you’re ready.</p></div>}
    <div className="homepage-section-list">{sections.map((section, index) => {
      const candidates = choices.filter(choice => section.type === 'ALL' || choice.type === section.type);
      const selected = new Set(section.resourceIds);
      return <section className="homepage-section-editor" key={section.id}>
        <div className="homepage-section-order"><span>{String(index + 1).padStart(2, '0')}</span><div><button type="button" aria-label={`Move section ${index + 1} up`} onClick={() => move(index, -1)} disabled={!index}><ArrowUp size={16}/></button><button type="button" aria-label={`Move section ${index + 1} down`} onClick={() => move(index, 1)} disabled={index === sections.length - 1}><ArrowDown size={16}/></button></div><button type="button" className="homepage-delete" aria-label={`Remove section ${index + 1}`} onClick={() => setSections(current => current.filter((_, i) => i !== index))}><Trash2 size={17}/></button></div>
        <div className="homepage-section-fields">
          <div className="admin-field-pair"><label>Section label<input maxLength={80} value={section.eyebrow} onChange={e => update(index, {eyebrow: e.target.value})} placeholder="For example, START HERE"/></label><label>Section heading<input maxLength={120} required value={section.title} onChange={e => update(index, {title: e.target.value})}/></label></div>
          <label>Short introduction<textarea rows={2} maxLength={400} value={section.description} onChange={e => update(index, {description: e.target.value})} placeholder="Optional context for this collection"/></label>
          <div className="homepage-config-row"><label>Resource type<SelectMenu value={section.type} onChange={e => update(index, {type: e.target.value as Section['type'], resourceIds: []})}><option value="ALL">All resource types</option>{resourceTypes.map(type => <option key={type} value={type}>{resourceDefinitions[type].plural}</option>)}</SelectMenu></label><label>Content source<SelectMenu value={section.source} onChange={e => update(index, {source: e.target.value as Section['source']})}><option value="AUTO">Automatic — newest published</option><option value="SELECTED">Choose resources</option></SelectMenu></label><label>Show<SelectMenu value={section.limit} onChange={e => update(index, {limit: Number(e.target.value)})}>{[3, 4, 6, 8, 9, 12].map(value => <option key={value} value={value}>{value} resources</option>)}</SelectMenu></label></div>
          {section.source === 'SELECTED' && <div className="homepage-choice-panel"><div><strong>Choose resources</strong><span>{selected.size} selected · {candidates.length} published options</span></div>{candidates.length ? <div className="homepage-choice-list">{candidates.map(choice => <label key={choice.id}><input type="checkbox" checked={selected.has(choice.id)} disabled={!selected.has(choice.id) && selected.size >= 24} onChange={() => update(index, {resourceIds: selected.has(choice.id) ? section.resourceIds.filter(id => id !== choice.id) : [...section.resourceIds, choice.id]})}/><span><strong>{choice.title}</strong><small>{labels[choice.type]}</small></span></label>)}</div> : <p>No published resources of this type yet. Drafts stay out of the public homepage.</p>}</div>}
        </div>
      </section>;
    })}</div>
    <button type="button" className="homepage-add-section" onClick={() => setSections(current => current.length < 12 ? [...current, defaults()] : current)} disabled={sections.length >= 12}><Plus size={18}/>Add homepage section</button>
    <div className="homepage-builder-bottom"><span>Automatic sections update as you publish resources. Selected sections only show chosen, published items.</span><button className="button button-dark" onClick={save} disabled={pending}><Save size={16}/>{pending ? 'Saving…' : 'Save homepage'}</button></div>
  </div>;
}
