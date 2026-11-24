import 'server-only';
import {resources} from './index';
import {resourceTypes, type ResourceKind} from './validation';

export type BrowseParams = Record<string, string | string[] | undefined>;
export const pageSize = 12;
const one = (value: BrowseParams[string]) => typeof value === 'string' ? value : '';
export function pageNumber(value: BrowseParams[string]) {
  const raw = one(value);
  return /^\d{1,6}$/.test(raw) ? Math.min(1000, Math.max(1, Number(raw))) : 1;
}

export async function catalogPage(params: URLSearchParams, requestedPage: number) {
  const filters = new URLSearchParams(params);
  filters.set('page', String(requestedPage));
  filters.set('limit', String(pageSize));
  const result = await resources().listPublic(filters);
  const pages = Math.min(1000, Math.max(1, Math.ceil(result.total / pageSize)));
  if (requestedPage <= pages) return {...result, pages};
  filters.set('page', String(pages));
  return {...await resources().listPublic(filters), pages};
}

export async function browseCatalog(params: BrowseParams, fixedType?: ResourceKind) {
  const legacyType = one(params.category).toUpperCase();
  const requestedType = (one(params.type) || legacyType).toUpperCase();
  const type = fixedType ?? resourceTypes.find(value => value === requestedType);
  const q = (one(params.q) || one(params.topic)).trim().slice(0, 200);
  const tag = one(params.tag).trim().slice(0, 60).toLowerCase();
  const swipe = params.mode === 'swipe';
  const filters = new URLSearchParams();
  if (type) filters.set('type', type);
  if (q) filters.set('q', q);
  if (tag) filters.set('tag', tag);
  const [data, tags] = await Promise.all([catalogPage(filters, pageNumber(params.page)), resources().publicTags(fixedType)]);
  if (fixedType) filters.delete('type');
  return {...data, tags, type, q, tag, swipe, filters};
}
