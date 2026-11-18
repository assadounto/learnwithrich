# Deploy learnwithrich.com on the existing Docker server

Target: `/opt/learnwithrich`. Existing Caddy: `app-caddy-1`, Compose `/opt/homeland/app/docker-compose.prod.yml`, configuration `/opt/homeland/app/deploy/Caddyfile`, external Docker network `app_edge`.

## DNS

Point the apex `learnwithrich.com` A record at this server's public IPv4 address. Point `www` to the apex with a CNAME. Any AAAA record must reach this same server over IPv6. Existing Caddy already owns public ports 80/443 and obtains certificates for the explicit domain blocks.

## Install

Use the integration branch until PR #1 is merged. After merge, clone the default branch instead. If this directory already contains a checkout, update that checkout instead of cloning over it.

```bash
cd /opt
git clone --branch feat/learnwithrich-foundation https://github.com/assadounto/learnwithrich.git learnwithrich
cd /opt/learnwithrich
cp deploy/production.env.example .env.production
docker network inspect app_edge
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml up -d --build --wait --wait-timeout 180
```

The app listens only on the Docker network, not on an additional public port. The image runs as the unprivileged Node user. Environment files are excluded from image builds. Runtime values belong in `.env.production`; this deployment intentionally has no `NEXT_PUBLIC_` secrets or build-time credentials.

Check that Caddy can reach it, then install the domain blocks:

```bash
docker exec app-caddy-1 wget -qO- http://learnwithrich-web:3000/api/health
bash deploy/install-caddy.sh
curl -I https://learnwithrich.com
curl -I https://www.learnwithrich.com
```

The installer backs up the host Caddyfile, appends only the two LearnWithRich blocks, validates inside the actual Caddy container and reloads gracefully. Failed validation restores the host file. It does not restart Caddy or modify the Xonbay Compose project. Existing managed blocks are not appended twice. The snippet can also be appended manually if preferred; validate before reload.

## Backend configuration

After merging backend PR #135 into your deployment source, add these to the existing Rails backend environment (where the current API container reads its environment):

```env
LEARNWITHRICH_SHOP_ID=46
LEARNWITHRICH_FRONTEND_URL=https://learnwithrich.com
```

Recreate the API service with its existing Compose deployment procedure to apply changed environment variables; `docker restart` alone does not reload Compose env files. Keep Xonbay's own `FRONTEND_URL` and existing credentials unchanged. No new database migrations are part of PR #135.

## Google

On the existing Google web OAuth client whose public ID is in the env example, add `https://learnwithrich.com` to Authorized JavaScript origins. The `www` host redirects to the apex. No client secret or extra OAuth redirect URI is required for this ID-token popup flow. Test a real sign-in at the apex after DNS and HTTPS are live.

## Verification and updates

Check `/signin`, anonymous `/dashboard` redirect, product listings, free entitlement and a provider test checkout before claiming the commerce flow is live. Shop 46 must have published digital products. Do not publish the local example course/catalog as real content.

```bash
cd /opt/learnwithrich
git pull --ff-only
docker compose -f docker-compose.prod.yml up -d --build --wait --wait-timeout 180
docker compose -f docker-compose.prod.yml logs --tail=100 web
```

The readiness endpoint checks this app's HTTP process, not Xonbay's availability. Its container can be healthy while an upstream service is temporarily unavailable. Initial rollout has a brief app restart; this is not a zero-downtime deployment scheme.
