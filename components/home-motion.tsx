'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function HomeMotion({ children }: { children: ReactNode }) {
 const root = useRef<HTMLDivElement>(null);
 useEffect(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const elements = root.current?.querySelectorAll<HTMLElement>('.ref-discovery, .ref-section-heading, .ref-project-card, .ref-library-copy, .ref-shelf-book, .ref-courses > h2, .ref-course-card, .ref-about-copy, .ref-stamp, .ref-newsletter-inner');
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
  const revealAll = () => {
   if (motion.matches) elements?.forEach(element => element.classList.remove('motion-pending'));
  };
  motion.addEventListener('change', revealAll);
  return () => { observer.disconnect(); motion.removeEventListener('change', revealAll); elements?.forEach(element => element.classList.remove('motion-pending')); };
 }, []);
 return <div className="reference-home" ref={root}>{children}</div>;
}
