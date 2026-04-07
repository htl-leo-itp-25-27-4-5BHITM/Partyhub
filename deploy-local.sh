#!/usr/bin/env bash
echo ">> docker compose down"
docker-compose down;
echo ">> Starting services"
docker-compose up -d;

echo ">> Building project"
chmod +x mvnw
# chmod +x run-http-tests.sh
# ./mvnw clean
./mvnw install package
echo ">> Starting quarkus"
./mvnw quarkus:dev
