#!/usr/bin/env bash
echo ">> Starting database"
docker-compose up -d;

echo ">> Building project"
chmod +x mvnw
./mvnw clean install package

echo ">> Starting quarkus"
./mvnw quarkus:dev
