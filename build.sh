#!/usr/bin/env bash

set -euo pipefail
mvn clean package -DskipTests
docker buildx build --platform linux/amd64 --tag ghcr.io/htl-leo-itp-25-27-4-5bhitm/partyhub-app --file "./src/main/docker/Dockerfile" .
docker push ghcr.io/htl-leo-itp-25-27-4-5bhitm/partyhub-app

