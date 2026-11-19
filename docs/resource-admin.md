# Owner login and resource studio

This milestone adds `/admin` to the owned resource backend. The resource editor creates/edits all resource types, previews Markdown safely, publishes/unpublishes/archives resources, and assembles courses and paths from existing resources. It does not switch the public resource browser or learner commerce to the owned backend yet.

## Before opening the studio

1. Apply migrations using `npm run db:deploy` with the intended DATABASE_URL.
2. Create a dedicated Google web OAuth client in an account/project you own. Do not assume the legacy Xonbay client is suitable.
3. Set these server-side variables in local `.env` or deployment secrets:

```text
LWR_AUTH_URL=http://localhost:3000
LWR_AUTH_SECRET=<a cryptographically random secret, at least 32 characters>
LWR_GOOGLE_CLIENT_ID=<owned Google web client ID>
LWR_GOOGLE_CLIENT_SECRET=<owned Google web client secret>
```

`LWR_AUTH_URL` must be the exact origin without a trailing slash/path. Production requires HTTPS. The example localhost origin is for development only. Generate a secret locally, for example with `openssl rand -hex 32`; do not commit it.

4. Register the Google redirect URI `http://localhost:3000/api/identity/callback/google` for development and `https://YOUR_DOMAIN/api/identity/callback/google` for production.
5. Open `/admin/signin` and sign in with your Google account. Google sign-in creates an ordinary LEARNER account; it does not automatically grant owner rights.
6. The access-denied page shows **your own account ID**. On your trusted server/workstation run:

```sh
npm run owner:bootstrap -- YOUR_VERIFIED_ACCOUNT_ID
```

The command requires an existing email-verified account with a linked Google identity. A transaction lock and unique database index enforce one owner. The first signup is never automatically owner. Bootstrap cannot create another owner or elevate an arbitrary/unverified account. It is an operator command requiring database credentials, not a web endpoint.

7. Return to `/admin`. Role checks read the current user record, so there is no need to recreate a session after bootstrap.

No real owner is provisioned by tests or by application startup. Integration/HTTP tests use synthetic accounts in a separate local `_test` database and remove them afterward.

## Identity boundary

Better Auth 1.7.26 uses the existing PostgreSQL/Prisma setup for users, accounts, sessions, OAuth verification records and rate limits. Its routes live under `/api/identity` to avoid colliding with the legacy Xonbay `/api/auth/google`, `/api/auth/session` and `/api/auth/logout` routes. New cookies have the `lwr_identity` prefix; studio sign-out invalidates the owned identity session only.

Google OAuth is the only enabled sign-in method. Email/password login and automatic account linking are disabled. Role is a server-owned additional field (`input: false`), and OAuth tokens are encrypted by the auth library. Sessions last up to one day and use HTTP-only same-site cookies, secure cookies on HTTPS, and no cookie session cache. Every protected page/server action verifies the session and then re-reads owner role, email verification and Google-account linkage from the database. Private repositories also recheck owner status, including inside mutation transactions.

The public `/api/catalog` remains read-only and never exposes private resource content or audit snapshots. Studio pages are dynamic and marked noindex. Next.js Server Actions provide the mutation transport, including same-origin checks; action identifiers alone confer no permission. Owner checks run inside each action, not only in the workspace layout.

The initial limiter is deliberately configured not to trust incoming forwarded-IP headers. With no trusted proxy configured, clients share per-path limits (100 requests/minute). Before a wider public authentication rollout, configure a proxy that strips/replaces client-supplied headers and pass only that verified header/trusted proxy configuration to Better Auth. Do not trust arbitrary X-Forwarded-For values. Add owner MFA/step-up authentication before a public production admin launch; this milestone does not configure or certify the owner's Google MFA policy.

## Resource workflow

- `/admin`: search up to 100 recently updated resources by title/slug; open drafts, published content or archives.
- `/admin/resources/new`: choose a type, title, slug, summary, body, tags, HTTPS cover URL, access mode and price. Save creates a draft.
- `/admin/resources/:id`: edit, preview, save, publish, return to draft, or archive.
- Preview is inside the protected editor and uses the existing escaped Markdown renderer. It never publishes a draft or opens an unguarded preview URL.
- Public/published resource edits become visible when saved. The editor explicitly says so. To work privately, first return the resource to draft. Draft staging/release approval for an already-published revision is not implemented.
- Public/free-account prices must be zero; paid resources require a positive minor-unit amount. The UI accepts a decimal string and converts it to minor units without floating-point multiplication.
- Public resource visibility is handled by the owned catalog APIs. The existing public frontend is still connected to Xonbay, so these newly published resources do not appear there until the catalog adapter/cutover milestone.

### Courses and paths

Courses accept lessons. Paths accept mixed resource types. Add optional sections, choose existing resources, and use labeled up/down buttons to set the global learning order. Section grouping does not implicitly reorder resources. The picker shows up to 500 resources; this is a bounded first version, not a fully paginated catalog picker.

Saving replaces only the edited collection's links/sections in one transaction. Original child resources are never copied or deleted. Removing a section keeps its items and clears their section assignment. Invalid child types, circular membership, cross-collection sections and duplicate items are rejected and the entire save rolls back.

Clear the current collection's items/sections before changing it to a non-collection type. To change a path containing non-lessons into a course, first remove incompatible children and save the path, then change its type.

## Edit conflicts and audit history

Each saved record has an optimistic version and updated-at token. Both must still match when saving or changing publication status. Stale tabs receive a reload message rather than silently overwriting newer content. Existing trusted CLI publication/collection operations also increment the resource version.

Create/update/publication changes write a ResourceAudit row in the same transaction. It records actor, action, version and a complete resource snapshot including private body, tags and composition. The studio shows recent change metadata; snapshots remain private. There is no web endpoint for mutating audit entries. An audited restore UI and tamper-evident external audit storage are future work; these records should not be described as a database-level immutable ledger.

The trusted low-level CLI remains an operator tool and does not record an authenticated owner actor. Prefer the studio for attributable edits. It must never be exposed directly to a browser.

## Verification

```sh
npm run db:validate
npm run typecheck
npm test
npm run test:db
npm run build
npm run test:admin-http
```

Both database commands require TEST_DATABASE_URL pointing to a separate local PostgreSQL database whose name ends in `_test`. The HTTP check requires the build and migrations first; `test:db` applies migrations. Run these two database suites serially because owner bootstrap intentionally enforces a single owner.

Database tests cover signed sessions, expired/revoked sessions, role injection, cross-origin requests, verified owner bootstrap, authorization, stale writes, snapshots, collection rollback and role revocation. HTTP tests start the standalone production server on a random loopback port, use signed synthetic database sessions, and exercise protected page rendering plus real Server Action requests for create/publish/unpublish and denial cases. They make no Google OAuth requests and clean up test fixtures.

Live Google OAuth needs the real configured credentials and redirect URLs above and is a separate deployment verification. Browser visual verification is also separate from server-rendered/HTTP checks.
