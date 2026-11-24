import 'server-only';
import {disciplines} from '@/lib/project-ideas';
import {slugFromTitle} from '@/lib/resource-types';
import {database} from './database';

export class IdeaInputError extends Error {}

export function ideaFields(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new IdeaInputError('Send an idea object.');
  const values = input as Record<string, unknown>;
  const title = typeof values.title === 'string' ? values.title.trim() : '';
  const discipline = typeof values.discipline === 'string' ? values.discipline : '';
  const abstract = typeof values.abstract === 'string' ? values.abstract.trim() : '';
  if (title.length < 3 || title.length > 180) throw new IdeaInputError('Use a title between 3 and 180 characters.');
  if (!disciplines.some(item => item.id === discipline)) throw new IdeaInputError('Choose a supported discipline.');
  if (abstract.length < 40 || abstract.length > 3000) throw new IdeaInputError('Use an abstract between 40 and 3,000 characters.');
  if (!Array.isArray(values.tags) || values.tags.length > 12 || values.tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.trim().length > 40)) {
    throw new IdeaInputError('Use up to 12 tags of 1 to 40 characters each.');
  }
  return {title, discipline, abstract, tags: [...new Set<string>(values.tags.map(tag => tag.trim().toLowerCase()))]};
}

export function ideaSlug(title: string, supplied?: unknown) {
  const slug = supplied === undefined || supplied === '' ? slugFromTitle(title) : supplied;
  if (typeof slug !== 'string' || slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new IdeaInputError('Use a lowercase URL slug with words separated by hyphens.');
  }
  return slug;
}

export function publishedIdea(slug: unknown) {
  if (typeof slug !== 'string' || slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return database().projectIdea.findFirst({where: {slug, status: 'PUBLISHED'}});
}
