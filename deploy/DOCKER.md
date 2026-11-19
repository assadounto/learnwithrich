# Docker release procedure

This branch includes the owner studio. Public resource pages still use Xonbay.

1. Copy `deploy/production.env.example` to `.env.production`. Replace every placeholder. Generate independent auth/database secrets with `openssl rand -hex 32`. Match the database password in DATABASE_URL; hex avoids URL-encoding ambiguity. Never commit the filled file. Set permissions with `chmod 600 .env.production`.
2. Register `https://learnwithrich.com/api/identity/callback/google` on your owned Google OAuth client.
3. Ensure the existing HTTPS Caddy proxy and external `app_edge` network are available.
4. Build both images:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml build web tools
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait db
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm tools db:deploy
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait web
```

5. The container rejects missing/placeholder credentials and mismatched non-HTTPS origins. Keep `LWR_ADMIN_ENABLED=false` to leave the studio offline, or set it to `true` after migrations and Google OAuth configuration. With admin enabled, a Google session alone cannot open the studio: authenticator enrollment and verification are mandatory. The public website and read-only catalog remain available in either mode.

Check process health at `/api/health` and database/schema readiness at `/api/ready`. Both must return 200 before routing traffic. The database has no published host port.
6. With admin enabled, sign in at `/admin/signin`. The access-denied page shows your account ID. Bootstrap that verified Google account once:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm tools owner:bootstrap -- YOUR_ACCOUNT_ID
```

7. Open `/admin` again. Enroll your authenticator at `/admin/security`, verify a six-digit code and securely save the ten single-use recovery codes. Enrollment requires a Google session created within the last 10 minutes; sign out/in if needed. MFA verification lasts 15 minutes per session and is required for private pages, saves and publishing. The MFA migration revokes existing owner sessions.

The tools image contains Prisma and operator scripts; the web image remains a non-root standalone server. Migrations are an explicit release step, not a race between restarting web replicas. Do not deploy if migration fails.

## Backups and updates

Before every migration, create a database backup outside the container:

```sh
mkdir -p backups
chmod 700 backups
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db pg_dump -U learnwithrich -d learnwithrich -Fc > backups/pre-release.dump
```

Check command success and archive backups encrypted off-host. Test restores into an isolated database before relying on backups. Preserve `.env.production`, especially LWR_AUTH_SECRET: it encrypts OAuth tokens. Never use `down -v` on production. Database volumes survive image replacement, but are not backups.

Tag and retain the previous web/tools images before building updates. Roll back application images only when the applied schema is backward-compatible; otherwise restore a tested backup with an explicit maintenance plan. This procedure has a brief restart window, not zero downtime.

## Remaining launch verification

Supply real credentials, test Google login/sign-out and owner enrollment on the real domain, verify backup restores, and configure trusted-proxy rate limiting. Authenticator setup is completed by the owner after deployment; it is never silently enabled by an environment flag. Keep the studio disabled or restricted to your trusted access network until those server checks pass. These deployment files do not configure DNS, Caddy or Google automatically. The old deploy/README.md describes the historical Xonbay-only rollout; use this procedure for the owned database/studio.

## Reproducible isolated verification

Run `bash deploy/test-containers.sh` with Docker Desktop/Engine running. It builds both images and starts a disposable network/database/web stack using random local test secrets, without production env files. It verifies migrations, non-root startup, static assets, catalog, locked admin identity, rejection of missing production configuration, and readiness failure when PostgreSQL stops. Its cleanup removes only its own test containers/volumes/network. Cached images remain available.

Verified locally on 2026-11-19 with Docker Desktop, Node 22 and PostgreSQL 18: both image builds and the full smoke test passed. The MFA release additionally has database and production-server regression coverage for enrollment, recovery, expiry and publishing gates; real OAuth credentials, owner-device enrollment, DNS, TLS and backups still require server verification.

The base image includes OpenSSL and CA certificates before Prisma installation. The lockfile overrides PostCSS to the audited patched release; rerun `npm audit --omit=dev` when preparing a release rather than treating an old audit result as permanent.
