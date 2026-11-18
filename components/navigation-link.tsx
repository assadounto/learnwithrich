'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useSiteNavigation } from './navigation-feedback';

/** Retain Next's prefetch and native link behavior; track actual route transitions. */
export default function NavigationLink({ onNavigate, ...props }: ComponentProps<typeof Link>) {
  const navigate = useSiteNavigation();
  return <Link {...props} onNavigate={event => {
    let cancelled = false;
    onNavigate?.({ preventDefault: () => { cancelled = true; event.preventDefault(); } });
    if (cancelled || !navigate || typeof props.href !== 'string') return;
    const destination = new URL(props.href, window.location.href);
    const current = new URL(window.location.href);
    // Hash jumps and links to the current page do not load a route.
    if (destination.pathname === current.pathname && destination.search === current.search) return;
    event.preventDefault();
    navigate(props.href, { replace: props.replace, scroll: props.scroll });
  }} />;
}
