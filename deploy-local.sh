#!/usr/bin/env bash
echo ">> docker compose down"
docker-compose down;
echo ">> Starting services"
docker-compose up -d;

echo ">> Building project"
chmod +x mvnw
echo ">> Starting quarkus"
./mvnw clean install package quarkus:dev
