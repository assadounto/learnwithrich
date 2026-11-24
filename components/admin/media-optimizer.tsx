'use client';

import {useState} from 'react';
import {ArrowUpRight, Shrink} from 'lucide-react';
import Link from '@/components/navigation-link';

function size(bytes: number) {
  return new Intl.NumberFormat('en', {maximumFractionDigits: 2}).format(bytes / (bytes >= 1024 * 1024 ? 1024 * 1024 : 1024)) + (bytes >= 1024 * 1024 ? ' MB' : ' KB');
}

export function MediaOptimizer({id, sizeBytes, video}: {id: string; sizeBytes: number; video: boolean}) {
  const [mode, setMode] = useState<'lossless' | 'high-quality'>('lossless');
  const [busy, setBusy] = useState(false);
  const [asset, setAsset] = useState<{id: string; sizeBytes: number}>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function optimize() {
    if (busy) return;
    setBusy(true); setNotice(''); setError(''); setAsset(undefined);
    try {
      const response = await fetch(`/api/admin/media/optimize?${new URLSearchParams({id, mode})}`, {method: 'POST'});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not optimize this file.');
      if (result.asset) {
        setAsset(result.asset);
        setNotice(`Saved a smaller copy. ${size(sizeBytes)} → ${size(result.asset.sizeBytes)} (${Math.round((1 - result.asset.sizeBytes / sizeBytes) * 100)}% smaller).`);
      } else setNotice('This mode did not produce a smaller file.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not optimize this file.');
    } finally { setBusy(false); }
  }

  return <section className="admin-panel studio-media-optimize" aria-labelledby="optimize-media-title">
    <h2 id="optimize-media-title">Reduce file size</h2>
    <p>The optimized copy is saved alongside the original. {video ? 'Lossless keeps the video and audio streams as they are.' : 'Lossless keeps image detail and dimensions.'} High quality re-encodes the file for more savings and can change fine details.</p>
    <div><label>Compression<select value={mode} disabled={busy} onChange={event => setMode(event.target.value === 'lossless' ? 'lossless' : 'high-quality')}>
      <option value="lossless">Lossless</option><option value="high-quality">High quality</option>
    </select></label>
      <button className="button button-dark" type="button" onClick={() => void optimize()} disabled={busy}><Shrink size={16}/>{busy ? 'Optimizing…' : 'Create optimized copy'}</button>
    </div>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert" className="admin-alert">{error}</p>}
    {asset && <Link className="text-link" href={`/admin/files/${asset.id}`}>Open optimized copy <ArrowUpRight size={16}/></Link>}
  </section>;
}
