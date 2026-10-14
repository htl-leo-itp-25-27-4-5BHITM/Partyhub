#!/usr/bin/env bash
# One-time local migration from the shared Postgres server. Safe to rerun.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
docker compose up -d --wait postgres keycloak-db
source_exists=$(docker compose exec -T postgres psql -U demo -d demo -Atc "SELECT count(*) FROM pg_database WHERE datname = 'keycloak'")
if [[ "$source_exists" != 1 ]]; then
  echo "No legacy Keycloak database; dedicated database is ready."
  exit 0
fi
target_tables=$(docker compose exec -T keycloak-db psql -U keycloak -d keycloak -Atc "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
if [[ "$target_tables" != 0 ]]; then
  echo "Dedicated Keycloak database already contains tables; leaving it unchanged."
  exit 0
fi
# Stop the writer before dumping. A failed migration leaves it stopped.
docker compose stop keycloak
umask 077
backup_dir="${PARTYHUB_BACKUP_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/partyhub/backups}"
mkdir -p "$backup_dir"
backup=$(mktemp "$backup_dir/keycloak-before-separation.XXXXXXXX.dump")
echo "Backing up legacy Keycloak data to $backup (retain securely until login is verified)."
docker compose exec -T postgres pg_dump -U demo -d keycloak --format=custom > "$backup"
test -s "$backup"
docker compose exec -T keycloak-db pg_restore -U keycloak -d keycloak --no-owner --no-privileges --exit-on-error --single-transaction < "$backup"
echo "Migration complete; legacy database is retained. Start Keycloak with docker compose up -d --build --wait."
