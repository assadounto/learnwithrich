import Link from 'next/link';
import {ResourceTokenForm} from '@/components/admin/resource-token-form';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {revokeResourceToken} from './actions';

const zipCommands = [
  'export LWR_URL=https://learnwithrich.com',
  '# Load LWR_TOKEN from your secret store before running these requests.',
  'curl --fail-with-body -H "Authorization: Bearer $LWR_TOKEN" -F "file=@resource.zip" "$LWR_URL/api/admin/resource-packages/preview"',
  'curl --fail-with-body -H "Authorization: Bearer $LWR_TOKEN" -F "file=@resource.zip" "$LWR_URL/api/admin/resource-packages/import"',
].join('\n');

const editCommands = [
  '# Set RESOURCE_ID to an id returned by the ZIP import.',
  'curl --fail-with-body -H "Authorization: Bearer $LWR_TOKEN" "$LWR_URL/api/admin/resource-drafts/$RESOURCE_ID"',
  '# Use the exact version and updatedAt returned by GET in this JSON file.',
  "cat > edit.json <<'JSON'",
  '{"version":1,"updatedAt":"2026-11-23T12:00:00.000Z","summary":"Updated learning objectives."}',
  'JSON',
  'curl --fail-with-body -X PATCH -H "Authorization: Bearer $LWR_TOKEN" -H "Content-Type: application/json" --data-binary @edit.json "$LWR_URL/api/admin/resource-drafts/$RESOURCE_ID"',
].join('\n');

export default async function ResourceApiPage() {
  const owner = await requireOwner();
  const tokens = await database().resourceApiToken.findMany({
    where: {ownerId: owner.id}, orderBy: [{revokedAt: {sort: 'asc', nulls: 'first'}}, {createdAt: 'desc'}], take: 100,
    select: {id: true, label: true, hint: true, canEdit: true, expiresAt: true, revokedAt: true},
  });

  return <div className="resource-api-page">
    <header className="admin-page-heading"><div><h1>Resource API</h1><p>Give an LLM or script a token to import resource ZIPs and, if you choose, edit drafts.</p></div></header>
    <ResourceTokenForm/>
    <section className="admin-panel">
      <h2>Tokens</h2>
      {tokens.length === 0 ? <p className="admin-help">No tokens generated yet.</p> : <ul className="resource-api-tokens">{tokens.map(token => {
        const state = token.revokedAt ? 'Revoked' : token.expiresAt <= new Date() ? 'Expired' : 'Active';
        return <li key={token.id}>
          <div><strong>{token.label}</strong><small>Ends in {token.hint} · {token.canEdit ? 'Upload and edit' : 'Upload only'} · Expires {token.expiresAt.toISOString().slice(0, 10)} (UTC)</small></div>
          <span className="admin-status">{state}</span>
          {state === 'Active' && <form action={revokeResourceToken.bind(null, token.id)}><button className="button button-outline">Revoke</button></form>}
        </li>;
      })}</ul>}
    </section>
    <section className="admin-panel">
      <h2>Preview and import a ZIP</h2>
      <p className="admin-help">Use the <Link href="/resource-package" target="_blank" rel="noreferrer">resource ZIP format</Link>. Send the archive as the multipart field <code>file</code>. Proceed with import when <code>preview.valid</code> is true. Import returns draft IDs and the new media folder when the package contains referenced files. An existing slug blocks the whole import.</p>
      <pre><code>{zipCommands}</code></pre>
    </section>
    <section className="admin-panel">
      <h2>Read and edit a draft</h2>
      <p className="admin-help">Use a token with draft editing permission. PATCH accepts <code>title</code>, <code>summary</code>, <code>bodyMarkdown</code>, <code>tags</code>, and <code>details</code>. Omitted fields are kept. Sending <code>tags</code> or <code>details</code> replaces that field. A 409 means the draft changed. Fetch it again and review the changes before retrying.</p>
      <pre><code>{editCommands}</code></pre>
      <p className="admin-help">Keep tokens in your tool’s secret store. Publishing and token management require your signed-in studio session. Revoking a token stops future requests.</p>
    </section>
  </div>;
}
