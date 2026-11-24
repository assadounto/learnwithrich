'use client';

import {useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef} from 'react';
import {createPortal} from 'react-dom';
import {Check, ChevronDown, X} from 'lucide-react';

type Choice = {index: number; label: string; group?: string; disabled: boolean; selected: boolean};
type Menu = {label: string; choices: Choice[]};
type Props = Omit<ComponentPropsWithoutRef<'select'>, 'multiple' | 'size'>;

function choiceLabel(button: HTMLButtonElement) {
  const direct = button.getAttribute('aria-label');
  if (direct) return direct;
  const ids = button.getAttribute('aria-labelledby')?.split(/\s+/) ?? [];
  const labelled = ids.map(id => document.getElementById(id)?.textContent ?? '').join(' ').trim();
  if (labelled) return labelled;
  const label = button.labels?.[0]?.cloneNode(true) as HTMLLabelElement | undefined;
  label?.querySelectorAll('select, button, input').forEach(node => node.remove());
  return label?.textContent?.trim() || 'Choose an option';
}

export function SelectMenu({
  children, id, disabled, className, style, onChange, onInvalid, 'aria-label': ariaLabel,
  'aria-labelledby': labelledBy, 'aria-describedby': describedBy, ...props
}: Props) {
  const select = useRef<HTMLSelectElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const modalId = useId();
  const errorId = useId();
  const valueId = useId();
  const [ready, setReady] = useState(false);
  const backdropPressed = useRef(false);
  const [current, setCurrent] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [query, setQuery] = useState('');

  function readSelection() {
    const field = select.current;
    if (field) setCurrent(field.selectedOptions[0]?.label ?? '');
  }

  useLayoutEffect(() => { setReady(true); }, []);
  useLayoutEffect(readSelection);

  useEffect(() => {
    const form = select.current?.form;
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {readSelection(); setInvalid(false);});
    };
    form?.addEventListener('reset', reset);
    return () => {form?.removeEventListener('reset', reset); cancelAnimationFrame(frame);};
  }, [props.form]);

  useLayoutEffect(() => {
    const modal = dialog.current;
    if (!menu || !modal || modal.open) return;
    modal.showModal();
    (modal.querySelector<HTMLButtonElement>('[aria-pressed="true"]:not(:disabled)') ??
      modal.querySelector<HTMLButtonElement>('.selection-options button:not(:disabled)') ??
      modal.querySelector<HTMLButtonElement>('header button'))?.focus();
  }, [menu]);

  function open() {
    const field = select.current, button = trigger.current;
    if (!field || !button || field.matches(':disabled') || menu) return;
    setQuery('');
    backdropPressed.current = false;
    setMenu({
      label: choiceLabel(button),
      choices: Array.from(field.options, (option, index) => {
        const group = option.parentElement instanceof HTMLOptGroupElement ? option.parentElement : null;
        return {index, label: option.label, group: group?.label, disabled: option.disabled || Boolean(group?.disabled), selected: option.selected};
      }).filter(choice => !field.options[choice.index].hidden),
    });
  }

  function choose(choice: Choice) {
    const field = select.current;
    if (field && !field.matches(':disabled') && field.options[choice.index] && field.selectedIndex !== choice.index) {
      field.selectedIndex = choice.index;
      field.dispatchEvent(new Event('input', {bubbles: true}));
      field.dispatchEvent(new Event('change', {bubbles: true}));
    }
    dialog.current?.close();
  }

  const normalized = query.trim().toLowerCase();
  const choices = menu?.choices.filter(choice => !normalized || `${choice.group ?? ''} ${choice.label}`.toLowerCase().includes(normalized)) ?? [];

  return <span className="select-menu">
    {ready && <button type="button" ref={trigger} id={id} className={`select-menu-trigger${className ? ` ${className}` : ''}`} style={style}
      disabled={disabled} aria-label={ariaLabel} aria-labelledby={labelledBy} aria-describedby={[valueId, describedBy, invalid ? errorId : ''].filter(Boolean).join(' ') || undefined}
      aria-invalid={invalid || undefined} aria-haspopup="dialog" aria-expanded={Boolean(menu)} aria-controls={menu ? modalId : undefined}
      onClick={open} onKeyDown={event => {
        if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        open();
      }}>
      <span id={valueId}>{current || 'Choose an option'}</span><ChevronDown size={15} aria-hidden="true"/>
    </button>}
    <select {...props} ref={select} disabled={disabled} id={ready ? undefined : id}
      className={ready ? 'select-menu-field' : className} style={ready ? undefined : style}
      aria-hidden={ready || undefined} aria-label={ready ? undefined : ariaLabel}
      aria-labelledby={ready ? undefined : labelledBy} aria-describedby={ready ? undefined : describedBy}
      tabIndex={ready ? -1 : props.tabIndex}
      onChange={event => {readSelection(); setInvalid(!event.currentTarget.validity.valid); onChange?.(event);}}
      onInvalid={event => {if (ready) {event.preventDefault(); setInvalid(true); trigger.current?.focus();} onInvalid?.(event);}}>
      {children}
    </select>
    {invalid && <span className="select-menu-error" id={errorId} role="alert">Choose an option to continue.</span>}
    {menu && createPortal(<dialog id={modalId} ref={dialog} className="selection-dialog" aria-labelledby={title}
      onClose={() => { setMenu(null); trigger.current?.focus({preventScroll: true}); }}
      onPointerDown={event => { backdropPressed.current = event.target === event.currentTarget; }}
      onClick={event => {if (backdropPressed.current && event.target === event.currentTarget) dialog.current?.close();}}>
      <div className="selection-dialog-content">
        <header><h2 id={title}>{menu.label}</h2><button type="button" className="icon-button" onClick={() => dialog.current?.close()} aria-label="Close options"><X size={18}/></button></header>
        {menu.choices.length > 8 && <input className="selection-search" type="search" aria-label="Search options" placeholder="Search options" value={query} onChange={event => setQuery(event.target.value)}/>}
        <div className="selection-options">
          {choices.length ? choices.map(choice => <button key={choice.index} type="button" disabled={choice.disabled} aria-pressed={choice.selected}
            onClick={() => choose(choice)}><span>{choice.group && <small>{choice.group}</small>}{choice.label}</span>{choice.selected && <Check size={17}/>}</button>) : <p>No matching options.</p>}
        </div>
      </div>
    </dialog>, document.body)}
  </span>;
}
