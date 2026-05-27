#!/bin/bash
set -e

KEYCLOAK_DIR=/opt/keycloak

# Use realm-dev.json if available (local dev), fall back to realm-staging.json
IMPORT_FILE=""
if [ -f "$KEYCLOAK_DIR/data/import/realm-dev.json" ]; then
  IMPORT_FILE="$KEYCLOAK_DIR/data/import/realm-dev.json"
elif [ -f "$KEYCLOAK_DIR/data/import/realm-staging.json" ]; then
  IMPORT_FILE="$KEYCLOAK_DIR/data/import/realm-staging.json"
fi

# Start Keycloak in background
$KEYCLOAK_DIR/bin/kc.sh "$@" &
KC_PID=$!

trap "kill $KC_PID 2>/dev/null" EXIT

# Wait for Keycloak health endpoint
echo "Waiting for Keycloak to start..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:9000/health/ready > /dev/null 2>&1; then
    echo "Keycloak is ready."
    break
  fi
  if ! kill -0 $KC_PID 2>/dev/null; then
    echo "Keycloak process died."
    exit 1
  fi
  sleep 2
done

# Update the realm via Admin CLI if realm already exists in DB
if [ -n "$IMPORT_FILE" ]; then
  echo "Configuring kcadm..."
  $KEYCLOAK_DIR/bin/kcadm.sh config credentials \
    --server http://localhost:8080 \
    --realm master \
    --user "${KC_BOOTSTRAP_ADMIN_USERNAME:-admin}" \
    --password "${KC_BOOTSTRAP_ADMIN_PASSWORD:-admin}" > /dev/null 2>&1

  REALM_EXISTS=$($KEYCLOAK_DIR/bin/kcadm.sh get realms/partyhub > /dev/null 2>&1 && echo "yes" || echo "no")

  if [ "$REALM_EXISTS" = "yes" ]; then
    echo "Updating partyhub realm..."
    $KEYCLOAK_DIR/bin/kcadm.sh update realms/partyhub -f "$IMPORT_FILE" || true
    echo "Realm update complete."
  fi
fi

# Bring Keycloak to foreground
wait $KC_PID
