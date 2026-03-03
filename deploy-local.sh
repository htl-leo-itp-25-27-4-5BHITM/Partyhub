#!/usr/bin/env bash
echo ">> docker compose down"
docker-compose down;
echo ">> Starting services"
docker-compose up -d;

echo ">> Building project"
chmod +x mvnw
./mvnw clean install package

echo ">> Starting quarkus"
./mvnw quarkus:dev
