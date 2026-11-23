// The public image route only generates these sizes.
export const publicImageWidths = [96, 192, 384, 768, 1280, 1920] as const;
export type PublicImageWidth = (typeof publicImageWidths)[number];

const publicMediaPath = /^\/api\/public-media\/[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

export function publicImageAttributes(src: string, widths: readonly PublicImageWidth[], sizes: string) {
  if (!publicMediaPath.test(src) || widths.length === 0) return {src};
  const url = (width: PublicImageWidth) => `${src}?width=${width}`;
  if (widths.length === 1) return {src: url(widths[0])};
  return {
    src: url(widths[Math.floor(widths.length / 2)]),
    srcSet: widths.map(width => `${url(width)} ${width}w`).join(', '),
    sizes,
  };
}
