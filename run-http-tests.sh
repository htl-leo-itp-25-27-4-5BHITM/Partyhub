#!/bin/bash
# Start services, then run the dev server and execute http tests against it.
# We avoid running `mvn test` here because tests can change DB state before the
# dev server is started (that caused flaky/incorrect http tests).

set -euo pipefail

# Start containers
docker-compose up -d

# Wait for Postgres to accept connections
MAX_DB_WAIT=60
DB_WAITED=0
echo "Waiting for Postgres on localhost:5432..."
until (echo > /dev/tcp/localhost/5432) >/dev/null 2>&1 || [ "$DB_WAITED" -ge "$MAX_DB_WAIT" ]; do
  sleep 1
  DB_WAITED=$((DB_WAITED+1))
done
if [ "$DB_WAITED" -ge "$MAX_DB_WAIT" ]; then
  echo "Postgres did not become available within ${MAX_DB_WAIT}s" >&2
  exit 1
fi
echo "Postgres is available"

# Start Quarkus in dev profile (ensures %dev properties are active) in background
# Expose the same port values used by the tests

# Start Quarkus and capture logs for debugging
QUARKUS_LOG=/tmp/quarkus.log
rm -f "$QUARKUS_LOG"
nohup mvn quarkus:dev -Dquarkus.profile=dev -Dquarkus.http.test-port=8080 -Dquarkus.http.port=8080 > "$QUARKUS_LOG" 2>&1 &
QUARKUS_PID=$!

# Wait for Quarkus to initialize and run import.sql by checking the DB
# Poll the party table row count until it's > 0 (import.sql inserts parties)
MAX_WAIT=120
WAITED=0
PARTY_COUNT=0
echo "Waiting for DB import to complete (party rows > 0)..."
until [ "$PARTY_COUNT" -gt 0 ] || [ "$WAITED" -ge "$MAX_WAIT" ]; do
  PARTY_COUNT=$(docker exec postgres psql -U demo -d demo -t -c "SELECT count(*) FROM party;" 2>/dev/null || echo 0)
  PARTY_COUNT=$(echo "$PARTY_COUNT" | tr -d '[:space:]')
  if [ -z "$PARTY_COUNT" ]; then
    PARTY_COUNT=0
  fi
  if [ "$PARTY_COUNT" -gt 0 ]; then
    break
  fi
  sleep 1
  WAITED=$((WAITED+1))
done

if [ "$PARTY_COUNT" -le 0 ]; then
  echo "DB import did not complete within ${MAX_WAIT}s" >&2
  echo "Last 200 lines of Quarkus log:" >&2
  tail -n 200 "$QUARKUS_LOG" >&2 || true
  kill $QUARKUS_PID 2>/dev/null || true
  exit 1
fi
echo "DB import complete (party rows = ${PARTY_COUNT})"

# Run the httpyac tests
if [ -f ./api/tests.log ]; then
	echo "Deleting old log-file" >&2
    rm ./api/tests.log
fi
cd api && npm ci > /dev/null && npm test >> tests.log
NPM_EXIT=$?

# Stop Quarkus before exiting
kill $QUARKUS_PID 2>/dev/null || true

exit $NPM_EXIT
