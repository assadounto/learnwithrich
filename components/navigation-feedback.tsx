'use client';

import { createContext, useCallback, useContext, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

type Navigate = (href: string, options: { replace?: boolean; scroll?: boolean }) => void;
const NavigationContext = createContext<Navigate | null>(null);

export function NavigationFeedback({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback<Navigate>((href, options) => {
    startTransition(() => {
      if (options.replace) router.replace(href, { scroll: options.scroll });
      else router.push(href, { scroll: options.scroll });
    });
  }, [router]);

  return <NavigationContext.Provider value={navigate}>
    {pending && <div className="navigation-progress" aria-hidden="true"><span /></div>}
    <div className="navigation-announcement" role="status" aria-live="polite" aria-atomic="true">
      {pending && <span className="navigation-notice"><LoaderCircle size={15} aria-hidden="true" />Loading page…</span>}
    </div>
    <div className="site-content" aria-busy={pending}>{children}</div>
  </NavigationContext.Provider>;
}

export function useSiteNavigation() { return useContext(NavigationContext); }
