#!/usr/bin/env bash
# Configures the partyhub realm for the settings page (add-settings-page change):
#   - confidential client "partyhub-backend-admin" with a service account (manage-users, view-users)
#   - password policy length(8), notUsername, passwordHistory(1)
#   - user events with the "email" listener (sends the "password changed" mail)
#   - UPDATE_PASSWORD required action always asks for the current password (max_auth_age 0)
#   - e-mail theme "partyhub"
#
# Idempotent: it only creates or updates, never deletes, and running it twice changes nothing.
# kcadm.sh runs inside the Keycloak container with the container's bootstrap admin, so no
# admin password leaves the cluster. JSON handling happens locally with python3.
#
# Usage:
#   scripts/keycloak-configure-settings.sh --local [--dry-run]   # docker-compose Keycloak
#   scripts/keycloak-configure-settings.sh [--dry-run]           # school-cloud Keycloak (kubectl)
#
# Cluster mode uses the current kubectl context; set KUBE_NAMESPACE to target another namespace
# (the production Keycloak runs in the namespace behind it220274.cloud.htl-leonding.ac.at).
#
# In cluster mode the client secret is written to the Kubernetes secret
# "partyhub-keycloak-admin" (key client-secret) instead of being printed.
set -euo pipefail

MODE=cluster
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --local) MODE=local ;;
    --dry-run) DRY_RUN=true ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

REALM=partyhub
CLIENT_ID=partyhub-backend-admin
K8S_SECRET=partyhub-keycloak-admin
KCADM_CONFIG=/tmp/kcadm-partyhub-settings.config

if [[ "$MODE" == local ]]; then
  exec_kc() { docker compose exec -T keycloak "$@"; }
else
  KUBECTL=(kubectl ${KUBE_NAMESPACE:+--namespace "$KUBE_NAMESPACE"})
  exec_kc() { "${KUBECTL[@]}" exec -i deploy/keycloak -c keycloak -- "$@"; }
fi

kcadm() { exec_kc /opt/keycloak/bin/kcadm.sh "$@" --config "$KCADM_CONFIG"; }
change() {
  if $DRY_RUN; then echo "[dry-run] would $1"; else echo "-> $1"; return 1; fi
}

echo "Keycloak settings configuration (mode=$MODE, dry-run=$DRY_RUN)"

# Log in with the bootstrap admin from the container environment (password never echoed).
# Inside the container Keycloak listens on 8080 under its optional relative path.
exec_kc bash -c '/opt/keycloak/bin/kcadm.sh config credentials --config "$1" \
  --server "http://localhost:8080${KC_HTTP_RELATIVE_PATH:-}" --realm master \
  --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null' _ "$KCADM_CONFIG"

# The "email" event listener and e-mail theme need the PartyHub image (Dockerfile.keycloak):
# it brings the templates and limits the listener to UPDATE_PASSWORD. On a plain Keycloak image
# the listener would also mail every failed login, so those steps are skipped there.
if exec_kc bash -c 'test -d /opt/keycloak/themes/partyhub && test "${KC_SPI_EVENTS_LISTENER__EMAIL__INCLUDE_EVENTS:-}" = UPDATE_PASSWORD'; then
  PARTYHUB_IMAGE=true
else
  PARTYHUB_IMAGE=false
  echo "!! Keycloak does not run the PartyHub image: skipping the e-mail listener and e-mail theme."
  echo "!! Deploy Dockerfile.keycloak first, then run this script again."
fi

