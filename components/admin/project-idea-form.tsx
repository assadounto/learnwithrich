'use client';

import {useActionState, useState} from 'react';
import {ArrowLeft, ArrowUpRight, Eye, Save} from 'lucide-react';
import Link from '@/components/navigation-link';
import {SelectMenu} from '@/components/selection-dialog';
import {disciplineLabel, disciplines} from '@/lib/project-ideas';
import {slugFromTitle} from '@/lib/resource-types';
import {saveIdea} from '@/app/admin/(workspace)/project-ideas/actions';
import styles from '@/app/admin/(workspace)/project-ideas/ideas.module.css';
import {useAdminDirty, WorkspacePageTitle} from './workspace-shell';

type Idea = {slug: string; title: string; discipline: string; abstract: string; tags: string[]; status: string; updatedAt: string};

const visibility: Record<string, string> = {
  DRAFT: 'Only visible in the studio.',
  PUBLISHED: 'Visible in the public Project Ideas library.',
  ARCHIVED: 'Hidden from the public site and kept in the studio.',
};

export function ProjectIdeaForm({idea}: {idea?: Idea}) {
  const [error, action, pending] = useActionState(saveIdea, '');
  const [dirty, setDirty] = useState(false);
  const [values, setValues] = useState({
    title: idea?.title ?? '', slug: '', discipline: idea?.discipline ?? '',
    abstract: idea?.abstract ?? '', tags: idea?.tags.join(', ') ?? '', status: idea?.status ?? 'DRAFT',
  });
  const tags = [...new Set(values.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean))];
  const slug = idea?.slug ?? (values.slug.trim() || slugFromTitle(values.title));
  const submitLabel = !idea && values.status === 'PUBLISHED' ? 'Publish idea'
    : !idea && values.status === 'DRAFT' ? 'Create draft' : 'Save idea';

  function change(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const {name, value} = event.target;
    setDirty(true);
    setValues(previous => ({...previous, [name]: value}));
  }

  useAdminDirty(dirty);

  return <div className={styles.editor}>
    <WorkspacePageTitle title={idea?.title ?? 'New project idea'}/>
    <Link className={styles.back} href="/admin/project-ideas"><ArrowLeft size={16}/> Project ideas</Link>
    <header className={styles.heading}>
      <div><h1>{idea ? 'Edit project idea' : 'New project idea'}</h1>
        <p>{idea ? idea.title : 'Write an abstract and decide when to publish it.'}</p></div>
      {idea?.status === 'PUBLISHED' && <Link className="button button-outline" href={`/project-ideas/${idea.slug}`}>View published idea <ArrowUpRight size={15}/></Link>}
    </header>

    <form action={action} className={styles.editorForm}>
      {idea && <><input type="hidden" name="current" value={idea.slug}/><input type="hidden" name="updatedAt" value={idea.updatedAt}/></>}
      <div className={styles.writing}>
        <section aria-labelledby="idea-content">
          <h2 id="idea-content">Idea content</h2>
          <label>Title<input name="title" required minLength={3} maxLength={180} value={values.title} onChange={change} placeholder="Give the idea a clear, descriptive title"/></label>
          <label>Abstract<textarea name="abstract" required minLength={40} maxLength={3000} rows={9} value={values.abstract} onChange={change}
            placeholder="What question will the project explore? Describe what someone could build, research, or measure."/>
            <small className={styles.count}>{values.abstract.length.toLocaleString()} / 3,000 characters</small>
          </label>
        </section>
        <section aria-labelledby="idea-organization">
          <h2 id="idea-organization">Organization</h2>
          <label>Discipline<SelectMenu name="discipline" value={values.discipline} onChange={change} required><option value="" disabled>Choose a discipline</option>{disciplines.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</SelectMenu></label>
          <label>Tags<input name="tags" maxLength={500} value={values.tags} onChange={change} placeholder="Example: arduino, sensors, energy"/>
            <small>Separate up to 12 tags with commas.</small></label>
        </section>
      </div>

      <aside className={styles.sidebar}>
        <section aria-labelledby="idea-publication">
          <h2 id="idea-publication">Publishing</h2>
          <label>Visibility<SelectMenu name="status" value={values.status} onChange={change}>
            <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
          </SelectMenu><small>{visibility[values.status]}</small></label>
          {!idea && <label>Custom URL slug <small>Optional</small><input name="slug" value={values.slug} onChange={change}
            maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="Generated from the title"/></label>}
          {slug && <div className={styles.slug}><span>Public path</span><code>/project-ideas/{slug}</code></div>}
        </section>
        <section className={styles.preview} aria-labelledby="idea-preview">
          <h2 id="idea-preview"><Eye size={17}/> Listing preview</h2>
          {values.discipline && <small>{disciplineLabel(values.discipline)}</small>}
          <h3>{values.title.trim() || 'Your project title'}</h3>
          {values.abstract.trim() && <p>{values.abstract}</p>}
          {!!tags.length && <ul className={styles.tags} aria-label="Tags">{tags.slice(0, 3).map(tag => <li key={tag}>{tag}</li>)}
            {tags.length > 3 && <li>+{tags.length - 3} more</li>}
          </ul>}
        </section>
      </aside>

      <footer className={styles.editorFooter}>
        {error && <p role="alert" className="admin-alert">{error}</p>}
        <div className={styles.actions}>
          <Link href="/admin/project-ideas" className="button button-outline">Cancel</Link>
          <button type="submit" className="button button-dark" disabled={pending}><Save size={16}/>{pending ? 'Saving…' : submitLabel}</button>
        </div>
      </footer>
    </form>
  </div>;
}
