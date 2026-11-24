'use client';
import {authoringScopes} from '@/lib/authoring-scopes';
import {SelectMenu} from '@/components/selection-dialog';

import {useState, useTransition} from 'react';
import {Copy, KeyRound} from 'lucide-react';
import {createResourceToken} from '@/app/admin/(workspace)/resource-api/actions';

export function ResourceTokenForm() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  return <section className="admin-panel">
    <h2>Generate an API token</h2>
    <form onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setToken('');
      setMessage('');
      startTransition(async () => {
        try {
          const result = await createResourceToken(String(form.get('label')), Number(form.get('days')), form.getAll('scope'));
          if (result.ok) setToken(result.token);
          else setMessage(result.error);
        } catch { setMessage('Could not generate a token. Refresh the page and try again.'); }
      });
    }}>
      <label>Token name<input name="label" required maxLength={80} placeholder="e.g. Course authoring assistant"/></label>
      <div className="admin-field-pair">
        <label>Expires after<SelectMenu name="days" defaultValue="7"><option value="1">1 day</option><option value="7">7 days</option><option value="30">30 days</option></SelectMenu></label>
      </div>
      <fieldset className="resource-token-scopes">
        <legend>Permissions</legend>
        {authoringScopes.map(scope => <label key={scope.id}><input type="checkbox" name="scope" value={scope.id} defaultChecked={scope.id === 'upload'}/>{scope.label}</label>)}
        <p className="admin-help">Publishing permissions let the holder make drafts live. Choose only what this agent needs.</p>
      </fieldset>
      <button className="button button-dark" disabled={pending}><KeyRound size={16}/>{pending ? 'Generating…' : 'Generate token'}</button>
    </form>
    {token && <div className="resource-api-secret">
      <label>Copy this token now. It’s shown once.<input readOnly value={token} spellCheck={false} autoComplete="off" onFocus={event => event.currentTarget.select()}/></label>
      <button className="button button-outline" type="button" onClick={async () => {
        try { await navigator.clipboard.writeText(token); setMessage('Token copied.'); }
        catch { setMessage('Select and copy the token from the field.'); }
      }}><Copy size={16}/>Copy token</button>
    </div>}
    {message && <p role="status" className="admin-help">{message}</p>}
  </section>;
}
