# PartyHub

<p align="center">
  <img src="docs/images/logo.png" alt="PartyHub Logo" width="200">
</p>
<p align="center">
  <a href="https://github.com/htl-leo-itp-25-27-4-5BHITM/Partyhub/actions/workflows/push.yaml"><img src="https://img.shields.io/github/actions/workflow/status/htl-leo-itp-25-27-4-5BHITM/Partyhub/push.yaml?branch=main&style=for-the-badge" alt="Build and deploy status"></a>
</p>


A social event platform for organizing and discovering parties, meetups, and social gatherings.

## Features

- **User Management**: Keycloak registration and login (browser and iOS), profiles with pictures and biographies
- **Event Creation**: Hosts create public or private parties with details, a theme and a location
- **Social Features**: Follow requests, mutual contacts, private-party invitations, joining and leaving parties
- **Favorites**: signed-in users can save a party from its detail page and open or remove saved parties in their own profile. Favorites are private and do not count as joining a party.
- **Media Sharing**: Party galleries for party viewers
- **Location-Based**: Parties on a map with coordinates and addresses; the iOS map filters by distance using the device location locally
- **Age and Capacity Info**: Minimum/maximum age and capacity are shown and filterable; they do not block joining

The accepted product behaviour is specified in [`openspec/specs/`](openspec/specs/); the evidence, decisions and open gaps are in [`docs/openspec-baseline/`](docs/openspec-baseline/runbook.md).

## Tech Stack

- **Backend**: Quarkus 3.28.2 (Java 21)
- **Database**: PostgreSQL with Hibernate ORM
- **Authentication**: Keycloak (Authorization Code + PKCE) with SmallRye JWT bearer validation
- **Clients**: static browser app (`src/main/resources/META-INF/resources/`) and a SwiftUI iOS app (`PartyHubiOS/`)
- **Documentation**: Swagger UI for API exploration

## Installation

### 1. Clone the repository

```bash
git clone git@github.com:htl-leo-itp-25-27-4-5BHITM/Partyhub.git
cd Partyhub
```

### 2. Setup local development
```bash
./deploy-local.sh
```

`deploy-local.sh` preserves Docker volumes, migrates any legacy local Keycloak database to its dedicated Postgres service, waits for database and Keycloak readiness, builds the project (running the tests) and starts `./mvnw quarkus:dev`. In dev mode Flyway cleans the local `demo` schema on every start, applies the migrations in `src/main/resources/db/migration/` and then loads the seed data from `src/main/resources/db/dev-seed/afterMigrate.sql`; the `X-User-Id` test bypass is enabled; do not rely on it to verify real login.

### 3. Schema changes (Flyway)

The database schema is owned by versioned Flyway migrations in `src/main/resources/db/migration/`; Hibernate only validates it. To change the schema, update the entities and add a new `V<n>__<description>.sql` with the next free number. **Never edit or rename a migration that has already been applied** (it is on `main`); fix mistakes with a new migration. Migrations run automatically at startup in every environment, so `quarkus:dev` and the HTTPYac tests in CI exercise them against PostgreSQL before they are deployed. Destructive statements (`DROP`, deleting rows) need a note in the pull request, as for raw SQL (see AGENTS.md).

### 4. Sync seed data to Local and Server DB

If you change seed data in `src/main/resources/db/dev-seed/afterMigrate.sql`, the next `quarkus:dev` start loads it automatically. To apply it to a running database, use the script below. The seed starts with `TRUNCATE ... CASCADE`, so **every target database is emptied and reseeded**. The default targets only the local database; cloud reseeding requires `--k8s-only`.

> **Warning:** the school cloud is persistent. `./sync-import.sh --k8s-only` **permanently deletes all school-cloud application data** (users, parties, invitations, follows, notifications) and replaces it with demo data. There is no automatic backup.

```bash
./sync-import.sh
```

This updates local docker-compose Postgres (`postgres` service). With `--k8s-only`,
it updates the Kubernetes application Postgres pod (`app=postgres`, namespace
`default`). Neither mode touches the dedicated Keycloak database.

Common variants:

```bash
# only local DB
./sync-import.sh --local-only

# only Kubernetes DB: WIPES the persistent school-cloud data (see warning above)
./sync-import.sh --k8s-only --namespace default
```

Requirements:
- local sync: `docker compose` (or `docker-compose`) and running `postgres` service
- server sync: `kubectl` access to the cluster and namespace

### 5. Open the application

**Website**: http://localhost:8080

**API Documentation**: http://localhost:8080/q/swagger-ui/

### 6. Local Keycloak login

Keycloak runs at http://localhost:8000 and imports the `partyhub` realm from
`keycloak/realm-dev.json` (`keycloak/realm-staging.json` is the realm baked into
the deployment image). Keycloak admin console: bootstrap user `admin` / `admin`.

Local demo users (password = username), for example:

```text
Username: viki_vej
Password: viki_vej
```

Each demo user matches exactly one seeded PartyHub user (seed users are stored
without a Keycloak ID) and is linked on first login. If the `frontend` client
or demo users do not appear after changing `realm-dev.json`, deliberately delete
and re-import the local `partyhub` realm, because Keycloak
only imports a realm that does not exist yet.

Local database storage is independent: `postgres` holds application data and
`keycloak-db` holds identity data. Only the app database is published on localhost
port 5432. `docker compose down` preserves both volumes; `down -v` deletes both.
See [database migration and improvement notes](docs/keycloak-database-migration.md).

