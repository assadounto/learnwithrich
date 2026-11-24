'use client';

import {createContext, useContext, useState, useTransition, type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
import {SelectMenu} from '@/components/selection-dialog';

type Entry = {id: string; updatedAt: string; version?: number};
type Result = {ok: true; changed: number} | {ok: false; error: string};
const Selection = createContext<{selected: Set<string>; toggle: (id: string) => void; pending: boolean} | null>(null);

export function BulkRowCheckbox({id, title}: {id: string; title: string}) {
  const selection = useContext(Selection);
  if (!selection) return null;
  return <input className="bulk-status-checkbox" type="checkbox" checked={selection.selected.has(id)} onChange={() => selection.toggle(id)}
    disabled={selection.pending} aria-label={`Select ${title}`}/>;
}

export function BulkStatus({entries, noun, update, children}: {
  entries: Entry[]; noun: 'ideas' | 'resources'; update: (input: unknown, status: unknown) => Promise<Result>; children: ReactNode;
}) {
  const [selected, setSelected] = useState(new Set<string>());
  const [status, setStatus] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<Result>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
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

  return <Selection.Provider value={{selected, toggle, pending}}>
    <div className="bulk-status-bar">
      <label className="bulk-status-all"><input className="bulk-status-checkbox" type="checkbox" checked={all} disabled={!entries.length || pending}
        onChange={() => {setConfirming(false);setSelected(all ? new Set() : new Set(entries.map(entry => entry.id)));}}/> Select all shown</label>
      <span className="bulk-status-count">{chosen.length} selected</span>
      <div className="bulk-status-controls">
        <SelectMenu aria-label="New publishing status" value={status} onChange={event => {setStatus(event.target.value);setConfirming(false);}} disabled={!chosen.length || pending}>
          <option value="" disabled>Change status</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
        </SelectMenu>
        <button className="button button-outline" type="button" disabled={!chosen.length || !status || pending || confirming} onClick={() => {setResult(undefined);setConfirming(true);}}>Review change</button>
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
    {children}
  </Selection.Provider>;
}
