#!/usr/bin/env bash

set -euo pipefail
docker build --tag ghcr.io/htl-leo-itp-25-27-4-5bhitm/partyhub-app --file "./src/main/docker/Dockerfile" --push .

