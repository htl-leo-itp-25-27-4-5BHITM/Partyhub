## Context

The current Docker Compose environment contains a single `postgres` service for the PartyHub application database. The application database uses database name `demo`, user `demo`, password `demo`, and exposes only host port `5432`.

Keycloak should be available in the local environment without adding a second Postgres container or a second exposed Postgres port. Keycloak data must remain separate from the PartyHub application schema to avoid conflicts with application migrations, Hibernate schema generation, or future database changes.

## Goals / Non-Goals

**Goals:**

- Run Keycloak from the official Keycloak container image.
- Expose Keycloak at `http://localhost:8000`.
- Keep a single Postgres service and a single exposed Postgres port.
- Store Keycloak data in a dedicated `keycloak` database inside the existing Postgres container.
- Import a deterministic `partyhub` realm with the required client, role, and user.
- Keep the change local-development focused and easy to reset.

**Non-Goals:**

- Do not add a second Postgres service.
- Do not expose an additional Postgres port.
- Do not modify PartyHub application source code or authentication logic.
- Do not configure production-grade Keycloak settings such as TLS, external secrets, clustering, or strict hostnames.
- Do not introduce a client secret for the `frontend` client.

## Decisions

1. Use `quay.io/keycloak/keycloak:26.5.0` for the Keycloak service.

   Rationale: This is the official Keycloak image family and matches the existing Kubernetes manifest version in the repository.

   Alternative considered: Use an older or unpinned image tag. This was rejected because local development should be reproducible and aligned with the existing repository configuration.

2. Run Keycloak with `start-dev --import-realm`.

   Rationale: The requested setup is for local Docker Compose development. `start-dev` keeps local configuration simple, and `--import-realm` lets the repository define the realm declaratively.

   Alternative considered: Configure the realm manually through the admin UI. This was rejected because it is not reproducible.

3. Reuse the existing `postgres` service and add a dedicated `keycloak` database.

   Rationale: The user wants only one Postgres container and one Postgres port, while keeping Keycloak data isolated from PartyHub application tables. A separate database inside the same Postgres instance satisfies both constraints.

   Alternative considered: Add a `keycloak-postgres` service. This was rejected because it would add a second Postgres instance.

4. Create the `keycloak` database through a Postgres initialization script.

   Rationale: Mounting an init script under `/docker-entrypoint-initdb.d` is the standard Postgres container mechanism for first-run database bootstrap.

   Trade-off: Init scripts only run when the Postgres data directory is first initialized. Existing developer volumes will require a one-time manual database creation or volume reset.

5. Define the `frontend` client as a public client with no client secret.

   Rationale: The user explicitly requested no client secret. This matches browser-based frontend clients where secrets cannot be safely stored.

6. Use `http://localhost:8000/*` as the frontend redirect URI.

   Rationale: This is the redirect URI explicitly requested by the user. If the frontend later runs on a different origin, the realm import will need to be updated.

## Risks / Trade-offs

- Existing Postgres volume does not run new init scripts -> Document or perform a one-time `CREATE DATABASE keycloak;` for existing local volumes.
- Keycloak startup can fail if the `keycloak` database does not exist -> Add `depends_on` for startup order and make the database creation requirement explicit.
- `http://localhost:8000/*` points to the same host port as Keycloak -> Accept the requested value for now, but revisit if the actual frontend runs on another port.
- Local credentials are intentionally weak -> Keep this scoped to development and avoid presenting these values as production-ready.
