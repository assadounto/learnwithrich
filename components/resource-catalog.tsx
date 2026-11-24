import {Layers, LayoutGrid, Search} from 'lucide-react';
import Link from '@/components/navigation-link';
import {OwnedResourceGrid} from './owned-resource-card';
import {CatalogPagination} from './catalog-pagination';
import {ResourceSwipeDeck} from './resource-swipe-deck';
import {type browseCatalog, pageSize} from '@/lib/server/resources/browse';
import {resourceDefinitions} from '@/lib/resource-types';
import {resourceTypes} from '@/lib/server/resources/validation';

export function ResourceCatalog({data, path}: {data: Awaited<ReturnType<typeof browseCatalog>>; path: '/projects' | '/resources'}) {
  const {items, total, page, pages, tags, type, q, tag, swipe, filters} = data;
  const isProjects = path === '/projects';
  const singular = isProjects ? 'project' : 'resource';
  const anchor = isProjects ? 'project-collection' : 'catalog-results';

  function href(number: number, deck = swipe) {
    const next = new URLSearchParams(filters);
    if (number > 1) next.set('page', String(number));
    if (deck) next.set('mode', 'swipe');
    return `${path}${next.size ? `?${next}` : ''}#${anchor}`;
  }

  return <>
    <form action={`${path}#${anchor}`} method="get" className="browse-controls" key={`${q}:${type ?? ''}:${tag}`}>
      <label>Search<input type="search" name="q" placeholder="Try Arduino or web apps" defaultValue={q} maxLength={200}/></label>
      {!isProjects && <label>Resource type<select name="type" defaultValue={type ?? ''}>
        <option value="">All types</option>{resourceTypes.map(key => <option key={key} value={key}>{resourceDefinitions[key].plural}</option>)}
      </select></label>}
      <label>Tag<select name="tag" defaultValue={tag}>
        <option value="">All tags</option>
        {tag && !tags.includes(tag) && <option value={tag}>{tag}</option>}
        {tags.map(name => <option value={name} key={name}>{name}</option>)}
      </select></label>
      {swipe && <input type="hidden" name="mode" value="swipe"/>}
      <button className="button button-dark" type="submit"><Search size={16}/>Apply filters</button>
    </form>
    <div className="browse-toolbar">
      <div><p>{total ? `Showing ${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + items.length} of ${total}` : '0'} {singular}{total === 1 ? '' : 's'}</p>
        {(q || tag || (!isProjects && type)) && <Link href={`${path}${swipe ? '?mode=swipe' : ''}#${anchor}`}>Clear filters</Link>}
      </div>
      {!!items.length && <Link className="button button-outline" href={href(page, !swipe)}>
        {swipe ? <><LayoutGrid size={17}/>Grid view</> : <><Layers size={17}/>Swipe mode</>}
      </Link>}
    </div>
    {items.length ? swipe
      ? <ResourceSwipeDeck key={`${path}:${filters}:${page}`} items={items} nextHref={page < pages ? href(page + 1) : undefined}/>
      : <OwnedResourceGrid items={items}/>
      : <div className="owned-catalog-empty"><h2>No {singular}s found.</h2><p>Try a different search or tag.</p></div>}
    <CatalogPagination page={page} pages={pages} href={href} label={isProjects ? 'Project pages' : 'Resource pages'}/>
  </>;
}
