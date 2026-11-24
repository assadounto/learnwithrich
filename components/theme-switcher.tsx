'use client';

import {Check, Monitor, Moon, Sun} from 'lucide-react';
import {useEffect, useRef, useSyncExternalStore} from 'react';
import {themeChangeEvent, type ThemePreference} from '@/lib/color-theme';

const themes = [
  {value: 'system', label: 'System', Icon: Monitor},
  {value: 'light', label: 'Light', Icon: Sun},
  {value: 'dark', label: 'Dark', Icon: Moon},
] as const;

function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme-preference']});
  return () => observer.disconnect();
}

function snapshot(): ThemePreference {
  const value = document.documentElement.dataset.themePreference;
  return value === 'dark' || value === 'light' ? value : 'system';
}

export function ThemeSwitcher({className = '', showLabel = false}: {className?: string; showLabel?: boolean}) {
  const preference = useSyncExternalStore(subscribe, snapshot, (): ThemePreference => 'system');
  const current = themes.find(theme => theme.value === preference) ?? themes[0];
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (details.current?.open && event.target instanceof Node && !details.current.contains(event.target)) details.current.open = false;
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);

  function close() {
    if (details.current) details.current.open = false;
    summary.current?.focus();
  }

  return <details ref={details} className={`theme-switcher ${className}`} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }} onKeyDown={event => {
    if (event.key === 'Escape' && details.current?.open) {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }}>
    <summary ref={summary} aria-label={`Color theme: ${current.label}`} title={`Color theme: ${current.label}`}>
      <current.Icon size={17} aria-hidden="true"/>{showLabel && <span>Appearance</span>}
    </summary>
    <div className="theme-options" role="group" aria-label="Color theme">
      {themes.map(({value, label, Icon}) => <button key={value} type="button" aria-pressed={preference === value} onClick={() => {
        window.dispatchEvent(new CustomEvent(themeChangeEvent, {detail: value}));
        close();
      }}><Icon size={16} aria-hidden="true"/>{label}{value === preference && <Check size={15} className="theme-selected" aria-hidden="true"/>}</button>)}
    </div>
  </details>;
}
