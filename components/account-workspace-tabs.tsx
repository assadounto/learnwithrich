'use client';

import {Children, type KeyboardEvent, type ReactNode, useRef, useState} from 'react';

type Tab = {id: string; label: string; count: number};

export function AccountWorkspaceTabs({tabs, children}: {tabs: Tab[]; children: ReactNode}) {
  const panels = Children.toArray(children);
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let next = active;
    if (event.key === 'ArrowRight') next = (active + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (active - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return <div className="account-workspace-tabs">
    <div className="account-workspace-tablist" role="tablist" aria-label="Your account sections">
      {tabs.map((tab, index) => <button key={tab.id} ref={node => {refs.current[index] = node;}} type="button" role="tab" id={`account-tab-${tab.id}`} aria-controls={`account-panel-${tab.id}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={onKeyDown}>
        {tab.label}<span>{tab.count}</span>
      </button>)}
    </div>
    {panels.map((panel, index) => <div key={tabs[index].id} id={`account-panel-${tabs[index].id}`} role="tabpanel" aria-labelledby={`account-tab-${tabs[index].id}`} hidden={active !== index}>
      {panel}
    </div>)}
  </div>;
}
