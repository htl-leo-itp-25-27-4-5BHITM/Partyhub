#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
echo ">> Preparing databases (preserving existing volumes and accounts)"
./scripts/migrate-keycloak-db.sh
echo ">> Starting services and waiting for readiness"
docker compose up -d --build --wait --wait-timeout 600

echo ">> Building project"
chmod +x mvnw
# chmod +x run-http-tests.sh
# ./mvnw clean
./mvnw clean package
echo ">> Stopping previous Partyhub runtime if needed"
existing_pids=$(pgrep -f 'target/quarkus-app/quarkus-run.jar' || true)
if [[ -n "$existing_pids" ]]; then
	kill $existing_pids || true
	for pid in $existing_pids; do
		for _ in 1 2 3 4 5; do
			if ! kill -0 "$pid" 2>/dev/null; then
				break
			fi
			sleep 1
		done
		if kill -0 "$pid" 2>/dev/null; then
			kill -9 "$pid"
		fi
	done
fi

echo ">> Verifying port 8080 availability"
if lsof -ti tcp:8080 >/dev/null 2>&1; then
	echo "Port 8080 is still occupied by a non-Partyhub process. Stop it and retry."
	exit 1
fi

echo ">> Starting quarkus runtime"
./mvnw quarkus:dev
