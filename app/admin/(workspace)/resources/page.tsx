import {CatalogPagination} from '@/components/catalog-pagination';
import {StudioPageSize} from '@/components/admin/studio-page-size';
import {requestedPage, studioPageSize} from '@/lib/pagination';
import {BulkRowCheckbox, BulkRowDelete, BulkStatus} from '@/components/admin/bulk-status';
import {bulkResourceStatus, deleteResources} from '@/app/admin/actions';
import {SelectMenu} from '@/components/selection-dialog';
import Link from '@/components/navigation-link';
import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {adminRepository} from '@/lib/server/admin/repository';
import {resourceDefinitions} from '@/lib/resource-types';
import {resourceTypes, type ResourceKind} from '@/lib/server/resources/validation';
import {Plus, Search, Files, Library, FileText, CheckCircle2, FileArchive} from 'lucide-react';
export default async function ResourceStudio({searchParams}: {searchParams: Promise<{q?: string; type?: string; status?: string; page?: string; per?: string}>}) {
  const owner = await requireOwner(), params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.slice(0, 200) : '';
  const type = resourceTypes.includes(params.type as ResourceKind) ? params.type as ResourceKind : undefined;
  const status = ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(params.status ?? '') ? params.status : undefined;
  const repo = adminRepository(database(), owner.id, owner.sessionId);
  const size = studioPageSize(params.per);
  const [{rows, page, pages, total}, stats] = await Promise.all([repo.listPage(query, {type, status}, requestedPage(params.page), size), repo.summary()]);
  function href(number: number) {
    const filters = new URLSearchParams({page: String(number), per: String(size)});
    if (query) filters.set('q', query);
    if (type) filters.set('type', type);
    if (status) filters.set('status', status);
    return `/admin/resources?${filters}`;
  }
  const createHref = `/admin/resources/new${type ? `?type=${type}` : ''}`;
  return <><header className="admin-page-heading"><div><span className="admin-kicker">CONTENT WORKSPACE</span><h1>{type ? resourceDefinitions[type].plural : status === 'DRAFT' ? 'Your drafts' : 'Your resources'}</h1><p>{type ? resourceDefinitions[type].description : 'Create, organize and publish the things you know.'}</p></div><div className="admin-page-actions"><Link href="/admin/resources/import" className="button button-outline"><FileArchive size={16}/>Upload ZIP or JSON</Link><Link href={createHref} className="button button-dark"><Plus size={17}/>Create {type ? resourceDefinitions[type].name.toLowerCase() : 'resource'}</Link></div></header>
    <div className="workspace-stats">{[{label: 'Total resources', value: stats.total, Icon: Library, href: '/admin/resources'}, {label: 'Drafts in progress', value: stats.drafts, Icon: FileText, href: '/admin/resources?status=DRAFT'}, {label: 'Published', value: stats.published, Icon: CheckCircle2, href: '/admin/resources?status=PUBLISHED'}].map(({label, value, Icon, href}) => <Link key={label} href={href} className="workspace-stat"><span><Icon size={19}/>{label}</span><strong>{value}</strong><small>{label === 'Published' ? 'Available in your database catalog' : label === 'Drafts in progress' ? 'Ready for your next idea' : 'Across all resource types'}</small></Link>)}</div>
    <section className="workspace-collection"><div className="admin-collection-bar"><div><h2>Your collection</h2><span>{total} matching resources</span></div><form action="/admin/resources" className="admin-search" key={href(1)}>{type && <input type="hidden" name="type" value={type}/>}<Search size={17}/><label htmlFor="admin-search" className="sr-only">Search resources</label><input id="admin-search" name="q" type="search" maxLength={200} defaultValue={query} placeholder="Search titles or slugs…"/><label htmlFor="admin-status" className="sr-only">Publishing status</label><SelectMenu id="admin-status" name="status" defaultValue={status ?? ''}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></SelectMenu><StudioPageSize value={size}/><button type="submit">Search</button></form></div>
    {rows.length ? <BulkStatus key={href(page)} entries={rows.map(row => ({id: row.id, title: row.title, version: row.version, updatedAt: row.updatedAt.toISOString()}))} noun="resources" update={bulkResourceStatus} remove={deleteResources}><div className="workspace-list-labels bulk-resource-labels" aria-hidden="true"><span>Resource</span><span>Status</span><span>Access</span><span>Last edited</span></div><div className="admin-resource-list">{rows.map(row => <div className="bulk-resource-row" key={row.id}><BulkRowCheckbox id={row.id} title={row.title}/><Link href={`/admin/resources/${row.id}`} className="admin-resource-row"><span className="admin-resource-symbol"><Files size={21}/></span><div><span className="admin-resource-kind">{resourceDefinitions[row.type].name}</span><h3>{row.title}</h3><small>/{row.slug}{['COURSE', 'PATH'].includes(row.type) ? ` · ${row._count.items} items` : ''}</small></div><span className="admin-status studio-status-tone" data-status={row.status}>{row.status.toLowerCase()}</span><span className="admin-resource-access">{row.access === 'PUBLIC' ? 'Public' : row.access === 'PAID' ? 'Paid' : 'Free account'}</span><time dateTime={row.updatedAt.toISOString()} className="workspace-updated">{row.updatedAt.toISOString().slice(0, 10)}</time></Link><BulkRowDelete id={row.id} title={row.title}/></div>)}</div></BulkStatus> : <div className="admin-empty"><Files size={36}/><h2>{query || status || type ? 'Nothing here just yet.' : 'Start with something useful.'}</h2><p>{query ? 'Try another search or clear your filters.' : 'Build a project, write an article, or bring lessons together into a course.'}</p><Link className="button button-outline" href={query ? '/admin/resources' : createHref}>{query ? 'Clear filters' : 'Create your first resource'}</Link></div>}
    <CatalogPagination page={page} pages={pages} href={href} label="Studio resource pages"/></section></>;
}
