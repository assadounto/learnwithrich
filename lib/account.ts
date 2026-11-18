export type AccountUser = { id: number|string; name: string; avatar_url: string|null };

export function imageUrl(value: unknown): string|null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, 'https://api.xonbay.com');
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** Expose only the fields used by the header, never the upstream account payload. */
export function accountSummary(value: Record<string, unknown>): AccountUser {
  return {
    id: typeof value.id === 'number' || typeof value.id === 'string' ? value.id : '',
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim() : 'Maker',
    avatar_url: [value.photo_url, value.avatar_url, value.image].map(imageUrl).find(Boolean) || null,
  };
}
export function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase() || 'M';
}
