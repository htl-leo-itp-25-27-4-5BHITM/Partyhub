#!/usr/bin/env bash

set -e

rm -rf target
mvn -B clean package
mkdir -p target/deploy
docker build --tag backend --file ./src/main/docker/Dockerfile .
