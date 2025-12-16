#!/usr/bin/env bash
echo ">> Building project"
chmod +x mvnw
./mvnw clean install package

echo ">> Starting"
docker-compose up -d
./mvnw quarkus:dev

