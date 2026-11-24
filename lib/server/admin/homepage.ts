import {homepageHeroMedia, homepageHeroPresets, type HomepageHeroEditor, type HomepageHeroSettings} from '../../home-hero.ts';
import type {Database} from '../database-client';
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

export const defaultHomepageHero: HomepageHeroSettings = {
  preset: 'CLASSIC', imageAssetId: null, mobileImageAssetId: null,
  videoAssetId: null, mobileVideoAssetId: null, delaySeconds: 5, videoEnabled: false,
};

export function validateHomepageHero(input: unknown): HomepageHeroSettings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ResourceInputError('Invalid homepage hero settings.');
  const row = input as Record<string, unknown>;
  const preset = enumValue(row.preset, homepageHeroPresets, 'hero preset');
  const hero = {...defaultHomepageHero, preset};
  for (const slot of homepageHeroMedia) {
    const value = row[slot.field];
    hero[slot.field] = value == null || value === '' ? null : resourceId(value);
  }
  const delaySeconds = row.delaySeconds;
  if (typeof delaySeconds !== 'number' || !Number.isInteger(delaySeconds) || delaySeconds < 3 || delaySeconds > 12) throw new ResourceInputError('Choose a hero video delay from 3 to 12 seconds.');
  if (preset === 'CINEMATIC' && !hero.videoAssetId && !hero.mobileVideoAssetId) throw new ResourceInputError('Choose at least one video for the cinematic preset.');
  if (row.videoEnabled !== undefined && typeof row.videoEnabled !== 'boolean') throw new ResourceInputError('Choose whether to play hero video.');
  return {...hero, delaySeconds, videoEnabled: preset === 'CINEMATIC' || row.videoEnabled === true};
}

export const homepageHeroSelect = {
  heroPreset: true, heroImageAssetId: true, heroMobileImageAssetId: true,
  heroVideoAssetId: true, heroMobileVideoAssetId: true, heroVideoEnabled: true, heroDelaySeconds: true,
} as const;

type HeroRow = Record<(typeof homepageHeroMedia)[number]['column'], string | null> & {
  heroPreset: string;
  heroDelaySeconds: number;
  heroVideoEnabled: boolean;
};

export async function loadHomepageHero(db: Pick<Database, 'mediaAsset'>, settings: HeroRow | null): Promise<HomepageHeroEditor> {
  const hero: HomepageHeroEditor = {
    ...defaultHomepageHero, imageName: null, mobileImageName: null, videoName: null, mobileVideoName: null,
  };
  if (!settings) return hero;
  hero.preset = homepageHeroPresets.find(preset => preset === settings.heroPreset) ?? hero.preset;
  hero.delaySeconds = settings.heroDelaySeconds;
  hero.videoEnabled = settings.heroVideoEnabled;
  const ids = homepageHeroMedia.map(slot => settings[slot.column]).filter((id): id is string => id !== null);
  const assets = ids.length ? await db.mediaAsset.findMany({where: {id: {in: ids}}, select: {id: true, originalName: true, mimeType: true}}) : [];
  const byId = new Map(assets.map(asset => [asset.id, asset]));
  for (const slot of homepageHeroMedia) {
    const asset = byId.get(settings[slot.column] ?? '');
    if (!asset || !heroMediaMatches(slot.kind, asset.mimeType)) continue;
    hero[slot.field] = asset.id;
    hero[slot.name] = asset.originalName;
  }
  return hero;
}

export function heroMediaMatches(kind: 'image' | 'video', mimeType: string | undefined) {
  return kind === 'image' ? Boolean(mimeType?.startsWith('image/')) : mimeType === 'video/mp4' || mimeType === 'video/webm';
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
