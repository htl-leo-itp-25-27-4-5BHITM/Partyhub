#!/usr/bin/env bash
set -e

pushd application-server
    mvn clean
popd
pushd frontend
    rm -rf node_modules package-lock.json
popd
pushd compose
    docker compose down
    source ./clean-docker.sh
popd
