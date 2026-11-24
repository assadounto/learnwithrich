'use client';

import {useId, useRef, useState, useTransition} from 'react';
import {LogOut, Trash2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {manageLearner} from '@/app/admin/(workspace)/users/actions';

export function LearnerActions({id, name, canDelete}: {id: string; name: string; canDelete: boolean}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const [action, setAction] = useState<'sign-out' | 'delete'>('sign-out');
  const [feedback, setFeedback] = useState<{error: boolean; message: string}>();
  const [pending, startTransition] = useTransition();

  function ask(next: typeof action) {
    setAction(next);
    setFeedback(undefined);
    dialog.current?.showModal();
  }

  function confirm() {
    startTransition(async () => {
      try {
        const result = await manageLearner(id, action);
        dialog.current?.close();
        if (result.ok && action === 'delete') {
          router.replace('/admin/users?deleted=1');
          return;
        }
        setFeedback({error: !result.ok, message: result.message});
      } catch {
        dialog.current?.close();
        setFeedback({error: true, message: 'Could not complete the account action. Try again.'});
      }
    });
  }

  return <>
    <div className="studio-delete-dialog-actions">
      <button type="button" className="button button-outline" disabled={pending} onClick={() => ask('sign-out')}><LogOut size={16}/>Revoke sessions</button>
      {canDelete && <button type="button" className="button button-outline bulk-delete-action" disabled={pending} onClick={() => ask('delete')}><Trash2 size={16}/>Delete account</button>}
    </div>
    {!canDelete && <p className="admin-help">Payment or audit records protect this account from deletion.</p>}
    {feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'admin-alert' : 'admin-success'}>{feedback.message}</p>}
    <dialog ref={dialog} className="studio-delete-dialog" aria-labelledby={title} onCancel={event => {if (pending) event.preventDefault();}}>
      <h2 id={title}>{action === 'delete' ? 'Delete learner account?' : 'Revoke learner sessions?'}</h2>
      <p>{action === 'delete'
        ? <>Delete the account for <strong>{name}</strong>, including sessions, saved resources, and reviews. Service requests are retained. This action is permanent.</>
        : <>Sign <strong>{name}</strong> out on all devices. They can sign in again.</>}</p>
      <div className="studio-delete-dialog-actions">
        <button type="button" className="button button-outline" autoFocus disabled={pending} onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="button" className={`button ${action === 'delete' ? 'bulk-delete-confirm' : 'button-dark'}`} disabled={pending} onClick={confirm}>
          {pending ? 'Working…' : action === 'delete' ? 'Delete account' : 'Revoke sessions'}
        </button>
      </div>
    </dialog>
  </>;
}