## Production

**Website**: https://it220274.cloud.htl-leonding.ac.at

The school cloud is persistent ([`deployment-environment`](openspec/specs/deployment-environment/spec.md)):
its dedicated Keycloak database cutover was completed on 2026-10-14, preserving
existing accounts (see the [cutover record](docs/keycloak-database-migration.md#completed-cloud-cutover-2026-10-14)).
deployments keep application data, Keycloak accounts and uploaded files.

- **Gated:** a push to `main` runs `Test`; only if it succeeds does `Build and Push`
  build the images of that commit, and only if the build succeeds does its `deploy`
  job run `.github/workflows/deploy.yml`. A failed or skipped step deploys nothing.
- **Incremental and pinned:** the deploy runs `kubectl apply` on the manifests in
  `k8s/`, then `kubectl set image` to the commit's short-SHA image tag and waits for
  the rollouts. Nothing is deleted, dropped, truncated or reseeded. The manifests
  keep `:latest` for manual `kubectl apply`; the next deploy pins the tag again.
  To redeploy a specific build, run the `Deploy` workflow manually with its tag.
  Rollback: `kubectl rollout undo deployment/quarkus` (and `deployment/keycloak`).
- **Schema:** Quarkus applies new Flyway migrations at startup (see
  [Schema changes](#3-schema-changes-flyway)); seed data is never loaded outside dev.
- **Keycloak:** uses the dedicated `keycloak-db` Postgres service, credentials and
  PVC. Existing installations must complete the account-preserving
  [database migration](docs/keycloak-database-migration.md) before deployment;
  the pipeline checks its completion marker. `--import-realm` only imports `realm-staging.json` when
  the `partyhub` realm does not exist yet, so realm changes after that are made in
  the Admin Console (`/keycloak/admin`) or by a deliberate, documented re-import;
  a redeploy never overwrites the realm or its users.
- The one-time cut-over to this setup is described in
  [`docs/deployment-cutover.md`](docs/deployment-cutover.md). There are no scheduled
  database backups yet (see gaps.md).

## Project Structure

```
Partyhub/
├── src/main/java/at/htl/      # Backend, one package per domain:
│   ├── auth/ config/ user/ follow/ party/ invitation/
│   ├── media/ notification/ notificationsettings/
│   ├── location/ user_location/ profile_picture/ qr/ validation/
├── src/main/resources/
│   ├── META-INF/resources/    # Browser app (HTML/JS/CSS)
│   ├── application.properties # Profiles: dev, staging, prod
│   ├── db/migration/          # Flyway schema migrations (V<n>__*.sql)
│   └── db/dev-seed/           # Dev-only seed data (afterMigrate.sql)
├── src/test/                  # JUnit/RestAssured tests (H2)
├── api/                       # HTTPYac API tests
├── PartyHubiOS/               # SwiftUI iOS app
├── keycloak/                  # Realm files and PartyHub theme
├── k8s/                       # School-cloud manifests
├── openspec/                  # Specifications and changes
├── docs/openspec-baseline/    # Specification evidence and handoff
├── docker-compose.yaml        # Local app DB + Keycloak DB + Keycloak
└── deploy-local.sh / sync-import.sh / run-http-tests.sh
```

## Running Tests

```bash
mvn clean test
```

Code coverage is generated using **JaCoCo**.

After tests complete, view the HTML coverage report at:

```
target/jacoco-report/index.html
```

## Building the Project

```bash
mvn clean package
```

## API Reference

Authentication is handled by Keycloak; clients read the issuer from
`GET /api/config/public` and send bearer tokens. The REST API includes these endpoints:

- **Users and profiles**: `/api/users/*` (profiles, `/me`, profile pictures, followers/following and follow requests under `/api/users/{id}/...`)
- **Notification settings**: `/api/users/{id}/notification-settings`
- **Parties**: `/api/parties/*` (CRUD, join/leave, members, invitation stats, party media under `/api/parties/{id}/media`)
- **Invitations**: `/api/invitations/*`
- **Favorites**: `GET /api/favorites` lists your visible saved parties; `GET`, `PUT` and `DELETE /api/parties/{id}/favorite` read, save and remove your own favorite. Repeated saves do not create duplicates.
- **Notifications**: `/api/notifications/*`
- **QR login**: `/api/qr/*` (deferred prototype, not a supported login)

The complete method/path/status list is in
[`docs/openspec-baseline/api-contract-matrix.md`](docs/openspec-baseline/api-contract-matrix.md);
the live OpenAPI document is served at `/q/openapi`.
### Codex commands

- /opsx:propose
- /opsx:explore
- /opsx: apply
- /opsx: archive
- commit
- /clear 
- read '/folder' and write me a continuation file for a new cold thread.


## Sprint Review Dates

1.  Sprint: 08.10.2025
2.  Sprint: 05.11.2025
3.  Sprint: 19.11.2025
4.  Sprint: 03.12.2025
5.  Sprint: 17.12.2025
6.  Sprint: 14.01.2026
7.  Sprint: 28.01.2026
8.  Sprint: 11.02.2026
9.  Sprint: 04.03.2026
10. Sprint: 18.03.2026
11. Sprint: 08.04.2026
12. Sprint: 29.04.2026
13. Sprint: 13.05.2026

5BHITM
1. Sprint: 21.10.2026
2. Sprint: 18.11.2026
