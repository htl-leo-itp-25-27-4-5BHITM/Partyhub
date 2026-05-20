## 1. Compose And Database Setup

- [x] 1.1 Add a Keycloak service to `docker-compose.yaml` using the official image, existing network, and host port `8000`
- [x] 1.2 Add first-run Postgres initialization for a dedicated `keycloak` database while keeping a single Postgres service and exposed port

## 2. Realm Provisioning

- [x] 2.1 Define a Keycloak realm import for realm `partyhub` with a public `frontend` client and redirect URI `http://localhost:8000/*`
- [x] 2.2 Provision the `admin` realm role and enabled `admin` user with password `password` assigned to that role

## 3. Verification And Tracking

- [x] 3.1 Validate the compose configuration and confirm the required port mappings and service topology
- [x] 3.2 Update the OpenSpec task checklist to reflect completed implementation work and note any verification caveats

Verification caveat: the Postgres init script only runs on a fresh Postgres volume. Existing local volumes will need either `CREATE DATABASE keycloak;` run manually or the Postgres volume recreated before Keycloak can connect successfully.
