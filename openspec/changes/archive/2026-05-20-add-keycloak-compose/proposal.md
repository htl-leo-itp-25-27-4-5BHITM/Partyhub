## Why

PartyHub needs a reproducible local Keycloak setup so developers can run authentication-dependent flows without manual realm configuration. The setup should isolate Keycloak data from the PartyHub application schema while keeping the local Docker environment simple.

## What Changes

- Add Keycloak to the Docker Compose development environment using the official Keycloak image.
- Expose Keycloak on host port `8000`.
- Configure Keycloak to use the existing Postgres container with a dedicated `keycloak` database, avoiding a second Postgres instance and avoiding PartyHub schema conflicts.
- Import a `partyhub` realm on startup.
- Provision a public `frontend` client with no client secret and redirect URI `http://localhost:8000/*`.
- Provision an `admin` realm role.
- Provision an `admin` user with password `password` and assign the `admin` role.

## Capabilities

### New Capabilities

- `local-keycloak-environment`: Defines the local Docker Compose Keycloak environment, realm import, client, user, role, and dedicated Keycloak database expectations.

### Modified Capabilities

- None.

## Impact

- Affects `docker-compose.yaml`.
- Adds a Postgres initialization script for the dedicated Keycloak database.
- Adds a Keycloak realm import JSON file.
- Adds the official Keycloak container image as a development infrastructure dependency.
- Does not change PartyHub application source code or runtime API behavior.
