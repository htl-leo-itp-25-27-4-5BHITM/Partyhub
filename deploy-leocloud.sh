#!/usr/bin/env bash

set -euo pipefail
./mvnw clean package -DskipTests
docker build --platform linux/amd64 --tag ghcr.io/htl-leo-itp-25-27-4-5bhitm/partyhub-quarkus --file "Dockerfile" .
docker push ghcr.io/htl-leo-itp-25-27-4-5bhitm/partyhub-quarkus;
