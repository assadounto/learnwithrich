const publicRoots = new Set([
  'about', 'articles', 'books', 'courses', 'guestbook', 'illustrations', 'lessons', 'library',
  'paths', 'privacy', 'project-ideas', 'projects', 'resource-package', 'resources', 'reviews',
  'search', 'services', 'terms',
]);

export function publicAnalyticsPath(value: unknown): string | null {
  if (value === '/') return '/';
  if (typeof value !== 'string' || value.length > 240 || !/^\/[a-z0-9-]+(?:\/[a-z0-9-]+){0,3}\/?$/.test(value)) return null;
  const path = value.replace(/\/$/, '');
  return publicRoots.has(path.split('/')[1]) ? path : null;
}
