'use client';
import {publicImageAttributes} from '@/lib/image-sizes';

import {useState} from 'react';
import {Maximize2} from 'lucide-react';

export type ResourceGalleryImage = {src: string; alt: string; label: string};

export function ResourceDetailGallery({images, kind, title}: {images: ResourceGalleryImage[]; kind: string; title: string}) {
  const [active, setActive] = useState(0);
  const selected = images[active];
  return <div className="resource-detail-gallery">
    <div className="resource-gallery-stage">
      {selected ? <img {...publicImageAttributes(selected.src, [384, 768, 1280], "(max-width: 800px) 92vw, 60vw")} alt={selected.alt} fetchPriority="high" decoding="async"/> : <div className="owned-detail-cover-empty"><span>{kind}</span><span className="resource-gallery-placeholder-mark" aria-hidden="true">✳</span><small>LEARN · BUILD · SHARE</small></div>}
      <span className="resource-gallery-kind">{kind}</span>
      {selected && <a className="resource-gallery-open" href={selected.src} target="_blank" rel="noreferrer" aria-label={`Open full-size image for ${title}`}><Maximize2 size={17}/></a>}
    </div>
    {images.length > 1 && <div className="resource-gallery-thumbnails" aria-label="More resource images">
      {images.map((image, index) => <button key={`${image.src}-${index}`} type="button" aria-label={`Show image ${index + 1}: ${image.label}`} aria-pressed={active === index} onClick={() => setActive(index)}>
        <img {...publicImageAttributes(image.src, [192], "96px")} alt="" loading="lazy" decoding="async"/>
      </button>)}
    </div>}
    {selected && images.length > 1 && <p className="resource-gallery-caption">{selected.label}</p>}
  </div>;
}
