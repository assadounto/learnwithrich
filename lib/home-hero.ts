export const homepageHeroPresets = ['CLASSIC', 'CENTERED', 'CINEMATIC', 'SPOTLIGHT', 'EDITORIAL'] as const;
export type HomepageHeroPreset = (typeof homepageHeroPresets)[number];

export function homepageHeroSupportsVideo(preset: HomepageHeroPreset) {
  return preset === 'CINEMATIC' || preset === 'EDITORIAL';
}

export const homepageHeroMedia = [
  {field: 'imageAssetId', name: 'imageName', column: 'heroImageAssetId', kind: 'image', label: 'Desktop image'},
  {field: 'mobileImageAssetId', name: 'mobileImageName', column: 'heroMobileImageAssetId', kind: 'image', label: 'Mobile image'},
  {field: 'videoAssetId', name: 'videoName', column: 'heroVideoAssetId', kind: 'video', label: 'Desktop video'},
  {field: 'mobileVideoAssetId', name: 'mobileVideoName', column: 'heroMobileVideoAssetId', kind: 'video', label: 'Mobile video'},
] as const;

export type HomepageHeroSettings = Record<(typeof homepageHeroMedia)[number]['field'], string | null> & {
  preset: HomepageHeroPreset;
  delaySeconds: number;
  videoEnabled: boolean;
};

export type HomepageHeroEditor = HomepageHeroSettings & Record<(typeof homepageHeroMedia)[number]['name'], string | null>;
