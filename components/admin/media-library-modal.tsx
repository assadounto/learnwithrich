'use client';
import {useCallback, useEffect, useState} from 'react';
import {FileAudio2, FileImage, FileText, Folder, FolderPlus, Upload, X} from 'lucide-react';

type FolderItem = {id: string; name: string; _count: {assets: number}};
type Asset = {id: string; folderId: string | null; originalName: string; mimeType: string; sizeBytes: number; createdAt: string};
type Payload = {folders: FolderItem[]; assets: Asset[]};
type Filter = 'any' | 'image' | 'audio' | 'document';
const accepted: Record<Filter, string> = {any: 'image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm', image: 'image/jpeg,image/png,image/webp,image/gif,image/avif', audio: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm', document: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
function icon(mime: string) {return mime.startsWith('image/') ? <FileImage size={18}/> : mime.startsWith('audio/') ? <FileAudio2 size={18}/> : <FileText size={18}/>;}
function size(bytes: number) {return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;}

export function MediaLibraryModal({open, filter, onClose, onSelect}: {open: boolean; filter: Filter; onClose: () => void; onSelect: (url: string, asset: Asset) => void}) {
  const [payload, setPayload] = useState<Payload>({folders: [], assets: []});
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [showFolder, setShowFolder] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {const query = folderId === 'all' ? '?folderId=all' : folderId ? `?folderId=${encodeURIComponent(folderId)}` : ''; const response = await fetch(`/api/admin/media${query}`, {cache: 'no-store'}); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not load media.'); setPayload(body);}
    catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not load media.');}
  }, [folderId]);
  useEffect(() => {if (open) {void load(); setError('');}}, [open, load]);
  useEffect(() => {if (!open) return; const close = (event: KeyboardEvent) => {if (event.key === 'Escape') onClose();}; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);}, [open, onClose]);
  if (!open) return null;
  const upload = async (file: File) => {setBusy(true); setError(''); try {const form = new FormData(); form.append('file', file); if (folderId && folderId !== 'all') form.append('folderId', folderId); const response = await fetch('/api/admin/media', {method: 'POST', body: form}); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Upload failed.'); await load();} catch (reason) {setError(reason instanceof Error ? reason.message : 'Upload failed.');} finally {setBusy(false);}};
  const createFolder = async (event: React.FormEvent) => {event.preventDefault(); setBusy(true); setError(''); try {const response = await fetch('/api/admin/media/folders', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: folderName})}); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not create folder.'); setPayload(value => ({...value, folders: [...value.folders, body.folder].sort((a, b) => a.name.localeCompare(b.name))})); setFolderId(body.folder.id); setFolderName(''); setShowFolder(false);} catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not create folder.');} finally {setBusy(false);}};
  const assets = payload.assets.filter(asset => filter === 'any' || filter === 'image' && asset.mimeType.startsWith('image/') || filter === 'audio' && asset.mimeType.startsWith('audio/') || filter === 'document' && !asset.mimeType.startsWith('image/') && !asset.mimeType.startsWith('audio/'));
  return <div className="media-modal-backdrop" role="presentation" onMouseDown={event => {if (event.target === event.currentTarget) onClose();}}><section className="media-modal" role="dialog" aria-modal="true" aria-labelledby="media-title"><header><div><span className="admin-kicker">CREATOR STUDIO</span><h2 id="media-title">Media library</h2><p>Choose existing media or upload a new asset.</p></div><button type="button" className="media-close" aria-label="Close media library" onClick={onClose}><X size={19}/></button></header>
    <div className="media-toolbar"><label className="media-folder-select"><Folder size={16}/><select aria-label="Choose media folder" value={folderId} onChange={event => setFolderId(event.target.value)}><option value="">Unfiled</option><option value="all">All media</option>{payload.folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name} ({folder._count.assets})</option>)}</select></label><button type="button" className="button button-outline" onClick={() => setShowFolder(value => !value)}><FolderPlus size={15}/>New folder</button><label className={`button button-dark media-upload${busy ? ' is-disabled' : ''}`}><Upload size={15}/>{busy ? 'Uploading…' : 'Upload files'}<input type="file" accept={accepted[filter]} disabled={busy || folderId === 'all'} onChange={event => {const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = '';}}/></label></div>
    {folderId === 'all' && <p className="media-inline-note">Choose a folder to upload there, or return to Unfiled.</p>}{showFolder && <form className="media-folder-form" onSubmit={createFolder}><input autoFocus aria-label="New folder name" maxLength={80} required placeholder="e.g. Course audio" value={folderName} onChange={event => setFolderName(event.target.value)}/><button type="submit" className="button button-dark" disabled={busy}>Create folder</button></form>}
    <p className="media-public-warning">Files are publicly accessible to anyone with their link. Avoid uploading private or paid-only files.</p>{error && <p className="admin-alert" role="alert">{error}</p>}
    <div className="media-assets" aria-live="polite">{assets.length ? assets.map(asset => <button className="media-asset" type="button" key={asset.id} onClick={() => onSelect(`/api/media/${asset.id}`, asset)}><span className="media-file-icon">{icon(asset.mimeType)}</span><span className="media-file-copy"><strong title={asset.originalName}>{asset.originalName}</strong><small>{size(asset.sizeBytes)} · {asset.mimeType.split('/')[1]?.toUpperCase()}</small></span>{asset.mimeType.startsWith('image/') && <img src={`/api/media/${asset.id}`} alt=""/>}<span className="media-use">Use</span></button>) : <div className="media-empty"><Folder size={24}/><p>No matching files in this folder yet.</p><small>Upload an image, document or audio file to get started.</small></div>}</div>
    <footer><span>Images, PDF, Word and audio · up to 50 MB</span><button type="button" className="button button-outline" onClick={onClose}>Done</button></footer>
  </section></div>;
}
