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
  const markObserver = new IntersectionObserver(entries => {
   for (const {target, isIntersecting} of entries) {
    if (!isIntersecting) continue;
    target.classList.remove('mark-pending');
    target.classList.add('mark-drawn');
    markObserver.unobserve(target);
   }
  });
  marks?.forEach(mark => {
   mark.classList.add('mark-pending');
   markObserver.observe(mark);
  });
  const revealAll = () => {
   if (!motion.matches) return;
   observer.disconnect();
   markObserver.disconnect();
   elements?.forEach(element => element.classList.remove('motion-pending', 'motion-arrived'));
   marks?.forEach(mark => mark.classList.remove('mark-pending', 'mark-drawn'));
  };
  motion.addEventListener('change', revealAll);
  return () => {
   observer.disconnect();
   markObserver.disconnect();
   motion.removeEventListener('change', revealAll);
   elements?.forEach(element => element.classList.remove('motion-pending', 'motion-arrived'));
   marks?.forEach(mark => mark.classList.remove('mark-pending', 'mark-drawn'));
  };
 }, []);
 return <div className="reference-home" ref={root}>{children}</div>;
}
