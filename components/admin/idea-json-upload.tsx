'use client';

import {useRef, useState, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {FileJson, Upload} from 'lucide-react';

export function IdeaJsonUpload() {
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || busy) return;
    setError(''); setNotice('');
    if (!/\.json$/i.test(file.name) || file.size > 512 * 1024) {
      setError('Choose a JSON file no larger than 512 KiB.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/admin/project-ideas', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: await file.text()});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not import the file.');
      setNotice(`Created ${body.ideas.length} draft ${body.ideas.length === 1 ? 'idea' : 'ideas'}.`);
      setFile(undefined);
      if (input.current) input.current.value = '';
      router.refresh();
    } catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not import the file.');}
    finally {setBusy(false);}
  }

  return <details className="admin-idea-import">
    <summary><FileJson size={17}/> Upload idea JSON</summary>
    <p>Import up to 25 ideas as drafts. Use the <a href="/resource-package#agent-authoring">project idea JSON example</a>. Duplicate slugs stop the entire import.</p>
    <form onSubmit={submit}>
      <label className="sr-only" htmlFor="idea-json">Project ideas JSON file</label>
      <input ref={input} id="idea-json" type="file" accept=".json,application/json" disabled={busy} onChange={event => setFile(event.target.files?.[0])}/>
      <button className="button button-dark" type="submit" disabled={!file || busy}><Upload size={15}/>{busy ? 'Importing…' : 'Import drafts'}</button>
    </form>
    {error && <p className="admin-alert" role="alert">{error}</p>}
    {notice && <p className="admin-success" role="status">{notice}</p>}
  </details>;
}
