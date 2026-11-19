# Owned resource backend: first milestone

Everything in the catalog is a `Resource`. Types: PROJECT, ARTICLE, COURSE, PATH, LESSON, DOWNLOAD, BOOK, GUIDE and ILLUSTRATION. Tags describe topics; they do not determine resource type.

This milestone adds PostgreSQL/Prisma storage, trusted resource-management services, a local CLI, and read-only public catalog endpoints. The existing frontend and Xonbay integration are deliberately not switched yet. Owner authentication/admin editing is now available in the next milestone; see [resource studio setup](resource-admin.md). Learner progress, grants, payment processing and private asset delivery are subsequent milestones. No public write endpoints or unauthenticated admin tools are deployed by this change.

## Local setup

Node 22.12+ and Docker are required for the documented development workflow. Prisma CLI/client/adapter are pinned together at 7.10.1.

1. Run `npm ci` (generates the Prisma client).
2. Copy `.env.example` to `.env` if there is no local configuration yet. Preserve existing secrets/configuration.
3. Run `npm run db:up`. PostgreSQL is bound only to `127.0.0.1:54329` with a persistent development volume. Its sample password is for local development only.
4. Set `DATABASE_URL=postgresql://learnwithrich:local-development-only@127.0.0.1:54329/learnwithrich` in `.env`.
5. Run `npm run db:deploy` to apply the committed migrations.
6. Run `npm run dev`.

The existing app can build and run without DATABASE_URL. Only the new catalog endpoints return 503 when their database is unavailable; failures do not fall back to invented resources or expose connection details.

`npm run db:down` stops development services without deleting the database volume. Do not add `-v` unless you deliberately intend to delete local database data. Deployment never auto-runs migrations on application startup. Apply `db:deploy` explicitly as a release step using the migration connection; use `db:migrate -- --name meaningful_name` only for development migrations.

## Schema

- `resources`: stable UUID and unique lowercase slug, explicit type, title, summary, HTTPS cover URL, access mode, status, price/currency, timestamps.
- `resource_content`: body Markdown; kept separate from all catalog/card projections.
- `tags` / `resource_tags`: canonical lowercase topics with unique links.
- `resource_sections`: optional ordered modules/sections of a course or path.
- `resource_items`: ordered references to existing resources, optionally assigned to a section belonging to that same collection.

Courses contain lessons. Paths may combine any resource types, including courses and other paths. A resource can occur in multiple collections, but not twice in one collection. References preserve a single editable source; there is no content duplication. Section order and item order are stored separately: item positions are the canonical sequence across the collection, with section IDs providing grouping.

The migration also defines PostgreSQL constraints and triggers beyond what Prisma schema syntax expresses. These prevent negative/inconsistent prices, published resources without a publication date, invalid section parents, invalid course membership, self-links, indirect cycles, and type changes that would invalidate existing links. A transaction-scoped advisory lock serializes graph writes, including direct SQL writes. The integration suite checks concurrent opposite-edge insertion. If collection-edit throughput later requires a finer-grained locking scheme, change it together with concurrency tests.

When changing these invariants, add a new migration. Do not rewrite an already-applied migration in a deployed environment. The migration SQL, including its triggers, must remain versioned and reviewed.

## Manage local content

The CLI is a trusted operator tool with database credentials. It is not a substitute for the forthcoming authenticated admin UI. All newly created resources are drafts, regardless of unexpected input fields.

Create `draft.json` outside versioned source or in your own scratch directory:

```json
{
  "slug": "understanding-microcontrollers",
  "type": "ARTICLE",
  "title": "Understanding microcontrollers",
  "summary": "A starting point for connected-device projects.",
  "access": "PUBLIC",
  "bodyMarkdown": "## A small computer with a purpose\n\nYour article text goes here.",
  "tags": ["electronics", "esp32"]
}
```

```sh
npm run resources -- create draft.json
npm run resources -- publish RESOURCE_UUID
npm run resources -- list
npm run resources -- get understanding-microcontrollers
npm run resources -- archive RESOURCE_UUID
```

Create a COURSE or PATH the same way. To add sections, prepare a JSON object such as `{"title":"Getting started","position":0}` and run:

```sh
npm run resources -- section COLLECTION_UUID section.json
```

To compose/reorder a collection, prepare an array in the desired global order:

```json
[
  {"resourceId":"LESSON_UUID", "sectionId":"SECTION_UUID"},
  {"resourceId":"ANOTHER_LESSON_UUID"}
]
```

```sh
npm run resources -- items COLLECTION_UUID items.json
```

Replacement runs atomically: invalid membership, duplicate child IDs, wrong-section ownership or a cycle rolls the entire edit back. COURSE accepts LESSON children only. PATH accepts mixed resources. A shared lesson's body can later be edited through the owner editor without updating every course/path link.

## Public API

- `GET /api/catalog`: published metadata only.
- Filters: `type=path`, `tag=esp32`, `q=solar`, `page=1`, `limit=12`.
- Types are case-insensitive input; output uses the enum names. Page is 1–1000 and limit is 1–48. Search is bounded and applies to title, summary and tags, never private body text.
- `GET /api/catalog/:slug`: metadata, ordered published-child outlines, section labels and the resource's own body only when access is PUBLIC.
- Draft, archived and future-dated published resources are omitted. Unknown/draft slugs return 404.
- PAID and FREE_ACCOUNT resources expose metadata but bodyMarkdown is null. A public path never unlocks its private children. Authenticated content access is not implemented in this milestone.
- Prices use integer minor units. PUBLIC and FREE_ACCOUNT require zero; PAID requires a positive amount and uppercase three-letter currency.
- Only GET handlers exist. Next.js returns 405 for unsupported mutation methods.

A future frontend adapter can consume these DTOs while preserving the existing resource browser design. It should not reinterpret a path/course as a copy of each contained resource. Progress and entitlements will be keyed to the resource identity, with grant provenance modeled before collection purchases are enabled.

## Verification

```sh
npm run db:validate
npm run typecheck
npm test
npm run build
```

For integration tests, create a **separate local database**:

```sh
docker compose -f docker-compose.dev.yml exec db createdb -U learnwithrich learnwithrich_test
# TEST_DATABASE_URL is in .env.example; add it to your local .env.
npm run test:db
```

The runner accepts only a local PostgreSQL host and a database name ending in `_test`, applies migrations there, and runs the suite. It never falls back to DATABASE_URL. Fixtures have unique per-run IDs/slugs and cleanup deletes only that run's data, not existing tables or unrelated content. CI runs validation, unit tests, integration tests and the production build with a PostgreSQL service.

## Following milestones

Better Auth, owner bootstrap and the resource admin editor are documented in [resource-admin.md](resource-admin.md). The owner UI should support create/edit, preview, publish/archive, tags, access/price, and ordered course/path composition. Once that works end-to-end, connect the existing Resources browser to this owned catalog and remove its Xonbay catalog dependency. Payment/access and learner progress come after identity and ownership are established.
