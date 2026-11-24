'use client';

import {useRouter} from 'next/navigation';
import {readBrowserBookmarks, writeBrowserBookmarks} from '@/lib/browser-bookmarks';
import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';

type Account = {id: string; name: string; email: string} | null;
const SiteAccount = createContext<Account | undefined>(undefined);

export function SiteAccountProvider({children}: {children: ReactNode}) {
  const [account, setAccount] = useState<Account>();
  const router = useRouter();
  useEffect(() => {
    let active = true;
    let request: Promise<void> | undefined;
    function refresh() {
      if (request) return;
      request = fetch('/api/account/me', {cache: 'no-store'})
        .then(async response => {
          if (!response.ok) throw new Error('Account unavailable');
          const result: {user: Account} = await response.json();
          let imported = false;
          if (active && result.user) {
            const slugs = readBrowserBookmarks().filter(slug => slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug));
            for (let i = 0; active && i < slugs.length; i += 100) {
              try {
                const sync = await fetch('/api/account/bookmark-import', {
                  method: 'POST', headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({accountId: result.user.id, slugs: slugs.slice(i, i + 100)}),
                });
                if (!sync.ok) break;
                const {imported: confirmed}: {imported: string[]} = await sync.json();
                if (confirmed.length) {
                  const transferred = new Set(confirmed);
                  writeBrowserBookmarks(readBrowserBookmarks().filter(slug => !transferred.has(slug)));
                  imported = true;
                }
              } catch { break; }
            }
          }
          if (!active) return;
          setAccount(result.user);
          if (imported && window.location.pathname.startsWith('/account')) router.refresh();
        })
        .catch(() => {if (active) setAccount(previous => previous ?? null);})
        .finally(() => {request = undefined;});
    }
    refresh();
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
    };
  }, [router]);
  return <SiteAccount.Provider value={account}>{children}</SiteAccount.Provider>;
}

export function useSiteAccount() { return useContext(SiteAccount); }
