import type {CSSProperties} from 'react';
import {ReferenceArt} from './reference-art';
const areas={
 book:[33,245,109,100,'Practical Maker book cover'],
 guide:[279,246,104,100,'Smart Energy Project Guide cover'],
 makers:[512,247,110,98,'African maker illustration'],
 solar:[802,158,397,184,'Solar hybrid controller prototype'],
 'solar-card':[33,365,109,100,'Solar hybrid controller prototype'],
 web:[278,365,106,101,'Maker marketplace web project'],
 illustration:[514,365,105,101,'Circuit illustration resource cover'],
 esp:[262,658,295,220,'ESP32 breadboard project'],
 led:[577,695,60,56,'LED controller example'],
 sensor:[578,773,59,55,'Temperature sensor example'],
 board:[884,349,64,46,'ESP32 development board'],
 relay:[961,349,58,46,'Relay module'],
 panel:[1036,349,55,46,'Solar panel'],
 diagram:[1111,349,68,46,'System block illustration'],
} as const;
export type WorkspaceArtKind=keyof typeof areas|'studio-solar'|'studio-energy'|'studio-web';
export function WorkspaceArt({kind,className=''}:{kind:WorkspaceArtKind;className?:string}){if(kind.startsWith('studio-'))return <div role="img" aria-label={kind==='studio-web'?'Illustrative marketplace website concept':kind==='studio-energy'?'Illustrative energy monitor concept':'Illustrative solar controller concept'} className={`workspace-art folio-project-image studio-photo-${kind.slice(7)} ${className}`}/>;if(kind==='esp')return <ReferenceArt kind="esp" className={`workspace-art ${className}`}/>;const [x,y,w,h,alt]=areas[kind as keyof typeof areas];const style:CSSProperties={aspectRatio:`${w}/${h}`,backgroundImage:"url('/images/page-reference.webp')",backgroundSize:`${1536/w*100}% ${1024/h*100}%`,backgroundPosition:`${x/(1536-w)*100}% ${y/(1024-h)*100}%`};return <div role="img" aria-label={alt} className={`workspace-art ${className}`} style={style}/>}
export function artFor(slug:string):WorkspaceArtKind {return ({'practical-maker':'book','smart-energy-project-guide':'guide','african-makers':'makers','solar-hybrid-power-system':'solar-card','maker-marketplace':'web','creative-circuit-illustrations':'illustration','esp32-first-connected-device':'esp','smart-energy-monitor':'guide','build-a-web-app':'web'} as Record<string,WorkspaceArtKind>)[slug]||'book'}
