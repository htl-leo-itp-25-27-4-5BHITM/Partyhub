#!/usr/bin/env bash

docker compose -f postgres.yaml pull
pushd keycloak
docker build --tag keycloak .
popd
docker compose -f dev.yaml up --build
