'use client';
import {SelectMenu} from '@/components/selection-dialog';

import {useActionState, useState} from 'react';
import {disciplines} from '@/lib/project-ideas';
import {saveIdea} from '@/app/admin/(workspace)/project-ideas/actions';
import {useAdminDirty} from './workspace-shell';

type Idea = {slug: string; title: string; discipline: string; abstract: string; tags: string[]; status: string; updatedAt: string};

export function ProjectIdeaForm({idea}: {idea?: Idea}) {
  const [error, action, pending] = useActionState(saveIdea, '');
  const [dirty, setDirty] = useState(false);
  const [values, setValues] = useState({
    title: idea?.title ?? '', slug: '', discipline: idea?.discipline ?? '',
    abstract: idea?.abstract ?? '', tags: idea?.tags.join(', ') ?? '', status: idea?.status ?? 'DRAFT',
  });
  function change(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const {name, value} = event.target;
    setDirty(true);
    setValues(previous => ({...previous, [name]: value}));
  }
  useAdminDirty(dirty);
  return <form action={action} className="admin-panel" style={{display: 'grid', gap: 12}}>
    <h2>{idea ? 'Edit idea' : 'New idea'}</h2>
    {idea ? <><input type="hidden" name="current" value={idea.slug}/><input type="hidden" name="updatedAt" value={idea.updatedAt}/></> : null}
    <label>Title<input name="title" required minLength={3} maxLength={180} value={values.title} onChange={change}/></label>
    {!idea && <label>URL slug (optional)<input name="slug" value={values.slug} onChange={change} maxLength={120} placeholder="Generated from the title"/></label>}
    <label>Discipline<SelectMenu name="discipline" value={values.discipline} onChange={change} required><option value="" disabled>Choose a discipline</option>{disciplines.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</SelectMenu></label>
    <label>Abstract<textarea name="abstract" required minLength={40} maxLength={3000} rows={7} value={values.abstract} onChange={change}/></label>
    <label>Tags (comma separated)<input name="tags" maxLength={500} value={values.tags} onChange={change}/></label>
    <label>Status<SelectMenu name="status" value={values.status} onChange={change}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></SelectMenu></label>
    {error && <p role="alert" className="admin-alert">{error}</p>}
    <div><button className="button button-dark" disabled={pending}>{pending ? 'Saving…' : 'Save idea'}</button></div>
  </form>;
}
