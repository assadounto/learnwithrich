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
    if (motion.matches) {setPhase('centered-static'); return;}
    let playTimer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = setTimeout(() => {
      setPhase('center-copy');
      playTimer = setTimeout(() => {
        const player = video.current;
        if (player) void player.play().then(() => setPhase('video')).catch(() => setPhase('centered-static'));
      }, 1250);
    }, Math.max(3, Math.min(delaySeconds, 12)) * 1000);
    return () => {clearTimeout(startTimer); if (playTimer) clearTimeout(playTimer); video.current?.pause();};
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
      {preset === 'CLASSIC' && <div className="ref-hero-art" role="img" aria-label="Maker collage with an ESP32 board, Practical Maker book, African portrait illustrations and a project notebook"/>}
    </div>
  </section>;
}
