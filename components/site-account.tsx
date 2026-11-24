'use client';

import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';

type Account = {id: string; name: string; email: string} | null;
const SiteAccount = createContext<Account | undefined>(undefined);

export function SiteAccountProvider({children}: {children: ReactNode}) {
  const [account, setAccount] = useState<Account>();
  useEffect(() => {
    let active = true;
    let request: Promise<void> | undefined;
    function refresh() {
      if (request) return;
      request = fetch('/api/account/me', {cache: 'no-store'})
        .then(async response => {
          if (!response.ok) throw new Error('Account unavailable');
          const result: {user: Account} = await response.json();
          if (active) setAccount(result.user);
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
  }, []);
  return <SiteAccount.Provider value={account}>{children}</SiteAccount.Provider>;
}

export function useSiteAccount() { return useContext(SiteAccount); }
