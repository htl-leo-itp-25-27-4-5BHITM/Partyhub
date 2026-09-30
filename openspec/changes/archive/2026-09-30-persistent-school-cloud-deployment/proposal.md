# Proposal

## Why

Every push to `main` still wipes the school cloud: `.github/workflows/deploy.yml` drops the `public` schema of the shared `demo` database and replays `import.sql`, and Keycloak lives in that same database, so accounts and registrations vanish too. D030 made the school cloud persistent (`deployment-environment` DEPLOY-01/DEPLOY-02), so this is backlog item B01 (gaps G057, G059 and the deploy-gating half of G061) and it has to land before any other backlog item. Until it does, every deploy erases school-cloud data.

## What Changes

- **BREAKING (operations)**: Deployment no longer resets the database. The `DROP SCHEMA` step and the `import.sql` replay are removed from `deploy.yml`. Deployed data is only changed by versioned schema migrations.
- Deployment only runs for a push whose Test and Build and Push workflows succeeded. A failed or skipped build no longer deploys.
- Deployment updates the `quarkus` and `keycloak` Deployments in place (`kubectl apply` plus a rollout) and no longer deletes and recreates them.
- Keycloak moves from the shared `demo` database to its own `keycloak` database in the same Postgres service. That database is created idempotently on the existing Postgres volume. Realm import keeps an existing `partyhub` realm (the default `IGNORE_EXISTING` strategy).
- Versioned schema migrations (Flyway) replace Hibernate `update` in `%prod`. A V1 baseline captures the current schema, the startup DDL in `NotificationSchemaCompatibility` becomes a migration, and that class is removed. Hibernate validates the schema instead of changing it.
- The local dev profile applies the same migrations and then seeds the demo data, so CI (JUnit on H2 plus HTTPYac against Postgres) exercises the migrations before they reach the school cloud.
- A one-time cut-over runbook moves Keycloak out of `demo` and removes the Keycloak tables left behind in `demo`.
- README and `docs/openspec-baseline` (gaps G057, G059 and G061, plus the backlog) are updated to match.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
<!-- none: DEPLOY-01/DEPLOY-02 in `deployment-environment` already specify the required behaviour, and this change implements them. The change sets `skip_specs: true`. -->

## Impact

- **CI/CD**: `.github/workflows/deploy.yml` (gating, no reset, in-place rollout, Keycloak DB bootstrap). `.github/workflows/test.yml` exercises the migrations through the dev profile.
- **Kubernetes**: `k8s/keycloak.yaml` (`KC_DB_URL_DATABASE=keycloak`). `k8s/postgres.yaml` stays as it is, and its PVC is kept.
- **Backend**: `pom.xml` (`quarkus-flyway`, `flyway-database-postgresql`), `src/main/resources/application.properties` (Flyway and schema-management per profile), new `src/main/resources/db/migration/`, `import.sql` moved into a dev-only seed location, `NotificationSchemaCompatibility` removed.
- **Scripts/docs**: `sync-import.sh` (new seed path), `README.md`, `docs/openspec-baseline/{gaps,backlog}.md`.
- **Data**: The first deploy after cut-over starts Keycloak on an empty `keycloak` database, which imports `realm-staging.json`. Keycloak accounts that exist at cut-over are lost unless the optional dump step in the runbook is run. PartyHub application rows in `demo` are kept from then on.
- **Not in scope**: gallery file storage (G058/B-media), removing the auth bypass (B02), real-token tests (B03), Kubernetes Secrets for DB credentials.
