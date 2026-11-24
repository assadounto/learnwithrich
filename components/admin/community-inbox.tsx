'use client';
import {SelectMenu} from '@/components/selection-dialog';
import {useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Check, ChevronRight, Clock3, Inbox, Mail, MessageSquareQuote, Save, Search, UserRound, X, FileText, Paperclip, Send} from 'lucide-react';
import {MediaLibraryModal} from '@/components/admin/media-library-modal';
import styles from './community-inbox.module.css';

type Kind = 'guestbook'|'reviews'|'service-requests';
type RevisionFile = {mediaAsset:{id:string;originalName:string;mimeType:string;sizeBytes:number}};
type Revision = {id:string;revisionNumber:number;status:string;title:string;summary:string;changesMade:string;requesterNote:string|null;requesterFeedback:string|null;files:RevisionFile[]};
type Row = {id:string; status:string; createdAt:string; name?:string; email?:string|null; title?:string|null; country?:string|null; imageAssetId?:string|null; phone?:string; message?:string; rating?:number; serviceType?:string; description?:string; budgetMinor?:number|null; currency?:string; timeline?:string|null; quoteMinor?:number|null; quoteNote?:string|null; includedRevisions?:number; extraRevisionPriceMinor?:number; files?:RevisionFile[]; revisions?:Revision[]};
const statusLabels: Record<string,string> = {PENDING:'Pending review',APPROVED:'Approved',HIDDEN:'Hidden',NEW:'New request',REVIEWING:'Reviewing',QUOTED:'Quote ready',PAYMENT_PENDING:'Payment pending',ACCEPTED:'Paid · in progress',DECLINED:'Declined',COMPLETED:'Completed'};
const requestStatuses = ['NEW','REVIEWING','QUOTED','ACCEPTED','DECLINED','COMPLETED'];
const pretty = (value:string) => value.replaceAll('_',' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
function dateLabel(value:string) {return new Intl.DateTimeFormat('en-GH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}

const inboxCopy = {
  guestbook: {title: 'Guest book', description: 'Review notes before they appear on the public site.', item: 'notes'},
  reviews: {title: 'Community reviews', description: 'Review ratings and feedback before they appear on the public site.', item: 'reviews'},
  'service-requests': {title: 'Service requests', description: 'Review briefs, send quotes, and manage delivery and revisions.', item: 'requests'},
};
const moderationFilters = [
  {id: 'ALL', label: 'All', statuses: []},
  {id: 'PENDING', label: 'Pending', statuses: ['PENDING']},
  {id: 'APPROVED', label: 'Approved', statuses: ['APPROVED']},
  {id: 'HIDDEN', label: 'Hidden', statuses: ['HIDDEN']},
];
const serviceFilters = [
  {id: 'ALL', label: 'All', statuses: []},
  {id: 'NEEDS_REPLY', label: 'Needs review', statuses: ['NEW', 'REVIEWING']},
  {id: 'WAITING', label: 'Waiting on learner', statuses: ['QUOTED', 'PAYMENT_PENDING']},
  {id: 'IN_PROGRESS', label: 'In progress', statuses: ['ACCEPTED']},
  {id: 'CLOSED', label: 'Closed', statuses: ['DECLINED', 'COMPLETED']},
];

function Status({value}: {value: string}) {
  return <span className={`admin-status admin-status-${value.toLowerCase()}`}>{statusLabels[value] ?? pretty(value)}</span>;
}

export function CommunityInbox({kind, initialRows}: {kind: Kind; initialRows: Row[]}) {
  const router = useRouter();
  const [changes, setChanges] = useState<Record<string, Partial<Row>>>({});
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState<{error: boolean; text: string} | null>(null);
  const [selectedRequest, setSelectedRequest] = useState(initialRows[0]?.id ?? '');
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [pending, startTransition] = useTransition();
  const service = kind === 'service-requests';
  const filters = service ? serviceFilters : moderationFilters;
  const copy = inboxCopy[kind];
  const rows = initialRows.map(row => ({...row, ...changes[row.id]}));
  const search = query.trim().toLowerCase();
  const matching = rows.filter(row => !search || [
    row.name, row.email, row.title, row.country, row.message, row.description,
    row.serviceType ? pretty(row.serviceType) : undefined, row.id,
  ].some(value => value?.toLowerCase().includes(search)));
  const activeFilter = filters.find(item => item.id === filter) ?? filters[0];
  const visibleRows = matching.filter(row => !activeFilter.statuses.length || activeFilter.statuses.includes(row.status));
  const selectedRow = visibleRows.find(row => row.id === selectedRequest);

  function update(id: string, payload: Partial<Row>) {
    setBusy(id);
    setFeedback(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/community/${kind}/${id}`, {
          method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not save the change.');
        if (service) router.refresh();
        else setChanges(current => ({...current, [id]: {...current[id], ...payload}}));
        setFeedback({error: false, text: service ? 'Request updated.' : 'Moderation status updated.'});
      } catch (error) {
        setFeedback({error: true, text: error instanceof Error ? error.message : 'Could not save the change.'});
      } finally { setBusy(''); }
    });
  }

  return <div className={styles.root}>
    <header className={styles.pageHeader}>
      <div><h1>{copy.title}</h1><p>{copy.description}</p></div>
      <span className={styles.total}><Inbox size={16}/>{rows.length} recent {copy.item}</span>
    </header>
    <section className={styles.inbox} aria-label={`${copy.title} inbox`}>
      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Filter by status">
          {filters.map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => {
            setFilter(item.id);
            setSelectedRequest(matching.find(row => !item.statuses.length || item.statuses.includes(row.status))?.id ?? '');
          }}>{item.label}<span>{matching.filter(row => !item.statuses.length || item.statuses.includes(row.status)).length}</span></button>)}
        </div>
        <label className={styles.search}><Search size={16}/><span className="sr-only">{`Search ${copy.item}`}</span>
          <input type="search" placeholder={`Search ${copy.item}…`} value={query} onChange={event => setQuery(event.target.value)}/>
        </label>
      </div>
      {feedback && <p className={feedback.error ? 'admin-alert' : 'admin-success'} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}
      {!visibleRows.length ? <div className={styles.empty}>
        <Inbox size={24}/><h2>{rows.length ? 'No matching results' : `No ${copy.item} yet`}</h2>
        {rows.length > 0 && <button type="button" className="button button-outline" onClick={() => {setQuery(''); setFilter('ALL'); setSelectedRequest(rows[0]?.id ?? '');}}>Clear filters</button>}
      </div> : service ? <div className={styles.serviceGrid}>
        <nav className={styles.requestList} aria-label="Service request inbox">
          {visibleRows.map(row => <button type="button" key={row.id} aria-current={row.id === selectedRequest ? 'true' : undefined}
            aria-controls="service-request-detail" onClick={() => setSelectedRequest(row.id)}>
            <span className={styles.requestTitle}><strong>{pretty(row.serviceType ?? 'OTHER')}</strong><ChevronRight size={16}/></span>
            <span className={styles.requestMeta}>{row.name} · <time dateTime={row.createdAt}>{dateLabel(row.createdAt)}</time></span>
            <Status value={row.status}/>
          </button>)}
        </nav>
        <div id="service-request-detail" className={styles.detail}>
          {selectedRow ? <ServiceRequestCard key={selectedRow.id} row={selectedRow} busy={pending || busy === selectedRow.id} onSave={update}/>
            : <div className={styles.empty}><FileText size={22}/><h2>Select a request</h2><p>Open a request to see its brief, quote, and delivery.</p></div>}
        </div>
      </div> : <div className={styles.moderationList}>
        {visibleRows.map(row => <article className={styles.moderationCard} key={row.id}>
          <header className={styles.cardHeader}>
            <div className={styles.person}>
              {row.imageAssetId ? <img src={`/api/media/${row.imageAssetId}`} alt="" width="40" height="40" loading="lazy"/> : <span className={styles.avatar}><UserRound size={18}/></span>}
              <div><strong>{row.name}</strong><span>{row.country ? `${row.country} · ` : ''}<time dateTime={row.createdAt}>{dateLabel(row.createdAt)}</time></span></div>
            </div>
            <Status value={row.status}/>
          </header>
          <div className={styles.message}>
            {kind === 'reviews' && row.rating !== undefined && <p className={styles.rating}><span aria-hidden="true">{'★'.repeat(row.rating)}{'☆'.repeat(5 - row.rating)}</span> {row.rating}/5</p>}
            {row.title && <h2>{row.title}</h2>}
            <blockquote>{row.message}</blockquote>
          </div>
          <footer className={styles.cardActions}>
            {row.email && <a href={`mailto:${row.email}`} className={styles.email}><Mail size={15}/>{row.email}</a>}
            {row.status !== 'APPROVED' ? <button type="button" className="button button-dark" disabled={pending} onClick={() => update(row.id, {status: 'APPROVED'})}><Check size={15}/>Approve</button>
              : <button type="button" className="button button-outline" disabled={pending} onClick={() => update(row.id, {status: 'HIDDEN'})}><X size={15}/>Hide</button>}
            {row.status !== 'PENDING' && <button type="button" className="button button-outline" disabled={pending} onClick={() => update(row.id, {status: 'PENDING'})}><Clock3 size={14}/>Return to pending</button>}
          </footer>
        </article>)}
      </div>}
    </section>
  </div>;
}
function ServiceRequestCard({row, busy, onSave}: {row: Row; busy: boolean; onSave: (id: string, payload: Partial<Row>) => void}) {
  const [status, setStatus] = useState(row.status);
  const [quote, setQuote] = useState(row.quoteMinor == null ? '' : (row.quoteMinor / 100).toFixed(2));
  const [note, setNote] = useState(row.quoteNote ?? '');
  const [included, setIncluded] = useState(String(row.includedRevisions ?? 1));
  const [extra, setExtra] = useState(row.extraRevisionPriceMinor ? (row.extraRevisionPriceMinor / 100).toFixed(2) : '');
  const [quoteError, setQuoteError] = useState('');
  const [panel, setPanel] = useState('Brief');
  const revisions = row.revisions ?? [];

  function saveQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quoteMinor = quote.trim() ? Math.round(Number(quote) * 100) : null;
    const extraRevisionPriceMinor = extra.trim() ? Math.round(Number(extra) * 100) : 0;
    const includedRevisions = Number(included);
    const amounts = quoteMinor === null ? [extraRevisionPriceMinor] : [quoteMinor, extraRevisionPriceMinor];
    if (amounts.some(amount => !Number.isSafeInteger(amount) || amount < 0)
      || !Number.isSafeInteger(includedRevisions) || includedRevisions < 0 || includedRevisions > 50) {
      setQuoteError('Enter valid quote and revision amounts, and between 0 and 50 included revisions.');
      return;
    }
    setQuoteError('');
    onSave(row.id, {status, quoteMinor, quoteNote: note, includedRevisions, extraRevisionPriceMinor});
  }

  return <article>
    <header className={styles.detailHeader}>
      <div><h2>{pretty(row.serviceType ?? 'OTHER')}</h2><p>{row.name} · #{row.id.slice(0, 8).toUpperCase()}</p></div>
      <Status value={row.status}/>
    </header>
    <div className={styles.detailTabs} role="group" aria-label="Request sections">
      {['Brief', 'Quote', 'Delivery'].map(section => <button key={section} type="button" aria-pressed={panel === section}
        aria-controls={`service-panel-${section.toLowerCase()}`} onClick={() => setPanel(section)}>{section}</button>)}
    </div>
    <div id="service-panel-brief" hidden={panel !== 'Brief'}>
      <div className="service-admin-contact">
        <strong>{row.name}</strong>
        {row.email && <a href={`mailto:${row.email}`}><Mail size={14}/>{row.email}</a>}
        {row.phone && <a href={`tel:${row.phone}`}><span aria-hidden="true">☎</span>{row.phone}</a>}
      </div>
      <p className="service-admin-description">{row.description}</p>
      <dl className="service-admin-facts">
        <div><dt>Budget offered</dt><dd>{row.budgetMinor == null ? 'Not specified' : `${(row.budgetMinor / 100).toFixed(2)} ${row.currency}`}</dd></div>
        {row.timeline && <div><dt>Timeline</dt><dd>{row.timeline}</dd></div>}
        <div><dt>Received</dt><dd><time dateTime={row.createdAt}>{dateLabel(row.createdAt)}</time></dd></div>
      </dl>
      {!!row.files?.length && <section className="service-admin-request-files">
        <strong>Files from requester · {row.files.length}</strong>
        <div>{row.files.map(({mediaAsset}) => <a key={mediaAsset.id} href={`/api/service-request-files/${row.id}/${mediaAsset.id}`} target="_blank" rel="noreferrer">
          <FileText size={14}/><span>{mediaAsset.originalName}<small>{(mediaAsset.sizeBytes / 1024 / 1024).toFixed(1)} MB</small></span>
        </a>)}</div>
      </section>}
    </div>
    <div id="service-panel-quote" hidden={panel !== 'Quote'}>
      <form onSubmit={saveQuote} className="service-admin-quote">
        <div className="service-admin-quote-heading">
          <span><MessageSquareQuote size={15}/>Quote & revision terms</span>
          <small>A sent quote appears in the learner’s account with a Paystack payment button.</small>
        </div>
        <div className="service-admin-quote-fields">
          <label>Request status<SelectMenu value={status} onChange={event => setStatus(event.target.value)}>
            {!requestStatuses.includes(status) && <option value={status} disabled>{statusLabels[status] ?? pretty(status)}</option>}
            {requestStatuses.map(value => <option key={value} value={value}>{statusLabels[value]}</option>)}
          </SelectMenu></label>
          <label>Project quote ({row.currency})<input inputMode="decimal" value={quote} onChange={event => setQuote(event.target.value)} placeholder="e.g. 2500.00"/></label>
          <label>Included revisions<input type="number" min="0" max="50" value={included} onChange={event => setIncluded(event.target.value)}/></label>
          <label>Price per extra revision ({row.currency})<input inputMode="decimal" value={extra} onChange={event => setExtra(event.target.value)}/></label>
        </div>
        <label>Scope, deliverables & quote note<textarea rows={4} maxLength={5000} value={note} onChange={event => setNote(event.target.value)} placeholder="What is included in the quote?"/></label>
        {quoteError && <p role="alert" className="admin-alert">{quoteError}</p>}
        <button className="button button-dark" disabled={busy} type="submit"><Save size={14}/>{busy ? 'Saving…' : status === 'QUOTED' ? 'Save and send quote' : 'Save request update'}</button>
      </form>
    </div>
    <div id="service-panel-delivery" hidden={panel !== 'Delivery'}>
      <section className="admin-service-revisions">
        <header><h3>Revision drafts & approvals</h3><span>{revisions.length} total</span></header>
        {revisions.length ? revisions.map(revision => <article className="admin-service-revision" key={revision.id}>
          <div className="admin-revision-top"><strong>{revision.revisionNumber === 0 ? 'Initial delivery' : `Revision ${revision.revisionNumber}`}</strong><Status value={revision.status}/></div>
          {revision.requesterNote && <p><b>Learner asked for:</b> {revision.requesterNote}</p>}
          {revision.requesterFeedback && <p><b>Requested changes:</b> {revision.requesterFeedback}</p>}
          {['AWAITING_APPROVAL', 'APPROVED'].includes(revision.status) ? <>
            <h4>{revision.title}</h4><p>{revision.summary}</p><p><b>What changed:</b> {revision.changesMade}</p>
            {revision.files.map(({mediaAsset}) => <a className="admin-revision-file" key={mediaAsset.id}
              href={`/api/service-revision-files/${revision.id}/${mediaAsset.id}`} target="_blank" rel="noreferrer"><FileText size={14}/>{mediaAsset.originalName}</a>)}
          </> : <ServiceRevisionEditor requestId={row.id} revision={revision}/>}
        </article>) : row.status === 'ACCEPTED' ? <CreateInitialDelivery requestId={row.id}/>
          : <p className="admin-revision-empty">After the quote is paid, prepare the initial delivery here. Learner-requested revisions will also appear here.</p>}
      </section>
    </div>
  </article>;
}

function ServiceRevisionEditor({requestId,revision}:{requestId:string;revision:Revision}) {
  const [title,setTitle]=useState(revision.title),[summary,setSummary]=useState(revision.summary),[changes,setChanges]=useState(revision.changesMade),[files,setFiles]=useState(revision.files.map(file=>file.mediaAsset)),[libraryOpen,setLibraryOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const router=useRouter();
  async function save(action:'SAVE_DRAFT'|'SEND_FOR_APPROVAL'){setBusy(true);setError('');try{const response=await fetch(`/api/admin/service-requests/${requestId}/revisions`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({revisionId:revision.id,action,title,summary,changesMade:changes,mediaAssetIds:files.map(file=>file.id)})});const body=await response.json();if(!response.ok)throw new Error(body.error||'Could not save the revision.');router.refresh();}catch(reason){setError(reason instanceof Error?reason.message:'Could not save the revision.');}finally{setBusy(false);}}
  return <div className="admin-revision-editor"><span className="admin-kicker">{revision.status==='DRAFT'?'SAVED DRAFT':'DRAFT THIS UPDATE'}</span><label>Update title<input maxLength={180} value={title} onChange={event=>setTitle(event.target.value)}/></label><label>Learner-facing summary<textarea rows={3} maxLength={5000} value={summary} onChange={event=>setSummary(event.target.value)} placeholder="What will the learner receive in this update?"/></label><label>What was fixed or changed<textarea rows={4} maxLength={10000} value={changes} onChange={event=>setChanges(event.target.value)} placeholder="Describe the changes, corrections, or files included in this revision."/></label><div className="admin-revision-files"><button type="button" className="button button-outline" onClick={()=>setLibraryOpen(true)}><Paperclip size={15}/>Attach media library files</button>{files.map(file=><span className="admin-revision-file" key={file.id}><FileText size={14}/>{file.originalName}<button type="button" aria-label={`Remove ${file.originalName}`} onClick={()=>setFiles(current=>current.filter(item=>item.id!==file.id))}>×</button></span>)}</div>{error&&<p className="admin-alert" role="alert">{error}</p>}<div className="admin-revision-actions"><button type="button" className="button button-outline" disabled={busy} onClick={()=>void save('SAVE_DRAFT')}><Save size={14}/>{busy?'Saving…':'Save draft'}</button><button type="button" className="button button-dark" disabled={busy} onClick={()=>void save('SEND_FOR_APPROVAL')}><Send size={14}/>{busy?'Sending…':'Send for learner approval'}</button></div><MediaLibraryModal open={libraryOpen} filter="any" onClose={()=>setLibraryOpen(false)} onSelect={(_url,asset)=>{setFiles(current=>current.some(file=>file.id===asset.id)?current:[...current,{id:asset.id,originalName:asset.originalName,mimeType:asset.mimeType,sizeBytes:asset.sizeBytes}]);setLibraryOpen(false);}}/></div>;
}

function CreateInitialDelivery({requestId}:{requestId:string}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');const router=useRouter();
  async function create(){setBusy(true);setError('');try{const response=await fetch(`/api/admin/service-requests/${requestId}/revisions`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'CREATE_INITIAL_DRAFT'})});const body=await response.json();if(!response.ok)throw new Error(body.error||'Could not start the delivery draft.');router.refresh();}catch(reason){setError(reason instanceof Error?reason.message:'Could not start the delivery draft.');}finally{setBusy(false);}}
  return <div className="admin-initial-delivery"><p>The quote is paid. Prepare the first delivery as a saved draft, then send it for learner review.</p><button className="button button-dark" type="button" disabled={busy} onClick={()=>void create()}>{busy?'Preparing…':'Create initial delivery draft'}</button>{error&&<p role="alert" className="admin-alert">{error}</p>}</div>;
}
