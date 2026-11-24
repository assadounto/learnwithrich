export const bookmarkEvent = 'lwr-saved-change';
const storageKey = 'lwr-saved';

export function readBrowserBookmarks(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(data) ? [...new Set(data.filter((value): value is string => typeof value === 'string'))] : [];
  } catch { return []; }
}

export function writeBrowserBookmarks(slugs: string[]) {
  localStorage.setItem(storageKey, JSON.stringify([...new Set(slugs)]));
  window.dispatchEvent(new Event(bookmarkEvent));
}
