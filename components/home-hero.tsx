'use client';

import {useEffect, useRef, useState} from 'react';
import Link from '@/components/navigation-link';
import {ArrowUpRight} from 'lucide-react';
import {DrawnUnderline, AccentRays} from './decorative-marks';

type Preset = 'CLASSIC' | 'CENTERED' | 'CINEMATIC';

function HeroCopy({className, hidden = false}: {className: string; hidden?: boolean}) {
  return <div className={className} aria-hidden={hidden || undefined} inert={hidden || undefined}>
    <div className="ref-eyebrow">THE INTERNET IS FULL OF IDEAS. LET’S BUILD SOME.<DrawnUnderline className="orange-scribble"/></div>
    <h1><span className="hero-title-line">A little <i>curiosity.</i> </span><span className="hero-title-line">A lot of possibility.</span><AccentRays className="hero-rays"/></h1>
    <p>Projects, books, illustrations and practical<br className="ref-desktop-break"/> courses by Richmond Adu-Kyere.</p>
    <div className="ref-hero-actions"><Link className="button button-orange" href="/projects">Find your next project</Link><Link className="text-link" href="/services/request">Request a service <ArrowUpRight size={18}/></Link></div>
  </div>;
}

export function HomeHero({preset, imageUrl, videoUrl, delaySeconds}: {preset: Preset; imageUrl: string | null; videoUrl: string | null; delaySeconds: number}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playingSource, setPlayingSource] = useState<string | null>(null);

  useEffect(() => {
    const player = video.current;
    if (preset !== 'CINEMATIC' || !videoUrl || !player) return;
    const source = videoUrl;
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
      if (!player.getAttribute('src')) player.src = source;
      void player.play().catch((error: unknown) => {
        if (disposed || (error instanceof DOMException && error.name === 'AbortError')) return;
        failed = true;
        setPlayingSource(null);
      }).finally(() => {
        starting = false;
      });
    };
    const onPlaying = () => { if (canPlay()) setPlayingSource(source); };
    const onError = () => { failed = true; setPlayingSource(null); };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, {threshold: 0.08}) : null;
    if (player.parentElement) observer?.observe(player.parentElement);
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
  }, [preset, videoUrl, delaySeconds]);

  const active = preset === 'CINEMATIC' && !!videoUrl;
  const showVideo = active && playingSource === videoUrl;
  const layoutPreset = preset === 'CINEMATIC' && !active ? 'CLASSIC' : preset;
  const centeredImage = preset === 'CENTERED' ? imageUrl ?? '/images/hero-collage.webp' : null;
  return <section className={`reference-hero home-hero-preset-${layoutPreset.toLowerCase()}${layoutPreset !== 'CLASSIC' ? ' home-hero-fullbleed' : ''}${active ? ' home-hero-cinematic' : ''}`} data-hero-phase={showVideo ? 'video' : preset === 'CENTERED' ? 'centered-static' : 'intro'}>
    {centeredImage && <div className="home-hero-image" role="img" aria-label="Selected LearnWithRich hero background" style={{backgroundImage: `url("${centeredImage}")`}}/>}
    {preset === 'CINEMATIC' && videoUrl && <div className="home-hero-video" aria-hidden="true"><video ref={video} muted playsInline loop preload="none"/></div>}
    <div className="ref-container ref-hero-inner">
      {active ? <>
        <HeroCopy className="ref-hero-copy hero-copy-intro" hidden={showVideo}/>
        <HeroCopy className={`ref-hero-copy hero-copy-arriving${showVideo ? ' is-visible' : ''}`} hidden={!showVideo}/>
      </> : <HeroCopy className="ref-hero-copy"/>}
      {(layoutPreset === 'CLASSIC' || active) && <div className="ref-hero-art" role="img" aria-label="Maker collage with an ESP32 board, Practical Maker book, African portrait illustrations and a project notebook"/>}
    </div>
  </section>;
}
