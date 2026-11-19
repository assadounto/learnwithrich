# Owner login and resource studio

The owned `/admin` studio manages all nine resource types, safely previews Markdown, publishes/unpublishes/archives resources, assembles courses and paths, and arranges homepage sections. The public homepage, resource library, project/course listings and resource details read published content from the owned PostgreSQL catalog. Legacy checkout/shop integrations remain separate.

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

The initial limiter is deliberately configured not to trust incoming forwarded-IP headers. With no trusted proxy configured, clients share per-path limits (100 requests/minute). Before a wider public authentication rollout, configure a proxy that strips/replaces client-supplied headers and pass only that verified header/trusted proxy configuration to Better Auth. Do not trust arbitrary X-Forwarded-For values. App-level authenticator MFA is mandatory for owner access, independently of the Google account’s own MFA policy. Follow the enrollment and recovery procedure below.

## Resource workflow

- `/admin`: search up to 100 recently updated resources by title/slug; open drafts, published content or archives.
- `/admin/resources/new`: choose a type, title, slug, summary, body, tags, HTTPS cover URL, access mode and price. Save creates a draft.
- `/admin/resources/:id`: edit, preview, save, publish, return to draft, or archive.
- Preview is inside the protected editor and uses the existing escaped Markdown renderer. It never publishes a draft or opens an unguarded preview URL.
- Public/published resource edits become visible when saved. The editor explicitly says so. To work privately, first return the resource to draft. Draft staging/release approval for an already-published revision is not implemented.
- Public/free-account prices must be zero; paid resources require a positive minor-unit amount. The UI accepts a decimal string and converts it to minor units without floating-point multiplication.
- Published resources flow into the homepage and public catalog. See **Homepage and public catalog** below for selection rules and rollout steps.

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


## Mandatory owner MFA

After Google sign-in and the one-time owner bootstrap, `/admin` sends the owner to `/admin/security`. Set up a standard TOTP authenticator with the locally generated QR code or manual key and confirm a six-digit code. Setup requires Google sign-in within the previous 10 minutes, expires after 10 minutes, and is bound to that session. No enrollment secret is sent to an external QR service. The server encrypts secrets using `LWR_AUTH_SECRET`; preserve that secret and encrypted database backups.

Save the ten 128-bit recovery codes when shown. Only their hashes are stored. Each code works once and still requires a valid owner Google session. Authenticator codes use 30-second periods with a one-period clock tolerance. Accepted codes cannot be replayed, including from another session. Five failed guesses across sessions and factors lock verification for 15 minutes; successful verification resets failures. Verification lasts 15 minutes in the authoritative database session. A new Google session does not inherit another session’s verification. Every private page and server action checks the gate; mutation repositories recheck it inside the transaction.

Use Security in the studio to generate replacement recovery codes with a new authenticator code. This immediately invalidates the previous set. To replace a lost authenticator, sign in with Google, open `/admin/security`, choose Replace authenticator, and enter an unused recovery code (or a new code from the current authenticator). Replacement removes the factor and old recovery set and revokes all sessions. Sign in with Google again and enroll the new device; private access stays blocked until confirmation. There is no browser endpoint that disables MFA without proving an existing factor.

If both the device and all recovery codes are lost, a trusted server operator can run `npm run owner:mfa-reset -- EXACT_OWNER_ID --confirm` (or use the Docker tools image with `owner:mfa-reset -- EXACT_OWNER_ID --confirm`). This requires direct database credentials, checks the existing verified owner and revokes every session. It cannot promote a user. The owner must sign in with Google and enroll again. Never expose this operator command through an API.

The production environment may set `LWR_ADMIN_ENABLED=true` after migrations and OAuth setup. Keep it false to take the studio and owned identity endpoints offline. Upgrading applies a migration that signs out existing owner sessions. Local automated tests cover database concurrency and signed-session HTTP/server actions; test the actual Google callback and enrollment with the owner’s device after deploying.

## Workspace and resource authoring

The studio uses its own fixed header and sidebar, with a centered content area and mobile navigation drawer. Public pages keep their existing URLs under a separate site layout. All workspace routes and authoring actions retain the owner/MFA gate. The library supports search, type and publishing-status filters, with totals read from the database.

Resource creation supports all nine types. Each type has its own fields and content outline: project materials and source/demo links; article reading time and author; course/path learning outcomes and prerequisites; lesson video and duration; download file/format/version; book author/ISBN/pages/edition; guide content and optional file; illustration file/dimensions/alt text/license. Courses contain existing lessons; paths reuse existing resources in order. Optional fields can remain empty in drafts.

Type-specific fields live in `resource_content.details` and are validated against the selected type. Apply the resource-details migration before starting this release. Metadata and file links for paid/account-only resources are omitted from public detail and outline projections, like their content bodies. File URLs point to storage you operate; their storage permissions must match your intended access. This release links hosted files and images and does not implement media uploads or signed private-file delivery.

Publishing requires a summary and usable content for the selected type (including file URLs for downloadable types, lesson content/video, and items for collections). The same checks apply when editing already-published resources. Invalid or empty drafts remain saveable. The editor includes automatic slugs, Markdown tools, a preview, starter outlines, cover previews, save-state feedback and a readiness checklist. Type changes warn before clearing type-specific fields and collection items.

## Homepage and public catalog

- `/admin/homepage` is the protected homepage builder. It starts with one automatic section showing the newest published resources across all nine types.
- Add up to 12 sections, move them up or down, set each section's label/title/description, choose one type or all types, and set its card count.
- Automatic sections read the newest matching published resources on each request. Selected sections let you curate up to 24 published resource IDs, in the order selected. Drafts and archived resources never appear.
- `/resources` supports type and title/summary/tag search. `/projects` and `/courses` are database-backed collections. Resource detail pages render type-specific metadata, body Markdown, course/path contents and public file links.
- Paid and free-account pages may show catalog cards and summaries. Their body, type-specific details, child-resource outlines and file URLs remain hidden until an access/grant flow is implemented. Paid checkout is not yet connected to owned resources.
- The homepage builder requires the `homepage_settings` migration (`20261121000000_homepage_composition`). Readiness checks this table, so deploy the full migration set with `npm run db:deploy` before starting the new web image.
- The public `/shop`, checkout/payment and historical project detail routes still use the Xonbay integration. The owned resource catalog does not import or delete that legacy catalog data.
