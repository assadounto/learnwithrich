'use client';

import {useEffect, useRef, useState} from 'react';
import Link from '@/components/navigation-link';
import {publicImageAttributes} from '@/lib/image-sizes';
import {ArrowUpRight} from 'lucide-react';
import {DrawnUnderline, AccentRays} from './decorative-marks';

import type {HomepageHeroPreset} from '@/lib/home-hero';

const mobileMedia = '(max-width: 580px)';
const collage = {
  src: '/images/hero-collage-960.webp',
  srcSet: '/images/hero-collage-640.webp 640w, /images/hero-collage-960.webp 960w, /images/hero-collage.webp 1254w',
};

function HeroImage({desktop, mobile, full}: {desktop: string | null; mobile: string | null; full: boolean}) {
  const sizes = full ? '100vw' : `${mobileMedia} 100vw, (max-width: 1440px) 51vw, 760px`;
  const standard = desktop ? publicImageAttributes(desktop, [384, 768, 1280, 1920], sizes) : {...collage, sizes};
  const phone = mobile ? publicImageAttributes(mobile, [384, 768, 1280], '100vw') : null;
  return <picture className="home-hero-picture">
    {phone && <source media={mobileMedia} srcSet={phone.srcSet ?? phone.src} sizes="100vw"/>}
    <img {...standard} alt="" width="1254" height="1254" fetchPriority="high" decoding="async"/>
  </picture>;
}

function HeroActions() {
  return <div className="ref-hero-actions">
    <Link className="button button-orange" href="/projects">Find your next project</Link>
    <Link className="text-link" href="/services/request">Request a service <ArrowUpRight size={18}/></Link>
  </div>;
}

function HeroCopy({className, hidden = false}: {className: string; hidden?: boolean}) {
  return <div className={className} aria-hidden={hidden || undefined} inert={hidden || undefined}>
    <div className="ref-eyebrow">THE INTERNET IS FULL OF IDEAS. LET’S BUILD SOME.<DrawnUnderline className="orange-scribble"/></div>
    <h1><span className="hero-title-line">A little <i>curiosity.</i> </span><span className="hero-title-line">A lot of possibility.</span><AccentRays className="hero-rays"/></h1>
    <p>Projects, books, illustrations and practical<br className="ref-desktop-break"/> courses by Richmond Adu-Kyere.</p>
    <HeroActions/>
  </div>;
}

export function HomeHero({preset, imageUrl, mobileImageUrl, videoUrl, mobileVideoUrl, delaySeconds}: {
  preset: HomepageHeroPreset;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  videoUrl: string | null;
  mobileVideoUrl: string | null;
  delaySeconds: number;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [playingSource, setPlayingSource] = useState<string | null>(null);
  const hasVideo = Boolean(videoUrl || mobileVideoUrl);

  useEffect(() => {
    if (!videoUrl && !mobileVideoUrl) {
      setSource(null);
      return;
    }
    const viewport = window.matchMedia(mobileMedia);
    const select = () => setSource(viewport.matches ? mobileVideoUrl ?? videoUrl : videoUrl);
    select();
    viewport.addEventListener('change', select);
    return () => viewport.removeEventListener('change', select);
  }, [videoUrl, mobileVideoUrl]);

  useEffect(() => {
    const player = video.current;
    if (!source || !player) return;
    const playbackSource = source;
    setPlayingSource(null);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & {connection?: {saveData?: boolean}}).connection;
    let visible = !('IntersectionObserver' in window);
    let delayElapsed = false;
    let failed = false;
    let starting = false;
    let disposed = false;

    const canPlay = () => !disposed && !failed && visible && !document.hidden && !motion.matches && !connection?.saveData;
    const sync = () => {
      if (!delayElapsed || !canPlay()) {
        player.pause();
        if (motion.matches) setPlayingSource(null);
        return;
      }
      if (starting || !player.paused) return;
      starting = true;
      if (!player.getAttribute('src')) player.src = playbackSource;
      void player.play().catch((error: unknown) => {
        if (disposed || (error instanceof DOMException && error.name === 'AbortError')) return;
        failed = true;
        setPlayingSource(null);
      }).finally(() => {
        starting = false;
      });
    };
    const onPlaying = () => { if (canPlay()) setPlayingSource(playbackSource); };
    const onError = () => { failed = true; setPlayingSource(null); };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, {threshold: 0.08}) : null;
    observer?.observe(player);
    player.addEventListener('playing', onPlaying);
    player.addEventListener('error', onError);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    const timer = setTimeout(() => {
      delayElapsed = true;
      sync();
    }, Math.max(3, Math.min(delaySeconds, 12)) * 1000);

    return () => {
      disposed = true;
      observer?.disconnect();
      clearTimeout(timer);
      player.removeEventListener('playing', onPlaying);
      player.removeEventListener('error', onError);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
      player.pause();
      player.removeAttribute('src');
      player.load();
    };
  }, [source, delaySeconds, preset]);


  const cinematic = preset === 'CINEMATIC' && hasVideo;
  const full = preset === 'CENTERED' || preset === 'SPOTLIGHT';
  const showVideo = Boolean(source && playingSource === source);
  const clip = hasVideo && <div className="home-hero-video" aria-hidden="true"><video ref={video} muted playsInline loop preload="none"/></div>;
  const picture = <HeroImage desktop={imageUrl} mobile={mobileImageUrl} full={full}/>;
  const className = `reference-hero home-hero-preset-${preset.toLowerCase()}${full || cinematic ? ' home-hero-fullbleed' : ''}${cinematic ? ' home-hero-cinematic' : ''}`;
  return <section className={`${className}${hasVideo ? ' home-hero-has-video' : ''}`} data-hero-phase={showVideo ? 'video' : 'intro'}>
    {full && <div className="home-hero-image" aria-hidden="true">{picture}</div>}
    {clip}
    <div className="ref-container ref-hero-inner">
      <HeroCopy className={`ref-hero-copy${cinematic ? ' hero-copy-intro' : ''}`} hidden={showVideo}/>
      {!full && <div className="ref-hero-art">{picture}</div>}
    </div>
    {showVideo && <div className="hero-video-actions" aria-label="Homepage actions"><HeroActions/></div>}
  </section>;
}
