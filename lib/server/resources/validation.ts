import {resourceDefinitions, type ResourceDetails} from '../../resource-types.ts';
export const resourceTypes = ['PROJECT', 'ARTICLE', 'COURSE', 'PATH', 'LESSON', 'DOWNLOAD', 'BOOK', 'GUIDE', 'ILLUSTRATION'] as const;
export const resourceAccess = ['PUBLIC', 'FREE_ACCOUNT', 'PAID'] as const;
export type ResourceKind = typeof resourceTypes[number];
export type AccessMode = typeof resourceAccess[number];
export class ResourceInputError extends Error {}

export function text(value: unknown, name: string, maximum: number, required = true) {
  if (typeof value !== 'string' || value.length > maximum || (required && !value.trim())) {
    throw new ResourceInputError(`Invalid ${name}.`);
  }
  return value.trim();
}
export function resourceSlug(value: unknown) {
  const slug = text(value, 'slug', 120);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new ResourceInputError('Use a lowercase, hyphenated slug.');
  return slug;
}
export function resourceId(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(value)) throw new ResourceInputError('Invalid resource ID.');
  return value;
}
function safeResourceUrl(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
function safeCoverUrl(value: string) {
  return /^\/api\/public-media\/[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(value) || safeResourceUrl(value);
}
export function enumValue<T extends string>(value: unknown, allowed: readonly T[], name: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new ResourceInputError(`Invalid ${name}.`);
  return value as T;
}
export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 20) throw new ResourceInputError('Use at most 20 tags.');
  return [...new Set(value.map(tag => text(tag, 'tag', 60).toLowerCase()))];
}
export type ResourceDraft = {
  slug: string; type: ResourceKind; title: string; summary: string;
  coverUrl: string | null; access: AccessMode; priceMinor: number; currency: string;
  bodyMarkdown: string; tags: string[]; details: ResourceDetails;
};
export function validateDraft(input: unknown): ResourceDraft {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ResourceInputError('Invalid resource.');
  const value = input as Record<string, unknown>;
  const type = enumValue(value.type, resourceTypes, 'resource type');
  const access = enumValue(value.access ?? 'PUBLIC', resourceAccess, 'access mode');
  const priceMinor = value.priceMinor ?? 0;
  if (typeof priceMinor !== 'number' || !Number.isSafeInteger(priceMinor) || priceMinor < 0 || priceMinor > 2147483647 || (access === 'PAID' ? priceMinor === 0 : priceMinor !== 0)) {
    throw new ResourceInputError('Paid resources need a positive price; public and free-account resources must be free.');
  }
  const currency = text(value.currency ?? 'GHS', 'currency', 3);
  if (!/^[A-Z]{3}$/.test(currency)) throw new ResourceInputError('Use a three-letter uppercase currency.');
  let coverUrl: string | null = null;
  if (value.coverUrl != null && value.coverUrl !== '') {
    coverUrl = text(value.coverUrl, 'cover URL', 2048);
    if (!safeCoverUrl(coverUrl)) throw new ResourceInputError('Use a public HTTPS URL or a published media library image.');
  }
  return {
    slug: resourceSlug(value.slug), type, title: text(value.title, 'title', 180),
    summary: text(value.summary ?? '', 'summary', 2000, false), coverUrl, access, priceMinor, currency,
    details: normalizeDetails(type, value.details ?? {}),
    bodyMarkdown: text(value.bodyMarkdown ?? '', 'body', 200000, false), tags: normalizeTags(value.tags ?? []),
  };
}
export function catalogQuery(params: URLSearchParams) {
  const type = params.get('type');
  const rawPage = params.get('page') ?? '1';
  const rawLimit = params.get('limit') ?? '12';
  if (!/^\d+$/.test(rawPage) || !/^\d+$/.test(rawLimit)) throw new ResourceInputError('Invalid pagination.');
  const page = Number(rawPage), limit = Number(rawLimit);
  if (page < 1 || page > 1000 || limit < 1 || limit > 48) throw new ResourceInputError('Page must be 1–1000 and limit 1–48.');
  const query = text(params.get('q') ?? '', 'search', 200, false);
  const tag = params.has('tag') ? text(params.get('tag'), 'tag', 60).toLowerCase() : undefined;
  return {type: type ? enumValue(type.toUpperCase(), resourceTypes, 'resource type') : undefined, query, tag, page, limit};
}

export function normalizeDetails(type: ResourceKind, input: unknown): ResourceDetails {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ResourceInputError('Invalid resource details.');
  const fields = resourceDefinitions[type].fields;
  const result: ResourceDetails = {};
  for (const [key, raw] of Object.entries(input)) {
    const field = fields.find(field => field.key === key);
    if (!field) throw new ResourceInputError('This detail does not belong to the selected resource type.');
    if (raw === '' || raw == null) continue;
    if (field.kind === 'number') {
      if (typeof raw !== 'number' || !Number.isSafeInteger(raw) || raw < 1 || raw > (field.max ?? 100000)) throw new ResourceInputError(`Invalid ${field.label.toLowerCase()}.`);
      result[key] = raw;
    } else if (field.kind === 'list') {
      if (!Array.isArray(raw) || raw.length > 30) throw new ResourceInputError(`Use at most 30 entries for ${field.label.toLowerCase()}.`);
      result[key] = raw.map(value => text(value, field.label, 500));
    } else {
      const value = text(raw, field.label, field.kind === 'url' ? 2048 : 1000);
      if (field.kind === 'select' && !field.options?.includes(value)) throw new ResourceInputError(`Invalid ${field.label.toLowerCase()}.`);
      if (field.kind === 'url') {
        if (!safeResourceUrl(value)) throw new ResourceInputError('Resource links must use HTTPS or a media library file, without embedded credentials.');
      }
      result[key] = value;
    }
  }
  return result;
}
