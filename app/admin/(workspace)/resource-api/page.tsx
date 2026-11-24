import {authoringScopes} from '@/lib/authoring-scopes';
import {authoringExamples, authoringSkillUrl} from '@/lib/authoring-skill';
import Link from 'next/link';
import {ResourceTokenForm} from '@/components/admin/resource-token-form';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {revokeResourceToken} from './actions';

export default async function ResourceApiPage() {
  const owner = await requireOwner();
  const tokens = await database().resourceApiToken.findMany({
    where: {ownerId: owner.id}, orderBy: [{revokedAt: {sort: 'asc', nulls: 'first'}}, {createdAt: 'desc'}], take: 100,
    select: {id: true, label: true, hint: true, canEdit: true, canUpload: true, canCreateIdeas: true, canPublishResources: true, canPublishIdeas: true, expiresAt: true, revokedAt: true},
  });

  return <div className="resource-api-page">
    <header className="admin-page-heading"><div><h1>Resource API</h1><p>Generate a separate token for each assistant or workflow. Share the public skill so the assistant knows how to use it.</p></div></header>
    <p><Link href={authoringSkillUrl} className="button button-outline">Open agent skill</Link>{' '}<Link href="/resource-package#agent-authoring" className="button button-outline">Shareable authoring guide</Link></p>
    <ResourceTokenForm/>
    <section className="admin-panel">
      <h2>Tokens</h2>
      {tokens.length === 0 ? <p className="admin-help">No tokens generated yet.</p> : <ul className="resource-api-tokens">{tokens.map(token => {
        const state = token.revokedAt ? 'Revoked' : token.expiresAt <= new Date() ? 'Expired' : 'Active';
        return <li key={token.id}>
          <div><strong>{token.label}</strong><small>Ends in {token.hint} · Expires {token.expiresAt.toISOString().slice(0, 10)} (UTC)</small><small>{authoringScopes.filter(scope => token[scope.field]).map(scope => scope.label).join(' · ')}</small></div>
          <span className="admin-status">{state}</span>
          {state === 'Active' && <form action={revokeResourceToken.bind(null, token.id)}><button className="button button-outline">Revoke</button></form>}
        </li>;
      })}</ul>}
    </section>
    <section className="admin-panel">
      <h2>Preview and import a ZIP</h2>
      <p className="admin-help">Use the <Link href="/resource-package" target="_blank" rel="noreferrer">resource ZIP format</Link>. Send the archive as the multipart field <code>file</code>. Proceed with import when <code>preview.valid</code> is true. Import returns draft IDs and the new media folder when the package contains referenced files. An existing slug blocks the whole import.</p>
      <pre><code>{authoringExamples.setup + '\n\n' + authoringExamples.resources}</code></pre>
    </section>
    <section className="admin-panel">
      <h2>Add project idea drafts</h2>
      <p className="admin-help">Use a token with idea creation permission. Send 1 to 25 ideas per request. Each needs a title, discipline, abstract (40 to 3,000 characters), and a tags array (up to 12). The slug is optional. An existing slug blocks the batch. Review and publish drafts under <Link href="/admin/project-ideas">Project ideas</Link>.</p>
      <p className="admin-help">Discipline IDs are electrical, mechanical, software, civil, environmental, and interdisciplinary.</p>
      <pre><code>{authoringExamples.ideas}</code></pre>
    </section>
    <section className="admin-panel">
      <h2>Read and edit a draft</h2>
      <p className="admin-help">Use a token with draft editing permission. PATCH accepts <code>title</code>, <code>summary</code>, <code>bodyMarkdown</code>, <code>tags</code>, and <code>details</code>. Omitted fields are kept. Sending <code>tags</code> or <code>details</code> replaces that field. A 409 means the draft changed. Fetch it again and review the changes before retrying.</p>
      <pre><code>{authoringExamples.edit}</code></pre>
      <p className="admin-help">Keep tokens in your tool’s secret store. Publishing requires its matching token permission. Token management stays in the signed-in studio. Revoking a token stops future requests.</p>
    </section>
    <section className="admin-panel">
      <h2>Publish a draft</h2>
      <p className="admin-help">Enable the matching publishing permission when you want an assistant to make specific drafts live. Fetch each draft first and send its current revision.</p>
      <details><summary>Publish a resource</summary><pre><code>{authoringExamples.publishResource}</code></pre></details>
      <details><summary>Publish a project idea</summary><pre><code>{authoringExamples.publishIdea}</code></pre></details>
    </section>
  </div>;
}
