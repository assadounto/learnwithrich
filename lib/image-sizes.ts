// Image delivery routes only generate these sizes.
export const publicImageWidths = [96, 192, 384, 768, 1280, 1920] as const;
export type PublicImageWidth = (typeof publicImageWidths)[number];

const publicMediaPath = /^\/api\/public-media\/[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

const resourceMediaPath = /^\/api\/(?:resource-assets|resource-files)\/[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}\?(?:slug|resourceId)=[^&#]+$/i;

function responsiveImageAttributes(src: string, widths: readonly PublicImageWidth[], sizes: string) {
  if (widths.length === 0) return {src};
  const separator = src.includes('?') ? '&' : '?';
  const url = (width: PublicImageWidth) => `${src}${separator}width=${width}`;
  if (widths.length === 1) return {src: url(widths[0])};
  return {
    src: url(widths[Math.floor(widths.length / 2)]),
    srcSet: widths.map(width => `${url(width)} ${width}w`).join(', '),
    sizes,
  };
}

export function publicImageAttributes(src: string, widths: readonly PublicImageWidth[], sizes: string) {
  return publicMediaPath.test(src) ? responsiveImageAttributes(src, widths, sizes) : {src};
}

export function resourceImageAttributes(src: string, widths: readonly PublicImageWidth[], sizes: string) {
  return resourceMediaPath.test(src)
    ? responsiveImageAttributes(src, widths, sizes)
    : publicImageAttributes(src, widths, sizes);
}
