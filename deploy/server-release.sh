#!/usr/bin/env bash
set -Eeuo pipefail

app_dir="${1:?Usage: server-release.sh APP_DIR RELEASE_SHA}"
release_sha="${2:?Usage: server-release.sh APP_DIR RELEASE_SHA}"

[[ "$app_dir" =~ ^/[A-Za-z0-9._/-]+$ && "$app_dir" != *"/../"* ]] || {
  echo "Invalid application directory." >&2
  exit 2
}
[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || {
  echo "Release SHA must be a full 40-character commit SHA." >&2
  exit 2
}

cd "$app_dir"
[[ -f .env.production ]] || {
  echo "Missing $app_dir/.env.production; provision it using deploy/DOCKER.md." >&2
  exit 1
}
[[ -f docker-compose.prod.yml ]] || {
  echo "Missing docker-compose.prod.yml in $app_dir." >&2
  exit 1
}

git fetch --quiet --no-tags origin main
git cat-file -e "$release_sha^{commit}"
git checkout --detach "$release_sha"

compose=(docker compose --env-file .env.production -f docker-compose.prod.yml)
"${compose[@]}" config --quiet
"${compose[@]}" build web tools
"${compose[@]}" up -d --wait db

backup_dir="$app_dir/backups"
install -d -m 700 "$backup_dir"
backup_file="$backup_dir/pre-release-$release_sha.dump"
"${compose[@]}" exec -T db pg_dump -U learnwithrich -d learnwithrich -Fc </dev/null > "$backup_file"
test -s "$backup_file"

# Migrations are a release gate. A failure stops before the web image is replaced.
"${compose[@]}" run --rm tools db:deploy </dev/null
"${compose[@]}" up -d --wait web

curl --fail --silent --show-error --retry 12 --retry-connrefused --retry-delay 5 --max-time 15 \
  https://learnwithrich.com/api/ready

echo "Deployment succeeded: $release_sha"
echo "Pre-migration database dump: $backup_file"
