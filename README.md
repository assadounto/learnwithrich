# LearnWithRich

LearnWithRich is Richmond Adu-Kyere's learning and maker-resource site. Its public catalog and creator studio use a PostgreSQL database owned by the application.

## Current architecture

- Nine resource types: projects, articles, courses, learning paths, lessons, downloads, books, guides and illustrations.
- MFA-protected creator studio for drafting, publishing and arranging homepage sections.
- Public homepage, resource library, project/course indexes and resource detail pages read from the owned catalog.
- Local browser bookmarks for visitors.
- Google OAuth through the app's Better Auth identity setup for the creator studio.

The site includes learner Google accounts, saved resources, purchase history, Paystack checkout, and an owner-managed media library. Media is stored privately in S3; downloads are granted through short-lived, access-checked links. Resource-level purchases unlock a bundle, while free resources can offer selected attachments individually.

## Development

Requires Node.js 22.12+ and Docker for the documented database workflow.

```sh
npm install
cp .env.example .env
npm run db:up
npm run db:deploy
npm run dev
```

Open http://localhost:3000. Configure the owned Google OAuth client and the `LWR_*` variables in `.env` to use the creator studio. Register `http://localhost:3000/api/identity/callback/google` as its redirect URL.

For production, use [the Docker release procedure](deploy/DOCKER.md). Migrations are an explicit release step. Never put a filled environment file into Git.

## Resource authoring and operations

See [resource studio setup](docs/resource-admin.md) and [database backend notes](docs/resource-backend.md). The homepage builder supports automatic feeds from all resource types or manually selected published resources. Applying the homepage settings migration is required before this release is ready.

The newsletter form is not connected and does not submit email addresses. Some starter resources and covers remain previews; publish only reviewed content.
