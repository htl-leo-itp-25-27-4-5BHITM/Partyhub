#!/usr/bin/env bash
echo ">> docker compose down and removing volumes"
docker-compose down -v;
echo ">> Starting services"
docker-compose up -d;

echo ">> Building project"
chmod +x mvnw
# chmod +x run-http-tests.sh
# ./mvnw clean
./mvnw install package
echo ">> Starting quarkus"
./mvnw quarkus:dev
