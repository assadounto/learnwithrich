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

5. The container rejects missing/placeholder credentials and mismatched non-HTTPS origins. This release deploys with `LWR_ADMIN_ENABLED=false`: the public admin and owned identity endpoints stay locked until MFA is implemented. The public website and read-only catalog remain available.

Check process health at `/api/health` and database/schema readiness at `/api/ready`. Both must return 200 before routing traffic. The database has no published host port.
6. Sign in at `/admin/signin`, obtain your account ID, then run:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm tools owner:bootstrap -- YOUR_ACCOUNT_ID
```

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

Supply real credentials, test Google login/sign-out, configure trusted-proxy rate limiting, and complete owner MFA/step-up protection before exposing admin publicly. Until then restrict `/admin*` and `/api/identity*` at your reverse proxy to your trusted access network. These deployment files do not configure DNS, Caddy, Google, or MFA automatically. The old deploy/README.md describes the historical Xonbay-only rollout; use this procedure for the owned database/studio.
