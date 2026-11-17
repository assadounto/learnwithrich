import type { CSSProperties } from 'react';
// Only artwork regions are displayed. All website text and controls remain native HTML.
const regions = {
 solar: [18, 638, 214, 169, 'Solar hybrid power controller with a solar panel'],
 energy: [244, 638, 213, 169, 'Smart energy monitor on a desk'],
 web: [470, 638, 212, 169, 'Marketplace website on a laptop'],
 book: [282, 932, 118, 152, 'Practical Maker book cover'],
 guide: [416, 935, 117, 149, 'Smart Energy Project Guide cover'],
 illustration: [551, 935, 110, 149, 'Creative Circuit Illustrations cover'],
 esp: [24, 1177, 165, 127, 'ESP32 breadboard with jumper wires'],
 code: [359, 1177, 165, 127, 'Web application source code on a laptop'],
 stamp: [43, 1334, 108, 83, 'Handwritten orange RA initials on paper'],
} as const;
export type ReferenceArtKind = keyof typeof regions;
export function ReferenceArt({kind,className=''}:{kind:ReferenceArtKind;className?:string}) {
 const [x,y,w,h,label]=regions[kind];
 const style:CSSProperties={aspectRatio:`${w}/${h}`,backgroundImage:"url('/images/home-reference.webp')",backgroundSize:`${699/w*100}% ${1536/h*100}%`,backgroundPosition:`${x/(699-w)*100}% ${y/(1536-h)*100}%`};
 return <div className={`reference-art reference-art-${kind} ${className}`} role="img" aria-label={label} style={style}/>;
}
