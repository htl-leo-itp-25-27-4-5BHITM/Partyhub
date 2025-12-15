#!/usr/bin/env bash
echo ">> Pulling latest code"

echo ">> Building project"
chmod +x mvnw
./mvnw clean install package

echo ">> Starting"
docker-compose up -d
./mvnw quarkus:dev

