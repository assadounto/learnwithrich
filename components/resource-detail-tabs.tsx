'use client';

import {useRef, useState, type KeyboardEvent, type ReactNode} from 'react';

type TabItem = {id: string; label: string; content: ReactNode};

export function ResourceDetailTabs({items}: {items: TabItem[]}) {
  const [active, setActive] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length;
    setActive(next);
    buttons.current[next]?.focus();
  }
  const selected = items[active];
  return <section className="resource-detail-tabs" id="resource-tabs">
    <div className="resource-detail-tab-list" role="tablist" aria-label="Resource details">
      {items.map((item, index) => <button
        key={item.id}
        ref={element => {buttons.current[index] = element;}}
        id={`resource-tab-${item.id}`}
        type="button"
        role="tab"
        aria-selected={active === index}
        aria-controls="resource-tab-panel"
        tabIndex={active === index ? 0 : -1}
        onClick={() => setActive(index)}
        onKeyDown={event => onKeyDown(event, index)}
      >{item.label}</button>)}
    </div>
    <div id="resource-tab-panel" className="resource-detail-tab-panel" role="tabpanel" aria-labelledby={`resource-tab-${selected.id}`} tabIndex={0}>
      {selected.content}
    </div>
  </section>;
}
