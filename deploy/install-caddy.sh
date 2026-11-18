#!/usr/bin/env bash
# Append this app's explicit domains; validate and gracefully reload existing Caddy.
set -euo pipefail
caddyfile="${1:-/opt/homeland/app/deploy/Caddyfile}"
caddy_container="${2:-app-caddy-1}"
script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f "$caddyfile" ]]; then
  echo "Caddyfile not found: $caddyfile" >&2
  exit 1
fi
if grep -Fq '# BEGIN LearnWithRich' "$caddyfile"; then
  echo 'LearnWithRich block is already installed. No changes made.'
  exit 0
fi
if grep -Eq '^[[:space:]]*(www\.)?learnwithrich\.com([[:space:],{]|$)' "$caddyfile"; then
  echo 'An existing LearnWithRich domain block needs review; no changes made.' >&2
  exit 1
fi
# Require a healthy application before changing the public proxy.
app_health="$(docker inspect --format '{{.State.Health.Status}}' learnwithrich-web)"
if [[ "$app_health" != healthy ]]; then
  echo 'learnwithrich-web must be healthy before installing Caddy routes.' >&2
  exit 1
fi
docker exec "$caddy_container" wget -q -O /dev/null http://learnwithrich-web:3000/api/health
backup="${caddyfile}.learnwithrich-backup.$(date -u +%Y%m%dT%H%M%SZ)"
cp -p -- "$caddyfile" "$backup"
rollback() {
  cat -- "$backup" > "$caddyfile"
  echo "Installation failed. Restored Caddyfile from $backup; existing live routes were not replaced." >&2
}
trap rollback ERR
# Append in place to preserve the existing single-file Docker bind mount.
cat -- "$script_directory/learnwithrich.caddy" >> "$caddyfile"
docker exec -i "$caddy_container" caddy validate --config - --adapter caddyfile < "$caddyfile"
docker exec -i "$caddy_container" caddy reload --config - --adapter caddyfile < "$caddyfile"
trap - ERR
echo "LearnWithRich routes loaded. Backup: $backup"
