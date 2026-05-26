#!/usr/bin/env bash
set -euo pipefail

echo ">> docker compose down and removing volumes"
docker-compose down -v;
echo ">> Starting services"
docker-compose up -d;

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
java_args=(
	--add-opens=java.base/java.lang=ALL-UNNAMED
	-Dquarkus.profile=dev
	-Dquarkus.datasource.db-kind=postgresql
	-Dquarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/demo
	-Dquarkus.datasource.username=demo
	-Dquarkus.datasource.password=demo
	-Dquarkus.mailer.host=${SMTP_HOST:-smtp.gmail.com}
	-Dquarkus.mailer.port=${SMTP_PORT:-587}
	-Dquarkus.mailer.username=${SMTP_USER:-noreply.partyhub@gmail.com}
	-Dquarkus.mailer.password=${SMTP_PASSWORD:-}
	-Dquarkus.mailer.auth-methods="${SMTP_AUTH:-DIGEST-MD5 CRAM-SHA256 CRAM-SHA1 CRAM-MD5 PLAIN LOGIN}"
	-Dquarkus.mailer.login=${SMTP_LOGIN:-REQUIRED}
	-Dquarkus.mailer.start-tls=${SMTP_TLS:-REQUIRED}
)
exec java "${java_args[@]}" -jar target/quarkus-app/quarkus-run.jar