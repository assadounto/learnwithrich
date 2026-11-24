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

function HeroCopy({className, hidden = false, actions = true}: {className: string; hidden?: boolean; actions?: boolean}) {
  return <div className={className} aria-hidden={hidden || undefined} inert={hidden || undefined}>
    <div className="ref-eyebrow">THE INTERNET IS FULL OF IDEAS. LET’S BUILD SOME.<DrawnUnderline className="orange-scribble"/></div>
    <h1><span className="hero-title-line">A little <i>curiosity.</i> </span><span className="hero-title-line">A lot of possibility.</span><AccentRays className="hero-rays"/></h1>
    <p>Projects, books, illustrations and practical<br className="ref-desktop-break"/> courses by Richmond Adu-Kyere.</p>
    {actions && <HeroActions/>}
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
    const currentPlayer = video.current;
    if (!source || !currentPlayer) return;
    const player = currentPlayer;
    const playbackSource = source;
    setPlayingSource(null);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & {connection?: {saveData?: boolean}}).connection;
    let visible = !('IntersectionObserver' in window);
    let delayElapsed = false;
    let failed = false;
    let starting = false;
    let playAttempt = 0;
    let disposed = false;
    let repeats = 0;
    let rewindOnPlay = false;
    let recoveries = 0;
    let introTimer: ReturnType<typeof setTimeout> | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let lastTime = 0;
    const introDuration = Math.max(3, Math.min(delaySeconds, 12)) * 1000;

    function canPlay() {
      return !disposed && !failed && visible && !document.hidden && !motion.matches && !connection?.saveData;
    }

    function startIntro() {
      clearTimeout(introTimer);
      clearTimeout(watchdog);
      delayElapsed = false;
      repeats = 0;
      starting = false;
      playAttempt++;
      player.pause();
      rewindOnPlay = true;
      setPlayingSource(null);
      introTimer = setTimeout(() => {
        delayElapsed = true;
        sync();
      }, introDuration);
    }

    function recover() {
      if (disposed || failed) return;
      startIntro();
      if (recoveries >= 2) {
        failed = true;
        clearTimeout(introTimer);
        return;
      }
      recoveries++;
      player.removeAttribute('src');
      player.load();
    }

    function watch() {
      clearTimeout(watchdog);
      lastTime = player.currentTime;
      watchdog = setTimeout(() => {
        if (!canPlay() || !delayElapsed) return;
        if (Math.abs(player.currentTime - lastTime) < 0.05) recover();
        else watch();
      }, 6500);
    }

    function sync() {
      if (!delayElapsed || !canPlay()) {
        clearTimeout(watchdog);
        if (starting) {
          starting = false;
          playAttempt++;
        }
        player.pause();
        if (motion.matches) setPlayingSource(null);
        return;
      }
      if (starting || !player.paused) return;
      starting = true;
      const attempt = ++playAttempt;
      if (!player.getAttribute('src')) player.src = playbackSource;
      if (rewindOnPlay && player.readyState >= HTMLMediaElement.HAVE_METADATA) player.currentTime = 0;
      rewindOnPlay = false;
      watch();
      void player.play().catch((error: unknown) => {
        if (disposed || attempt !== playAttempt || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          failed = true;
          startIntro();
          clearTimeout(introTimer);
        } else recover();
      }).finally(() => {
        if (attempt === playAttempt) starting = false;
      });
    }

    const onPlaying = () => { if (canPlay() && delayElapsed) setPlayingSource(playbackSource); };
    const onWaiting = () => { if (canPlay() && delayElapsed) watch(); };
    const onEnded = () => {
      repeats++;
      recoveries = 0;
      if (repeats === 4) startIntro();
      else {
        player.currentTime = 0;
        sync();
      }
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.08;
      sync();
    }, {threshold: 0.08}) : null;
    observer?.observe(player);
    player.addEventListener('playing', onPlaying);
    player.addEventListener('ended', onEnded);
    player.addEventListener('waiting', onWaiting);
    player.addEventListener('error', recover);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    startIntro();

    return () => {
      disposed = true;
      observer?.disconnect();
      clearTimeout(introTimer);
      clearTimeout(watchdog);
      player.removeEventListener('playing', onPlaying);
      player.removeEventListener('ended', onEnded);
      player.removeEventListener('waiting', onWaiting);
      player.removeEventListener('error', recover);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
      player.pause();
      player.removeAttribute('src');
      player.load();
    };
  }, [source, delaySeconds, preset]);


  const cinematic = preset === 'CINEMATIC';
  const editorial = preset === 'EDITORIAL';
  const contained = cinematic || editorial;
  const full = preset === 'CENTERED' || preset === 'SPOTLIGHT';
  const showVideo = Boolean(source && playingSource === source);
  const clip = hasVideo && <div className="home-hero-video" aria-hidden="true"><video ref={video} muted playsInline preload="none"/></div>;
  const picture = <HeroImage desktop={imageUrl} mobile={mobileImageUrl} full={full || cinematic}/>;
  const className = `reference-hero home-hero-preset-${preset.toLowerCase()}${full ? ' home-hero-fullbleed' : ''}${contained ? ' home-hero-contained' : ''}`;
  return <section className={`${className}${hasVideo ? ' home-hero-has-video' : ''}`} data-hero-phase={showVideo ? 'video' : 'intro'}>
    {cinematic ? <div className="ref-container home-cinematic-frame">
      <div className="home-hero-image" aria-hidden="true">{picture}</div>
      {clip}
      <HeroCopy className="ref-hero-copy home-cinematic-copy" hidden={showVideo} actions={false}/>
      <div className="hero-video-actions" aria-label="Homepage actions"><HeroActions/></div>
    </div> : <>
      {full && <div className="home-hero-image" aria-hidden="true">{picture}</div>}
      {!contained && clip}
      <div className="ref-container ref-hero-inner">
        <HeroCopy className="ref-hero-copy" hidden={showVideo && !contained}/>
        {!full && <div className="ref-hero-art">{picture}{editorial && clip}</div>}
      </div>
      {showVideo && !contained && <div className="hero-video-actions" aria-label="Homepage actions"><HeroActions/></div>}
    </>}
  </section>;
}
