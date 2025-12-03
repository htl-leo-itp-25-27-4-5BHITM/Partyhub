#!/usr/bin/env bash

set -euo pipefail
docker build -t partyhub-app --file "./src/main/docker/Dockerfile" .

