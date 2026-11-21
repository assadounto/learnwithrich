import type {MetadataRoute} from 'next';
import {resources as legacyResources} from '@/lib/catalog';
import {database} from '@/lib/server/database';

const origin = 'https://learnwithrich.com';
const fixedPages = [
  '', '/about', '/projects', '/courses', '/resources', '/services/request', '/privacy',
];

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const published = await database().resource.findMany({
    where: {status: 'PUBLISHED', publishedAt: {lte: now}},
    select: {slug: true, updatedAt: true, publishedAt: true},
    orderBy: {publishedAt: 'desc'},
  });
  const entries: MetadataRoute.Sitemap = fixedPages.map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
  const slugs = new Set(published.map((item) => item.slug));
  for (const item of legacyResources) {
    if (!slugs.has(item.slug)) entries.push({url: `${origin}/resources/${item.slug}`, changeFrequency: 'monthly', priority: 0.6});
  }
  for (const item of published) {
    entries.push({
      url: `${origin}/resources/${item.slug}`,
      lastModified: item.updatedAt || item.publishedAt || now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }
  return entries;
}
