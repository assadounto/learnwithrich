'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function HomeMotion({ children }: { children: ReactNode }) {
 const root = useRef<HTMLDivElement>(null);
 useEffect(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const elements = root.current?.querySelectorAll<HTMLElement>('.home-reveal, .ref-discovery, .ref-section-heading, .ref-project-card, .ref-library-copy, .ref-shelf-book, .ref-courses > h2, .ref-course-card, .ref-about-copy, .ref-stamp, .ref-newsletter-inner');
  const observer = new IntersectionObserver(entries => {
   entries.forEach(entry => {
    if (entry.isIntersecting) {
     entry.target.classList.remove('motion-pending');
     entry.target.classList.add('motion-arrived');
     observer.unobserve(entry.target);
    }
   });
  }, { threshold: 0.08 });
  elements?.forEach(element => {
   if (element.getBoundingClientRect().top >= window.innerHeight) {
    element.classList.add('motion-pending');
    observer.observe(element);
   }
  });
  const marks = root.current?.querySelectorAll<SVGElement>('.drawn-mark');
  let markFrame = 0;
  const drawVisibleMarks = () => {
   markFrame = 0;
   marks?.forEach(mark => {
    if (mark.classList.contains('mark-drawn')) return;
    const rect = (mark.parentElement || mark).getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
     mark.classList.remove('mark-pending');
     mark.classList.add('mark-drawn');
    }
   });
  };
  marks?.forEach(mark => mark.classList.add('mark-pending'));
  const scheduleMarks = () => { if (!markFrame) markFrame = requestAnimationFrame(drawVisibleMarks); };
  window.addEventListener('scroll', scheduleMarks, { passive: true });
  window.addEventListener('resize', scheduleMarks);
  scheduleMarks();
  const revealAll = () => {
   if (motion.matches) { elements?.forEach(element => element.classList.remove('motion-pending')); marks?.forEach(mark => mark.classList.remove('mark-pending')); }
  };
  motion.addEventListener('change', revealAll);
  return () => { observer.disconnect(); cancelAnimationFrame(markFrame); window.removeEventListener('scroll', scheduleMarks); window.removeEventListener('resize', scheduleMarks); marks?.forEach(mark => mark.classList.remove('mark-pending','mark-drawn')); motion.removeEventListener('change', revealAll); elements?.forEach(element => element.classList.remove('motion-pending')); };
 }, []);
 return <div className="reference-home" ref={root}>{children}</div>;
}
