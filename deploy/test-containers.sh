#!/usr/bin/env bash
# Disposable Docker release smoke test. Never uses production env files or volumes.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
web_image="${LWR_WEB_IMAGE:-learnwithrich:production-check}"
tools_image="${LWR_TOOLS_IMAGE:-learnwithrich:tools-check}"
run_id="lwr-smoke-$$"
network="${run_id}-net"
db="${run_id}-db"
web="${run_id}-web"
enabled_web="${run_id}-enabled-web"
scratch="$(mktemp -d)"
chmod 700 "$scratch"
cleanup() {
  docker rm -fv "$web" "$enabled_web" "$db" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  rm -rf -- "$scratch"
}
trap cleanup EXIT
if [[ "${LWR_SKIP_BUILD:-0}" != 1 ]]; then
  docker build --target runner -t "$web_image" .
  docker build --target tools -t "$tools_image" .
fi
node --input-type=module - "$scratch/runtime.env" "$db" <<'JS'
import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const password=randomBytes(24).toString('hex');
writeFileSync(process.argv[2], `LWR_AUTH_URL=https://learnwithrich.test\nLWR_AUTH_SECRET=${randomBytes(32).toString('hex')}\nLWR_GOOGLE_CLIENT_ID=container-test-client\nLWR_GOOGLE_CLIENT_SECRET=container-test-secret\nLWR_ADMIN_ENABLED=false\nPOSTGRES_PASSWORD=${password}\nDATABASE_URL=postgresql://learnwithrich:${password}@${process.argv[3]}:5432/learnwithrich_test\nS3_REGION=us-east-1\nS3_BUCKET=learnwithrich-test\nS3_ACCESS_KEY_ID=test-access-key\nS3_SECRET_ACCESS_KEY=test-secret-key\nPAYSTACK_SECRET_KEY=sk_test_container-check\nPAYSTACK_WEBHOOK_SECRET=whsec_container-check\n`,{mode:0o600});
JS
docker network create "$network" >/dev/null
docker run -d --name "$db" --network "$network" --env-file "$scratch/runtime.env" -e POSTGRES_USER=learnwithrich -e POSTGRES_DB=learnwithrich_test postgres:18-bookworm >/dev/null
for attempt in $(seq 1 60); do
  if docker exec "$db" pg_isready -U learnwithrich -d learnwithrich_test >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == 60 ]]; then echo 'PostgreSQL did not become ready' >&2; exit 1; fi
  sleep 1
done
docker run --rm --network "$network" --env-file "$scratch/runtime.env" "$tools_image" db:deploy
docker run -d --name "$web" --network "$network" --env-file "$scratch/runtime.env" "$web_image" >/dev/null
for attempt in $(seq 1 60); do
  if docker exec "$web" node -e "fetch('http://127.0.0.1:3000/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == 60 ]]; then docker logs "$web"; exit 1; fi
  sleep 1
done
[[ "$(docker inspect --format '{{.Config.User}}' "$web")" == node ]]
docker exec "$web" node --input-type=module -e "for(const [path,status] of [['/api/health',200],['/api/ready',200],['/api/catalog',200],['/icon.svg',200],['/fonts/dm-sans.woff',200],['/api/identity/get-session',200]]){const r=await fetch('http://127.0.0.1:3000'+path);if(r.status!==status)throw Error(path+': '+r.status);console.log(path,status)}"
if docker run --rm "$web_image" >"$scratch/rejected.log" 2>&1; then echo 'Unconfigured production startup unexpectedly succeeded' >&2; exit 1; fi
grep -q 'Production configuration rejected' "$scratch/rejected.log"
# The opt-in admin mode must also start with the MFA release. Anonymous users
# can reach sign-in but never the private workspace.
docker run -d --name "$enabled_web" --network "$network" --env-file "$scratch/runtime.env" -e LWR_ADMIN_ENABLED=true "$web_image" >/dev/null
for attempt in $(seq 1 60); do
  if docker exec "$enabled_web" node -e "fetch('http://127.0.0.1:3000/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == 60 ]]; then docker logs "$enabled_web"; exit 1; fi
  sleep 1
done
docker exec "$enabled_web" node --input-type=module -e "const s=await fetch('http://127.0.0.1:3000/admin/signin');if(s.status!==200||!(await s.text()).includes('Continue with Google'))throw Error('Admin sign-in unavailable');const a=await fetch('http://127.0.0.1:3000/api/identity/get-session');if(a.status!==200)throw Error('Enabled identity unavailable');const p=await fetch('http://127.0.0.1:3000/admin',{redirect:'manual'});const body=await p.text();if(!(p.status===307&&p.headers.get('location')?.endsWith('/admin/signin'))&&!(p.status===200&&body.includes('NEXT_REDIRECT;replace;/admin/signin;307;')))throw Error('Anonymous studio was not redirected')"
docker stop "$db" >/dev/null
docker exec "$web" node --input-type=module -e "const r=await fetch('http://127.0.0.1:3000/api/ready');if(r.status!==503)throw Error('Readiness must fail without DB');const l=await fetch('http://127.0.0.1:3000/api/health');if(l.status!==200)throw Error('Liveness must remain available')"
echo 'PASS Docker release smoke: migration, non-root runtime, catalog/static assets, startup validation, admin disabled/enabled modes and database-loss readiness'
