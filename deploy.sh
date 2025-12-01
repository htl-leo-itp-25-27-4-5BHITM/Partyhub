#!/usr/bin/env bash
echo ">> Pulling latest code"
#git pull origin main

echo ">> Building project"
chmod +x mvnw
./mvnw clean install package

echo ">> Removing current running container"
# docker-compose down
# docker rmi partyhub-partyhub

echo ">> Starting"
docker-compose up -d
./mvnw quarkus:dev

echo "✅ Deployment finished"
