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
  bodyMarkdown: string; tags: string[];
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
    let url: URL;
    try { url = new URL(coverUrl); } catch { throw new ResourceInputError('Invalid cover URL.'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new ResourceInputError('Use a public HTTPS cover URL.');
  }
  return {
    slug: resourceSlug(value.slug), type, title: text(value.title, 'title', 180),
    summary: text(value.summary ?? '', 'summary', 2000, false), coverUrl, access, priceMinor, currency,
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
