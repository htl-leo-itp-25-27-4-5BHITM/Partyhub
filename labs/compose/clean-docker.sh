#!/usr/bin/env bash

docker compose down || echo "no docker compose"
docker container ls -q | xargs docker stop
docker container prune -f
docker image prune -f
docker volume prune -f
docker builder prune --all --force
docker image ls -q | xargs docker image rm
docker volume ls -q | xargs docker volume rm

docker container ls
docker volume ls
docker image ls
