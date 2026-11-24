'use client';

import {createContext, useContext, useEffect, useId, useRef, useState, useTransition, type ReactNode} from 'react';
import {Trash2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {SelectMenu} from '@/components/selection-dialog';

type Entry = {id: string; title: string; updatedAt: string; version?: number};
type Result = {ok: true; changed: number} | {ok: false; error: string};
const Selection = createContext<{selected: Set<string>; toggle: (id: string) => void; requestDelete: (id: string) => void; pending: boolean} | null>(null);

export function BulkRowCheckbox({id, title}: {id: string; title: string}) {
  const selection = useContext(Selection);
  if (!selection) return null;
  return <input className="bulk-status-checkbox" type="checkbox" checked={selection.selected.has(id)} onChange={() => selection.toggle(id)}
    disabled={selection.pending} aria-label={`Select ${title}`}/>;
}

export function BulkRowDelete({id, title}: {id: string; title: string}) {
  const selection = useContext(Selection);
  if (!selection) return null;
  return <button className="bulk-row-delete" type="button" aria-label={`Delete ${title}`} title="Delete"
    disabled={selection.pending} onClick={() => selection.requestDelete(id)}><Trash2 size={17} aria-hidden="true"/></button>;
}

export function BulkStatus({entries, noun, update, remove, children}: {
  entries: Entry[]; noun: 'ideas' | 'resources'; update: (input: unknown, status: unknown) => Promise<Result>;
  remove: (input: unknown) => Promise<Result>; children: ReactNode;
}) {
  const [selected, setSelected] = useState(new Set<string>());
  const [status, setStatus] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<Result>();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<Entry[]>([]);
  const [deleteError, setDeleteError] = useState('');
  const [deleteNotice, setDeleteNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTitle = useId();
  const dialogDescription = useId();
  const router = useRouter();
  const hasDeleteRequest = deleting.length > 0;

  useEffect(() => {
    if (hasDeleteRequest && !dialog.current?.open) dialog.current?.showModal();
  }, [hasDeleteRequest]);
  const chosen = entries.filter(entry => selected.has(entry.id));
  const all = entries.length > 0 && chosen.length === entries.length;

  function toggle(id: string) {
    setConfirming(false);
    setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function apply() {
    if (pending || !chosen.length || !status) return;
    startTransition(async () => {
      try {
        const outcome = await update(chosen, status);
        setResult(outcome);
        if (outcome.ok) {
          setSelected(new Set());
          setStatus('');
          router.refresh();
        }
      } catch { setResult({ok: false, error: 'Could not update the selected items. Try again.'}); }
      setConfirming(false);
    });
  }

  function requestDelete(rows: Entry[]) {
    if (!rows.length || pending) return;
    setConfirming(false);
    setResult(undefined);
    setDeleteNotice('');
    setDeleteError('');
    setDeleting(rows);
  }

  function confirmDelete() {
    if (!deleting.length || pending) return;
    setDeleteError('');
    startTransition(async () => {
      try {
        const outcome = await remove(deleting);
        if (!outcome.ok) {
          setDeleteError(outcome.error);
          return;
        }
        const removed = new Set(deleting.map(row => row.id));
        setSelected(current => new Set([...current].filter(id => !removed.has(id))));
        setDeleteNotice(`Deleted ${outcome.changed} ${outcome.changed === 1 ? noun.slice(0, -1) : noun}.`);
        dialog.current?.close();
        setDeleting([]);
        router.refresh();
      } catch { setDeleteError(`Could not delete the selected ${noun}. Try again.`); }
    });
  }

  return <Selection.Provider value={{selected, toggle, pending, requestDelete: id => requestDelete(entries.filter(row => row.id === id))}}>
    <div className="bulk-status-bar">
      <label className="bulk-status-all"><input className="bulk-status-checkbox" type="checkbox" checked={all} disabled={!entries.length || pending}
        onChange={() => {setConfirming(false);setSelected(all ? new Set() : new Set(entries.map(entry => entry.id)));}}/> Select all shown</label>
      <span className="bulk-status-count">{chosen.length} selected</span>
      <div className="bulk-status-controls">
        <SelectMenu aria-label="New publishing status" value={status} onChange={event => {setStatus(event.target.value);setConfirming(false);}} disabled={!chosen.length || pending}>
          <option value="" disabled>Change status</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
        </SelectMenu>
        <button className="button button-outline" type="button" disabled={!chosen.length || !status || pending || confirming} onClick={() => {setResult(undefined);setConfirming(true);}}>Review change</button>
        <button className="button button-outline bulk-delete-action" type="button" disabled={!chosen.length || pending}
          onClick={() => requestDelete(chosen)}><Trash2 size={16} aria-hidden="true"/>Delete selected</button>
      </div>
    </div>
    {confirming && <div className="bulk-status-confirm">
      <p>Set {chosen.length} selected {chosen.length === 1 ? noun.slice(0, -1) : noun} to <strong>{status.toLowerCase()}</strong>?</p>
      <button className="button button-outline" type="button" disabled={pending} onClick={() => setConfirming(false)}>Cancel</button>
      <button className="button button-dark" type="button" disabled={pending} onClick={apply}>{pending ? 'Applying…' : 'Confirm change'}</button>
    </div>}
    {result && <p className={result.ok ? 'admin-success' : 'admin-alert'} role={result.ok ? 'status' : 'alert'}>
      {result.ok ? (result.changed ? `${result.changed} updated.` : 'All selected items already have that status.') : result.error}
    </p>}
    {deleteNotice && <p className="admin-success" role="status">{deleteNotice}</p>}
    <dialog ref={dialog} className="studio-delete-dialog" aria-labelledby={dialogTitle} aria-describedby={dialogDescription}
      onCancel={event => {if (pending) event.preventDefault();}} onClose={() => setDeleting([])}>
      <h2 id={dialogTitle}>{deleting.length === 1 ? `Delete ${noun.slice(0, -1)}?` : `Delete ${deleting.length} ${noun}?`}</h2>
      <p id={dialogDescription}>{deleting.length === 1 && <><strong>{deleting[0].title}</strong> will be deleted. </>}You can’t undo this action.</p>
      {deleteError && <p className="admin-alert" role="alert">{deleteError}</p>}
      <div className="studio-delete-dialog-actions">
        <button className="button button-outline" type="button" autoFocus disabled={pending} onClick={() => dialog.current?.close()}>Cancel</button>
        <button className="button bulk-delete-confirm" type="button" disabled={pending} onClick={confirmDelete}>{pending ? 'Deleting…' : deleting.length === 1 ? 'Delete' : 'Delete selected'}</button>
      </div>
    </dialog>
    {children}
  </Selection.Provider>;
}
