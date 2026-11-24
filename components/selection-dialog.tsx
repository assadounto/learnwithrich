'use client';

import {useEffect, useRef, useState} from 'react';
import {Check, X} from 'lucide-react';

type Choice = {index: number; label: string; group?: string; disabled: boolean; selected: boolean};
type Menu = {label: string; select: HTMLSelectElement; choices: Choice[]};

function selectLabel(select: HTMLSelectElement) {
  const direct = select.getAttribute('aria-label');
  if (direct) return direct;
  const ids = select.getAttribute('aria-labelledby')?.split(/\s+/) ?? [];
  const labelled = ids.map(id => document.getElementById(id)?.textContent ?? '').join(' ').trim();
  if (labelled) return labelled;
  const label = select.labels?.[0]?.cloneNode(true) as HTMLLabelElement | undefined;
  label?.querySelectorAll('select, button, input').forEach(node => node.remove());
  return label?.textContent?.trim() || 'Choose an option';
}

export function SelectionDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function open(event: PointerEvent | KeyboardEvent) {
      const select = event.target;
      if (!(select instanceof HTMLSelectElement) || select.multiple || select.size > 1 || select.matches(':disabled') || event.defaultPrevented) return;
      if (event instanceof PointerEvent && event.button !== 0) return;
      if (event instanceof KeyboardEvent && !['Enter', ' ', 'ArrowDown', 'ArrowUp', 'F4'].includes(event.key)) return;
      event.preventDefault();
      select.focus({preventScroll: true});
      setQuery('');
      setMenu({
        select,
        label: selectLabel(select),
        choices: Array.from(select.options, (option, index) => ({
          index, label: option.label,
          group: option.parentElement instanceof HTMLOptGroupElement ? option.parentElement.label : undefined,
          disabled: option.disabled || (option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled),
          selected: option.selected,
        })).filter(choice => !select.options[choice.index].hidden),
      });
    }
    document.addEventListener('pointerdown', open);
    document.addEventListener('keydown', open);
    return () => {
      document.removeEventListener('pointerdown', open);
      document.removeEventListener('keydown', open);
    };
  }, []);

  useEffect(() => {
    if (!menu || !dialog.current) return;
    if (!dialog.current.open) dialog.current.showModal();
    const focus = search.current ?? dialog.current.querySelector<HTMLButtonElement>('[aria-pressed="true"]:not(:disabled)') ?? dialog.current.querySelector<HTMLButtonElement>('.selection-options button:not(:disabled)');
    focus?.focus();
  }, [menu]);

  function choose(choice: Choice) {
    const select = menu?.select;
    if (select?.isConnected && !select.matches(':disabled') && select.selectedIndex !== choice.index && select.options[choice.index]) {
      select.selectedIndex = choice.index;
      select.dispatchEvent(new Event('input', {bubbles: true}));
      select.dispatchEvent(new Event('change', {bubbles: true}));
    }
    dialog.current?.close();
  }

  const normalized = query.trim().toLowerCase();
  const choices = menu?.choices.filter(choice => !normalized || `${choice.group ?? ''} ${choice.label}`.toLowerCase().includes(normalized)) ?? [];

  return <dialog ref={dialog} className="selection-dialog" aria-labelledby="selection-dialog-title"
    onClose={() => {menu?.select.isConnected && menu.select.focus({preventScroll: true}); setMenu(null);}}
    onClick={event => {if (event.target === event.currentTarget) dialog.current?.close();}}>
    {menu && <div className="selection-dialog-content">
      <header><h2 id="selection-dialog-title">{menu.label}</h2><button type="button" className="icon-button" onClick={() => dialog.current?.close()} aria-label="Close options"><X size={18}/></button></header>
      {menu.choices.length > 8 && <input ref={search} className="selection-search" type="search" aria-label="Search options" placeholder="Search options" value={query} onChange={event => setQuery(event.target.value)}/>}
      <div className="selection-options">
        {choices.length ? choices.map(choice => <button key={choice.index} type="button" disabled={choice.disabled} aria-pressed={choice.selected}
          onClick={() => choose(choice)}><span>{choice.group && <small>{choice.group}</small>}{choice.label}</span>{choice.selected && <Check size={17}/>}</button>) : <p>No matching options.</p>}
      </div>
    </div>}
  </dialog>;
}
