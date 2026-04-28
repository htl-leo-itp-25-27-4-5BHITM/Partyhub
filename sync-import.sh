#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$ROOT_DIR/src/main/resources/import.sql"
NAMESPACE="${NAMESPACE:-default}"
APPLY_LOCAL=true
APPLY_K8S=true

usage() {
  cat <<'EOF'
Usage: ./sync-import.sh [options]

Options:
  --sql <path>         Path to SQL file (default: src/main/resources/import.sql)
  --namespace <name>   Kubernetes namespace (default: default)
  --local-only         Apply only to local docker-compose postgres
  --k8s-only           Apply only to Kubernetes postgres
  --skip-local         Skip local update
  --skip-k8s           Skip Kubernetes update
  -h, --help           Show this help

Environment variables:
  NAMESPACE            Kubernetes namespace fallback
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --sql)
      SQL_FILE="$2"
      shift 2
      ;;
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    --local-only)
      APPLY_LOCAL=true
      APPLY_K8S=false
      shift
      ;;
    --k8s-only)
      APPLY_LOCAL=false
      APPLY_K8S=true
      shift
      ;;
    --skip-local)
      APPLY_LOCAL=false
      shift
      ;;
    --skip-k8s)
      APPLY_K8S=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -f "$SQL_FILE" ]]; then
  echo "SQL file not found: $SQL_FILE" >&2
  exit 1
fi

if [[ "$APPLY_LOCAL" == false && "$APPLY_K8S" == false ]]; then
  echo "Nothing to do: both local and k8s are disabled." >&2
  exit 1
fi

compose_cmd=()
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  compose_cmd=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose_cmd=(docker-compose)
fi

apply_local() {
  if [[ ${#compose_cmd[@]} -eq 0 ]]; then
    echo "Skipping local: neither 'docker compose' nor 'docker-compose' found."
    return
  fi

  if [[ -z "$("${compose_cmd[@]}" ps -q postgres)" ]]; then
    echo "Skipping local: postgres service is not running in docker compose."
    return
  fi

  echo "Applying $SQL_FILE to local postgres..."
  "${compose_cmd[@]}" exec -T postgres psql -U demo -d demo -v ON_ERROR_STOP=1 < "$SQL_FILE"

  echo "Local verification (party count):"
  "${compose_cmd[@]}" exec -T postgres psql -U demo -d demo -At -c "select count(*) from party;"
}

apply_k8s() {
  if ! command -v kubectl >/dev/null 2>&1; then
    echo "Skipping k8s: kubectl not found."
    return
  fi

  local pod
  pod="$(kubectl get pods -n "$NAMESPACE" -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"

  if [[ -z "$pod" ]]; then
    echo "Skipping k8s: no postgres pod found with label app=postgres in namespace '$NAMESPACE'."
    return
  fi

  echo "Applying $SQL_FILE to k8s postgres pod $pod (namespace $NAMESPACE)..."
  kubectl exec -i -n "$NAMESPACE" "$pod" -- psql -U demo -d demo -v ON_ERROR_STOP=1 < "$SQL_FILE"

  echo "K8s verification (party count):"
  kubectl exec -i -n "$NAMESPACE" "$pod" -- psql -U demo -d demo -At -c "select count(*) from party;"
}

if [[ "$APPLY_LOCAL" == true ]]; then
  apply_local
fi

if [[ "$APPLY_K8S" == true ]]; then
  apply_k8s
fi

echo "Done. Your API should now serve the updated data from the updated DB(s)."
