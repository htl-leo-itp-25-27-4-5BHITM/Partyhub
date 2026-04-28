#!/usr/bin/env bash

echo ">> docker compose down and removing volumes"
docker-compose down -v

echo ">> Starting services"
docker-compose up -d

sleep 2

echo ">> Building project"
chmod +x mvnw
./mvnw install package

echo ">> Starting quarkus"
./mvnw quarkus:dev