# --- Realm settings ---------------------------------------------------------
REALM_JSON=$(kcadm get "realms/$REALM")
REALM_UPDATE=$(MODE="$MODE" PARTYHUB_IMAGE="$PARTYHUB_IMAGE" python3 -c '
import json, os, sys
realm = json.load(sys.stdin)
update = {}
wanted_policy = ["length(8)", "notUsername", "passwordHistory(1)"]
policy = realm.get("passwordPolicy") or ""
terms = [t.strip() for t in policy.split(" and ") if t.strip()]
names = {t.split("(")[0] for t in terms}
for term in wanted_policy:
    if term.split("(")[0] not in names:
        terms.append(term)
if " and ".join(terms) != policy:
    update["passwordPolicy"] = " and ".join(terms)
if os.environ["PARTYHUB_IMAGE"] == "true":
    if not realm.get("eventsEnabled"):
        update["eventsEnabled"] = True
    listeners = realm.get("eventsListeners") or []
    missing = [l for l in ["jboss-logging", "email"] if l not in listeners]
    if missing:
        update["eventsListeners"] = listeners + missing
    if realm.get("emailTheme") != "partyhub":
        update["emailTheme"] = "partyhub"
# Local Keycloak sends its mails to the Mailpit container.
if os.environ["MODE"] == "local" and (realm.get("smtpServer") or {}).get("host") != "mailpit":
    update["smtpServer"] = {"host": "mailpit", "port": "1025",
                           "from": "noreply.partyhub@gmail.com", "fromDisplayName": "PartyHub"}
print(json.dumps(update))
' <<<"$REALM_JSON")

if [[ "$REALM_UPDATE" == "{}" ]]; then
  echo "ok realm settings"
else
  change "update realm $REALM with $REALM_UPDATE" || kcadm update "realms/$REALM" -f - <<<"$REALM_UPDATE"
fi

# --- UPDATE_PASSWORD is registered and always re-authenticates ---------------
REGISTERED=$(kcadm get authentication/required-actions -r "$REALM" --fields alias \
  | python3 -c 'import json,sys; print("yes" if any(a["alias"]=="UPDATE_PASSWORD" for a in json.load(sys.stdin)) else "no")')
if [[ "$REGISTERED" == yes ]]; then
  echo "ok UPDATE_PASSWORD registered"
else
  change "register required action UPDATE_PASSWORD" || \
    kcadm create authentication/register-required-action -r "$REALM" -s providerId=UPDATE_PASSWORD -s "name=Update Password"
fi
RA_CONFIG=$(kcadm get "authentication/required-actions/UPDATE_PASSWORD/config" -r "$REALM" 2>/dev/null || echo '{}')
if python3 -c 'import json,sys; c=(json.load(sys.stdin).get("config") or {}); sys.exit(0 if c.get("max_auth_age")=="0" else 1)' <<<"$RA_CONFIG"; then
  echo "ok UPDATE_PASSWORD max_auth_age=0"
else
  change "set UPDATE_PASSWORD max_auth_age=0" || \
    kcadm update "authentication/required-actions/UPDATE_PASSWORD/config" -r "$REALM" -f - <<<'{"config":{"max_auth_age":"0"}}'
fi

# --- Backend admin client -----------------------------------------------------
CLIENT_UUID=$(kcadm get clients -r "$REALM" -q "clientId=$CLIENT_ID" --fields id | python3 -c 'import json,sys; c=json.load(sys.stdin); print(c[0]["id"] if c else "")')
# Local Keycloak uses the fixed dev secret that application.properties expects.
SECRET_FIELD=""
[[ "$MODE" == local ]] && SECRET_FIELD='"secret":"partyhub-backend-admin-dev-secret",'
if [[ -z "$CLIENT_UUID" ]]; then
  if change "create client $CLIENT_ID (service account, client credentials only)"; then :; else
    kcadm create clients -r "$REALM" -f - <<JSON
{"clientId":"$CLIENT_ID",$SECRET_FIELD"name":"PartyHub backend (user admin)","enabled":true,"publicClient":false,
 "clientAuthenticatorType":"client-secret","standardFlowEnabled":false,"implicitFlowEnabled":false,
 "directAccessGrantsEnabled":false,"serviceAccountsEnabled":true,"protocol":"openid-connect"}
JSON
    CLIENT_UUID=$(kcadm get clients -r "$REALM" -q "clientId=$CLIENT_ID" --fields id | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["id"])')
  fi
else
  echo "ok client $CLIENT_ID exists"
fi

if [[ -n "$CLIENT_UUID" ]]; then
  SA_USER="service-account-$CLIENT_ID"
  ROLES=$(kcadm get-roles -r "$REALM" --uusername "$SA_USER" --cclientid realm-management --effective 2>/dev/null || echo '[]')
  MISSING_ROLES=$(python3 -c '
import json, sys
have = {r["name"] for r in json.load(sys.stdin)}
print(" ".join(r for r in ["manage-users", "view-users"] if r not in have))' <<<"$ROLES")
  if [[ -z "$MISSING_ROLES" ]]; then
    echo "ok service account roles"
  else
    ROLE_ARGS=()
    for role in $MISSING_ROLES; do ROLE_ARGS+=(--rolename "$role"); done
    change "grant realm-management roles to $SA_USER: $MISSING_ROLES" || \
      kcadm add-roles -r "$REALM" --uusername "$SA_USER" --cclientid realm-management "${ROLE_ARGS[@]}"
  fi

  if [[ "$MODE" == cluster ]]; then
    if "${KUBECTL[@]}" get secret "$K8S_SECRET" >/dev/null 2>&1; then
      echo "ok kubernetes secret $K8S_SECRET exists"
    elif change "store the client secret in kubernetes secret $K8S_SECRET"; then :; else
      kcadm get "clients/$CLIENT_UUID/client-secret" -r "$REALM" \
        | python3 -c 'import json,sys; sys.stdout.write(json.load(sys.stdin)["value"])' \
        | "${KUBECTL[@]}" create secret generic "$K8S_SECRET" --from-file=client-secret=/dev/stdin
    fi
  fi
fi

echo "done"
