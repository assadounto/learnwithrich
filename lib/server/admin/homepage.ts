import {resourceId, resourceTypes, ResourceInputError, text, enumValue} from '../resources/validation.ts';

export type HomepageSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  type: typeof resourceTypes[number] | 'ALL';
  source: 'AUTO' | 'SELECTED';
  resourceIds: string[];
  limit: number;
};

export const defaultHomepageSections: HomepageSection[] = [{
  id: 'workbench',
  eyebrow: 'THE LEARNWITHRICH LIBRARY',
  title: 'Explore what you can make.',
  description: 'Projects, lessons, courses and practical resources from the workbench.',
  type: 'ALL',
  source: 'AUTO',
  resourceIds: [],
  limit: 9,
}];

export type HomepageHeroPreset = 'CLASSIC' | 'CENTERED' | 'CINEMATIC';
export type HomepageHeroSettings = {preset: HomepageHeroPreset; videoAssetId: string | null; delaySeconds: number};
export const defaultHomepageHero: HomepageHeroSettings = {preset: 'CLASSIC', videoAssetId: null, delaySeconds: 5};

export function validateHomepageHero(input: unknown): HomepageHeroSettings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ResourceInputError('Invalid homepage hero settings.');
  const row = input as Record<string, unknown>;
  const preset = enumValue(row.preset, ['CLASSIC', 'CENTERED', 'CINEMATIC'] as const, 'hero preset');
  const videoAssetId = row.videoAssetId == null || row.videoAssetId === '' ? null : resourceId(row.videoAssetId);
  const delaySeconds = row.delaySeconds;
  if (typeof delaySeconds !== 'number' || !Number.isInteger(delaySeconds) || delaySeconds < 3 || delaySeconds > 12) throw new ResourceInputError('Choose a hero transition delay from 3 to 12 seconds.');
  if (preset === 'CINEMATIC' && !videoAssetId) throw new ResourceInputError('Choose a background video for the cinematic preset.');
  return {preset, videoAssetId, delaySeconds};
}

export function validateHomepageSections(input: unknown): HomepageSection[] {
  if (!Array.isArray(input) || input.length > 12) throw new ResourceInputError('Add no more than 12 homepage sections.');
  const ids = new Set<string>();
  return input.map(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ResourceInputError('Invalid homepage section.');
    const row = value as Record<string, unknown>;
    const id = text(row.id, 'section id', 40);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id)) throw new ResourceInputError('Section names must be unique lowercase words.');
    ids.add(id);
    const type = row.type === 'ALL' ? 'ALL' : enumValue(row.type, resourceTypes, 'resource type');
    const source = enumValue(row.source, ['AUTO', 'SELECTED'] as const, 'section source');
    if (typeof row.limit !== 'number' || !Number.isInteger(row.limit) || row.limit < 1 || row.limit > 12) throw new ResourceInputError('Each section can show 1–12 resources.');
    if (!Array.isArray(row.resourceIds) || row.resourceIds.length > 24) throw new ResourceInputError('Choose up to 24 resources per section.');
    const resourceIds = [...new Set(row.resourceIds.map(resourceId))];
    if (source === 'SELECTED' && !resourceIds.length) throw new ResourceInputError('Choose at least one resource for a selected section.');
    return {
      id,
      eyebrow: text(row.eyebrow ?? '', 'section label', 80, false),
      title: text(row.title, 'section title', 120),
      description: text(row.description ?? '', 'section description', 400, false),
      type,
      source,
      resourceIds,
      limit: row.limit,
    };
  });
}
