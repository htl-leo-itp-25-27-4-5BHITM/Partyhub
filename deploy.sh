#!/usr/bin/env bash
echo ">> Pulling latest code"
#git pull origin main

echo ">> Building project"
chmod +x mvnw
./mvnw clean package

echo ">> Removing current running container"
docker rm -f quarkus-app

echo ">> Starting"
docker-compose up -d

echo "✅ Deployment finished"
