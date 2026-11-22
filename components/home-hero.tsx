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
  const [phase, setPhase] = useState(preset === 'CENTERED' ? 'centered-static' : 'intro');

  useEffect(() => {
    if (preset !== 'CINEMATIC' || !videoUrl) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const player = video.current;
    if (!player) return;
    let delayElapsed = false;
    let videoReady = player.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;
    let transitionStarted = false;
    let playTimer: ReturnType<typeof setTimeout> | undefined;
    const beginTransition = () => {
      if (!delayElapsed || !videoReady || transitionStarted) return;
      transitionStarted = true;
      setPhase('center-copy');
      playTimer = setTimeout(() => {
        void player.play().then(() => setPhase('video')).catch(() => {player.pause(); setPhase('intro');});
      }, 1250);
    };
    const onCanPlayThrough = () => {
      videoReady = true;
      beginTransition();
    };
    const onBufferedCanPlay = () => {
      const bufferedEnd = player.buffered.length ? player.buffered.end(player.buffered.length - 1) : 0;
      const hasWholeClip = Number.isFinite(player.duration) && player.duration > 0 && bufferedEnd >= player.duration - 0.35;
      if (player.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA || hasWholeClip) {
        videoReady = true;
        beginTransition();
      }
    };
    const onVideoError = () => {
      videoReady = false;
      player.pause();
      if (transitionStarted) {if (playTimer) clearTimeout(playTimer); setPhase('intro');}
    };
    player.addEventListener('canplaythrough', onCanPlayThrough);
    player.addEventListener('canplay', onBufferedCanPlay);
    player.addEventListener('progress', onBufferedCanPlay);
    player.addEventListener('error', onVideoError);
    if (videoReady) onCanPlayThrough();
    const startTimer = setTimeout(() => {delayElapsed = true; beginTransition();}, Math.max(3, Math.min(delaySeconds, 12)) * 1000);
    return () => {
      player.removeEventListener('canplaythrough', onCanPlayThrough);
      player.removeEventListener('canplay', onBufferedCanPlay);
      player.removeEventListener('progress', onBufferedCanPlay);
      player.removeEventListener('error', onVideoError);
      clearTimeout(startTimer);
      if (playTimer) clearTimeout(playTimer);
      player.pause();
    };
  }, [preset, videoUrl, delaySeconds]);

  const active = preset === 'CINEMATIC' && !!videoUrl;
  const centeredImage = preset === 'CENTERED' ? imageUrl : null;
  return <section className={`reference-hero home-hero-preset-${preset.toLowerCase()}${preset !== 'CLASSIC' ? ' home-hero-fullbleed' : ''}${active ? ' home-hero-cinematic' : ''}`} data-hero-phase={active ? phase : preset === 'CENTERED' ? 'centered-static' : 'intro'}>
    {centeredImage && <div className="home-hero-image" role="img" aria-label="Selected LearnWithRich hero background" style={{backgroundImage: `url("${centeredImage}")`}}/>}
    {preset === 'CINEMATIC' && videoUrl && <div className="home-hero-video" aria-hidden="true"><video ref={video} src={videoUrl} muted playsInline loop preload="auto"/></div>}
    <div className="ref-container ref-hero-inner">
      {active ? <>
        <HeroCopy className="ref-hero-copy hero-copy-intro" hidden={phase !== 'intro'}/>
        <HeroCopy className={`ref-hero-copy hero-copy-arriving${phase !== 'intro' ? ' is-visible' : ''}`} hidden={phase === 'intro'}/>
      </> : <HeroCopy className="ref-hero-copy"/>}
      {(preset === 'CLASSIC' || active) && <div className="ref-hero-art" role="img" aria-label="Maker collage with an ESP32 board, Practical Maker book, African portrait illustrations and a project notebook"/>}
    </div>
  </section>;
}
