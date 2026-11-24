import {Download, FileText} from 'lucide-react';
import {notFound} from 'next/navigation';
import {MediaOptimizer} from '@/components/admin/media-optimizer';
import {WorkspacePageTitle} from '@/components/admin/workspace-shell';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {readMediaText} from '@/lib/server/media/library';

const textLimit = 128 * 1024;
const textTypes = new Set(['application/json', 'application/xml', 'application/yaml', 'application/toml']);

export default async function StudioFile({params}: {params: Promise<{id: string}>}) {
  await requireOwner();
  const {id} = await params;
  if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) notFound();
  const asset = await database().mediaAsset.findUnique({
    where: {id},
    select: {originalName: true, mimeType: true, sizeBytes: true, storageKey: true, folder: {select: {name: true}}},
  });
  if (!asset) notFound();

  const {mimeType, sizeBytes, originalName} = asset;
  const base = `/api/media/${id}`;
  const inline = `${base}?preview=1`;
  const isText = mimeType.startsWith('text/') || textTypes.has(mimeType);
  const content = isText ? await readMediaText(asset.storageKey, textLimit).catch(() => null) : null;
  let preview;
  if (mimeType.startsWith('image/')) preview = <img src={inline} alt={originalName}/>;
  else if (mimeType.startsWith('audio/')) preview = <audio src={inline} controls preload="metadata"/>;
  else if (mimeType.startsWith('video/')) preview = <video src={inline} controls playsInline preload="metadata"/>;
  else if (mimeType === 'application/pdf') preview = <object data={inline} type="application/pdf" aria-label={originalName}><p>Download the PDF to open it on your device.</p></object>;
  else if (content !== null) preview = <><pre tabIndex={0}><code>{content}</code></pre>{sizeBytes > textLimit && <p>Showing the first 128 KB. Download to see the complete file.</p>}</>;
  else preview = <div className="studio-file-placeholder"><FileText size={32}/><p>{isText ? 'The file preview could not be loaded.' : 'Download this file to open it on your device.'}</p></div>;

  return <section className="studio-file-view">
    <WorkspacePageTitle title={originalName}/>
    <header className="admin-page-heading">
      <div><h1>{originalName}</h1><p>{asset.folder?.name ?? 'Unfiled'} · {mimeType} · {new Intl.NumberFormat('en').format(sizeBytes)} bytes</p></div>
      <a className="button button-dark" href={`${base}?download=1`} download={originalName}><Download size={16}/>Download</a>
    </header>
    <div className="studio-file-preview">{preview}</div>
    {['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'].includes(mimeType) && <MediaOptimizer id={id} sizeBytes={sizeBytes} video={mimeType.startsWith('video/')}/>}
  </section>;
}
