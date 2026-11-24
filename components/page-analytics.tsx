'use client';

import {useEffect, useRef} from 'react';
import {usePathname} from 'next/navigation';
import {publicAnalyticsPath} from '@/lib/page-analytics';

const visitKey = 'learnwithrich.analytics.visit';

export function PageAnalytics() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const firstPage = useRef(true);
  const countedVisit = useRef(false);

  useEffect(() => {
    const path = publicAnalyticsPath(pathname);
    if (!path) {lastPath.current = null; return;}

    function count() {
      if (!path || path === lastPath.current || document.visibilityState !== 'visible') return;
      if (navigator.doNotTrack === '1' || (navigator as Navigator & {globalPrivacyControl?: boolean}).globalPrivacyControl) return;
      const referrer = firstPage.current ? document.referrer : '';
      firstPage.current = false;
      lastPath.current = path;
      let visit = !countedVisit.current;
      try {
        visit = sessionStorage.getItem(visitKey) !== '1';
        if (visit) sessionStorage.setItem(visitKey, '1');
      } catch { /* Views still work without session storage. */ }
      countedVisit.current = true;
      let source = '';
      try {
        const url = new URL(referrer);
        if (url.origin !== window.location.origin) source = url.hostname;
      } catch { /* No external referrer. */ }

      void fetch('/api/analytics/pageview', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'omit', keepalive: true,
        body: JSON.stringify({path, source, visit, screen: window.matchMedia('(max-width: 767px)').matches ? 'small' : 'large'}),
      }).catch(() => {});
    }

    count();
    document.addEventListener('visibilitychange', count);
    return () => document.removeEventListener('visibilitychange', count);
  }, [pathname]);
  return null;
}
