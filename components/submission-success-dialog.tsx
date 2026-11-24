'use client';

import {useId, useLayoutEffect, useRef, type ReactNode} from 'react';
import {ArrowRight, CircleCheck, X} from 'lucide-react';
import Link from '@/components/navigation-link';

export function SubmissionSuccessDialog({title, description, children, action, onDismiss}: {
  title: string;
  description: string;
  children?: ReactNode;
  action?: {href: string; label: string};
  onDismiss: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useLayoutEffect(() => {
    const modal = dialog.current;
    if (modal && !modal.open) modal.showModal();
    heading.current?.focus({preventScroll: true});
  }, []);

  function close() { dialog.current?.close(); }

  return <dialog ref={dialog} className="submission-success-dialog" aria-labelledby={titleId}
    aria-describedby={descriptionId} onClose={onDismiss}>
    <div className="submission-success-content">
      <button className="icon-button submission-success-close" type="button" aria-label="Close confirmation" onClick={close}><X size={19}/></button>
      <div className="submission-success-icon"><CircleCheck size={29} aria-hidden="true"/></div>
      <h2 ref={heading} tabIndex={-1} id={titleId}>{title}</h2>
      <p id={descriptionId}>{description}</p>
      {children}
      <div className="submission-success-actions">
        {action && <Link className="button button-dark" href={action.href} onClick={close}>{action.label}<ArrowRight size={16}/></Link>}
        <button className={`button ${action ? 'button-outline' : 'button-dark'}`} type="button" onClick={close}>{action ? 'Close' : 'Done'}</button>
      </div>
    </div>
  </dialog>;
}
