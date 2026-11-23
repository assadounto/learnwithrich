'use client';
import {useRef, useState} from 'react';
import {AlertTriangle, CheckCircle2, FileArchive, FileText, LoaderCircle, Upload} from 'lucide-react';
import styles from './resource-package.module.css';
import Link from 'next/link';

type Preview = {
  valid: boolean;
  resources: {key: string; type: string; title: string; slug: string; summary: string; itemCount: number; items: {key: string; title: string; section: string | null}[]; readiness: string[]; externalLinks: string[]}[];
  files: {path: string; sizeBytes: number; mimeType: string; referencedBy: string[]}[];
  errors: string[];
  warnings: string[];
};
function size(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

export function ResourcePackagePreview() {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState<{id: string; key: string; title: string; slug: string; type: string}[] | null>(null);

  async function inspect(file?: File) {
    if (!file) return;
    setPreview(null); setImported(null); setError(''); setFileName(file.name); setSelectedFile(file);
    if (!file.name.toLowerCase().endsWith('.zip')) { setError('Choose a .zip package.'); return; }
    const form = new FormData(); form.append('file', file);
    setBusy(true);
    try {
      const response = await fetch('/api/admin/resource-packages/preview', {method: 'POST', body: form});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not inspect this package.');
      setPreview(body.preview);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not inspect this package.'); }
    finally { setBusy(false); }
  }

  async function importPackage() {
    const file = selectedFile;
    if (!file || !preview?.valid) return;
    const form = new FormData(); form.append('file', file); setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/resource-packages/import', {method: 'POST', body: form});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not import this package.');
      setImported(body.resources);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not import this package.'); }
    finally { setBusy(false); }
  }

  return <div className={styles.root}>
    <section className={`admin-panel ${styles.upload}`}>
      <div className="admin-panel-heading"><FileArchive size={19}/><h2>Choose a resource package</h2></div>
      <p className="admin-help">Upload a ZIP with a root <code>manifest.json</code> and any referenced files under <code>files/</code>. One resource and a complete course or path bundle use the same format. Packages up to 100 MB are accepted; each media file may be up to 50 MB. <a href="https://github.com/assadounto/learnwithrich/blob/main/docs/resource-package.md" target="_blank" rel="noreferrer">Read the package format and examples</a>.</p>
      <input ref={input} type="file" accept=".zip,application/zip" hidden onChange={event => {void inspect(event.currentTarget.files?.[0]); event.currentTarget.value = '';}}/>
      <button className="button button-dark" type="button" disabled={busy} onClick={() => input.current?.click()}>{busy ? <LoaderCircle className="service-spin" size={16}/> : <Upload size={16}/>} {busy ? 'Inspecting package…' : preview ? 'Choose another ZIP' : 'Choose ZIP file'}</button>
      {fileName && <p className={styles.filename}>{fileName}</p>}
      {error && <p className="admin-alert" role="alert">{error}</p>}
    </section>
    {preview && <>
      <section className={`admin-panel ${styles.results}`} aria-live="polite">
        <div className="admin-panel-heading">{preview.valid ? <CheckCircle2 size={19}/> : <AlertTriangle size={19}/>}<h2>{preview.valid ? 'Package checks passed' : 'Package needs changes'}</h2></div>
        <p className="admin-help">{imported ? `Imported ${imported.length} draft resources with their referenced package files.` : 'Review the resource details and files below, then import them as drafts.'}</p>
        {imported && <div className={styles.imported}><strong>Drafts created</strong><ul>{imported.map(resource => <li key={resource.id}><Link href={`/admin/resources/${resource.id}`}>{resource.title}</Link> <span>({resource.type.replaceAll('_', ' ')} · /{resource.slug})</span></li>)}</ul></div>}
        {preview.errors.length > 0 && <div className="admin-alert"><strong>Fix these issues before import:</strong><ul>{preview.errors.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>}
        <h3>Resources ({preview.resources.length})</h3>
        <div className={styles.resourceList}>{preview.resources.map(resource => <article className={styles.resource} key={resource.key}>
          <div><span className="admin-resource-kind">{resource.type.replaceAll('_', ' ')}</span><h4>{resource.title}</h4><small>/{resource.slug} · key: {resource.key}{['COURSE', 'PATH'].includes(resource.type) ? ` · ${resource.itemCount} items` : ''}</small>{resource.summary && <p>{resource.summary}</p>}{resource.items.length > 0 && <ol className={styles.collectionItems}>{resource.items.map(item => <li key={item.key}>{item.title}{item.section ? ` · ${item.section}` : ''}</li>)}</ol>}{resource.externalLinks.length > 0 && <div className={styles.externalLinks}><strong>HTTPS links</strong>{resource.externalLinks.map(url => <a key={url} href={url} target="_blank" rel="noreferrer">{url}</a>)}</div>}</div>
          <div className={styles.readiness}><strong>{resource.readiness.length ? 'Draft readiness' : 'Ready to publish'}</strong>{resource.readiness.length > 0 && <ul>{resource.readiness.map(item => <li key={item}>{item}</li>)}</ul>}</div>
        </article>)}</div>
        <h3>Package files ({preview.files.length})</h3>
        {preview.files.length ? <ul className={styles.fileList}>{preview.files.map(file => <li key={file.path}><FileText size={15}/><span><strong>{file.path}</strong><small>{file.mimeType} · {size(file.sizeBytes)}{file.referencedBy.length ? ` · used by ${file.referencedBy.join(', ')}` : ' · not referenced'}</small></span></li>)}</ul> : <p className="admin-help">No media files included.</p>}
        {preview.warnings.length > 0 && <div className={styles.warnings}><strong>Warnings</strong><ul>{preview.warnings.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>}
        {preview.valid && !imported && <button className="button button-dark" type="button" disabled={busy} onClick={() => void importPackage()}>{busy ? <LoaderCircle className="service-spin" size={16}/> : <Upload size={16}/>} {busy ? 'Importing drafts…' : `Import ${preview.resources.length} draft${preview.resources.length === 1 ? '' : 's'}`}</button>}
      </section>
    </>}
  </div>;
}
