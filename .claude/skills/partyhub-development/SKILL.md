---
name: partyhub-development
description: Use when working anywhere in the PartyHub repo - Quarkus REST endpoints, DTO validation, Flyway migrations, seed data, Keycloak realm or login theme, running or deploying locally, tests, or the school-cloud Kubernetes deployment
---

# PartyHub Development

## Overview
PartyHub is a party/event platform: Quarkus 3 (Java 21) backend, PostgreSQL + Flyway, Keycloak auth, a static browser app and a SwiftUI iOS app. Accepted behaviour lives in `openspec/specs/`; check the matching spec before changing behaviour.

## Repo Map

| Path | Contents |
|------|----------|
| `src/main/java/at/htl/<domain>/` | One package per domain (`party`, `user`, `follow`, `invitation`, `media`, `notification`, ...): `*Resource`, `*Repository`, entity, `*Dto` |
| `src/main/java/at/htl/validation/` | `@SafeText`, `@NoHtml`, `@ValidPartyName`, groups `OnCreate`/`OnUpdate` |
| `src/main/resources/META-INF/resources/` | Browser app |
| `src/main/resources/db/migration/` | Flyway `V<n>__<description>.sql` |
| `src/main/resources/db/dev-seed/afterMigrate.sql` | Dev-only seed data |
| `src/test/java/at/htl/` | JUnit/RestAssured tests (H2) |
| `api/*.http` | HTTPYac API tests |
| `keycloak/` | `realm-dev.json` (local), `realm-staging.json` (deployed), `themes/partyhub/` |
| `k8s/` | School-cloud manifests |
| `PartyHubiOS/` | SwiftUI app |

## REST Endpoints

```java
@POST
@Path("")
@Transactional
@Authenticated
public Response createParty(@Valid PartyCreateDto dto) { ... }
```

- Every request body gets `@Valid`; invalid input returns 400 automatically.
- DTOs are records with constraint annotations and a `message`. Use `groups = {OnCreate.class, OnUpdate.class}` for fields required on create/update.
- Free-text fields: add `@SafeText` / `@NoHtml`; party names: `@ValidPartyName`.
- Echoing user input: `Encode.forHtml(input)` (OWASP Java Encoder).
- Queries go through Hibernate/Panache with parameters. Raw SQL needs a security note in the PR (CI runs java-sql-inspector).

## Database Changes
- Change the entity, then add a new migration with the next free number. Hibernate only validates the schema.
- **Never edit or rename a migration already on `main`** - fix with a new one.
- `DROP` or row deletion needs a note in the PR.
- Seed changes go in `afterMigrate.sql`; dev mode reloads it on every start.

## Running Locally

| Task | Command |
|------|---------|
| Full local setup (**wipes local Docker volumes**) | `./deploy-local.sh` |
| Just dev server (Postgres/Keycloak already up) | `docker-compose up -d && ./mvnw quarkus:dev` |
| Unit tests (+ JaCoCo in `target/jacoco-report/`) | `./mvnw clean test` |
| HTTPYac API tests | `./run-http-tests.sh` |
| Re-apply seed to running local DB | `./sync-import.sh --local-only` |

- App http://localhost:8080, Swagger `/q/swagger-ui/`, OpenAPI `/q/openapi` (root `openapi.yaml` is outdated).
- Keycloak http://localhost:8000 (admin/admin). Demo users: password = username, e.g. `viki_vej`.
- Dev mode allows an `X-User-Id` bypass - don't use it to verify real login.
- Keycloak imports a realm only if it doesn't exist; after editing `realm-dev.json`, recreate the volume or re-import the realm.

## Keycloak Login Theme
`keycloak/themes/partyhub/` has a `login/` and an `email/` theme (`parent=base`). It is mounted read-only into the local Keycloak container.
- Templates: `login/login.ftl`, `login/register.ftl`. All CSS: `login/resources/css/styles.css`, the only entry in `theme.properties` (AGENTS.md mentions `login.css`/`footer.ftl`, but those files don't exist).
- Tokens: `--ph-primary: #1a1040`, `--ph-accent-pink: #ff2e63`, `--ph-accent-green: #56f27c`, font Montserrat.
- Strings -> `login/messages/messages_en.properties`. Emails -> `email/html/*.ftl` and `email/text/*.ftl`.

## Deployment (School Cloud)
Persistent: https://it220274.cloud.htl-leonding.ac.at. Push to `main` -> Test -> Build and Push -> Deploy (`kubectl apply` on `k8s/` + image pinned to commit SHA). Rollback: `kubectl rollout undo deployment/quarkus`.

**Never run `./sync-import.sh` without `--local-only`.** The default and `--k8s-only` truncate and reseed the production database. There is no backup.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Editing `V1__baseline.sql` to add a column | New `V<n>__...sql` |
| Missing `@Valid` on a new endpoint | Add it; validation is silently skipped otherwise |
| Running `deploy-local.sh` expecting to keep local Keycloak users | It runs `docker-compose down -v` |
| Realm change not visible | Realm already exists; re-import or recreate volume |
| Trusting `openapi.yaml` | Use `/q/openapi` or `docs/openspec-baseline/api-contract-matrix.md` |
