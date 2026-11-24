'use client';

import {useActionState, useEffect, useRef, useState} from 'react';
import {Save} from 'lucide-react';
import {saveSiteContacts} from '@/app/admin/(workspace)/site-contact/actions';
import {contactFields, type SiteContacts} from '@/lib/site-contact';
import {useAdminDirty} from './workspace-shell';

export function SiteContactForm({initial}: {initial: SiteContacts}) {
  const [values, setValues] = useState(initial);
  const submitted = useRef(initial);
  const [baseline, setBaseline] = useState(initial);
  const [state, action, pending] = useActionState(saveSiteContacts, {message: '', ok: false});
  const dirty = contactFields.some(field => (values[field.id] ?? '') !== (baseline[field.id] ?? ''));
  useAdminDirty(dirty);
  useEffect(() => {if (state.ok) setBaseline(submitted.current);}, [state]);

  return <form action={action} onSubmit={() => {submitted.current = values;}} className="admin-panel site-contact-admin">
    <p>These details are public. Leave a field blank to hide it. Use an international number such as +233240000000 for phone and WhatsApp.</p>
    <div>{contactFields.map(field => <label key={field.id}>{field.label}
      <input name={field.id} type={field.kind} maxLength={field.kind === 'url' ? 2048 : field.kind === 'tel' ? 32 : 254} disabled={pending}
        value={values[field.id] ?? ''} onChange={event => setValues({...values, [field.id]: event.target.value})}/>
    </label>)}</div>
    {state.message && <p role={state.ok ? 'status' : 'alert'}>{state.message}</p>}
    <button className="button button-dark" type="submit" disabled={pending || !dirty}><Save size={16}/>{pending ? 'Saving…' : 'Save contact details'}</button>
  </form>;
}
