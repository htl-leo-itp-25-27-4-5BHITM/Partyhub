# Runtime environment evidence

Group 11.1, inspected 2026-09-30 at `3a3f6ed`. Application source, configuration, manifests, workflows and scripts are unchanged since the foundation snapshot `9487ccb` (`git diff --stat 9487ccb HEAD` over `src`, `PartyHubiOS/PartyHubiOS`, `api`, `k8s`, `keycloak`, `docker`, `.github`, Compose, Dockerfiles, `pom.xml`, README and scripts is empty). Everything below is a **repository declaration**. No container, Keycloak, cluster, CI run or network probe was performed. Read this with [auth-environments.md](auth-environments.md), which remains authoritative for JWT/bypass declarations, and [data-lifecycle.md](data-lifecycle.md).

Accepted contract: [local-keycloak-environment](../../openspec/specs/local-keycloak-environment/spec.md) ENV-01-ENV-11 cover the local Compose environment only. D023 records why CI and Kubernetes remain evidence rather than accepted policy.

## Environment comparison

| Aspect | Local Compose + `quarkus:dev` | CI `test.yml` | Kubernetes (`deploy.yml` + `k8s/`) |
|---|---|---|---|
| App start | `./mvnw quarkus:dev` (`deploy-local.sh`, `run-http-tests.sh`); `%dev` profile | JUnit `mvn clean test` (test resources); HTTPYac against `mvn quarkus:dev` on 8080 | `Dockerfile` CMD `-Dquarkus.profile=prod`; `k8s/quarkus.yaml` `QUARKUS_PROFILE=prod` |
| App port | 8080, `%dev.quarkus.http.host=localhost` | JUnit test port 8082; HTTPYac dev 8080 on 0.0.0.0 | container 8080, NodePort 30801, ingress `/` |
| Datasource | `jdbc:postgresql://localhost:5432/demo` | JUnit H2 in-memory `MODE=PostgreSQL`; HTTPYac dev → Compose Postgres | `postgres:5432/demo` (`%prod`) |
| Schema | `%dev` drop-and-create + `import.sql` on every start | JUnit drop-and-create, no load script; HTTPYac dev drop-and-create + `import.sql` | base `update`, load script `no-file` unless `PARTYHUB_SQL_LOAD_SCRIPT`; deploy workflow drops schema and replays `import.sql` (G057) |
| Issuer | base default `http://localhost:8000/realms/partyhub` | JUnit JWT disabled; HTTPYac dev default issuer | `%prod` and env `KEYCLOAK_ISSUER` → `https://it220274.cloud.htl-leonding.ac.at/keycloak/realms/partyhub` |
| Bypass | `%dev` true | JUnit true; HTTPYac dev true | env `PARTYHUB_AUTH_BYPASS_ENABLED="true"` (G002) |
| Keycloak | `start-dev --import-realm`, host 8000 → 8080, DB `keycloak` on Compose Postgres | Compose also builds/starts Keycloak; no test uses it | `start --import-realm`, `/keycloak` relative path, proxy headers, DB **`demo`** shared with app (G057) |
| Realm inputs | mounted `realm-dev.json` **and** image-baked `realm-staging.json`, both realm `partyhub` (G018) | same image | image-baked `realm-staging.json` only |
| Keycloak admin bootstrap | env bootstrap admin (values in Compose) | same | env bootstrap admin in manifest (values not repeated here) |
| Mail | `%dev.quarkus.mailer.mock=false`, SMTP from env | JUnit `quarkus.mailer.mock=true` | secret `partyhub-smtp-secret` via `envFrom` |
| Profile uploads | `%dev` `uploads/profiles` (relative to working dir) | test default | `%prod` `/app/uploads/profiles` on PVC `profile-uploads-pvc` 5Gi |
| Party media | `src/main/resources/uploads/party{id}` relative to working dir | same code path | `/app/src/main/resources/uploads/...` — outside the PVC mount (G058) |

`%staging` sets bypass true, `postgres:5432/demo`, real mailer with example SMTP defaults and no upload directory. No workflow, script or manifest in the repository selects the staging profile. The `realm-staging.json` name therefore does not mean a staging application profile is deployed with it.

## Local contract reconciliation (ENV-01-ENV-11)

| Requirement | Declaration evidence | Status |
|---|---|---|
| ENV-01 Compose Keycloak on 8000, `partyhub-network` | `docker-compose.yaml` keycloak service, ports `8000:8080`, network | Declared; official image via `Dockerfile.keycloak` base `quay.io/keycloak/keycloak:26.5.0`. |
| ENV-02 single Postgres, `keycloak` DB, only 5432 exposed | Compose `postgres` service, `KC_DB_URL_DATABASE=keycloak` | Declared locally. Kubernetes differs (shared `demo`, G057); outside ENV scope. |
| ENV-03 bootstrap DB on fresh volume | `docker/postgres/init/01-create-keycloak-db.sql` mounted into `docker-entrypoint-initdb.d` | Declared; existing-volume remediation needs documentation (Step 12 README). |
| ENV-04/ENV-05/ENV-06/ENV-07 realm, `frontend`, admin, demo users | `realm-dev.json`: realm `partyhub`, `frontend` public/standard/no direct grants/S256, redirects `http://localhost:8080/*` plus the cloud origin, admin role/user, ten demo users | Declared in the dev file. The extra cloud redirect/origin is additive and does not contradict ENV-05. |
| ENV-08 runtime binding | `application.properties` issuer default and JWKS; `PublicConfigResource` returns `partyhub.keycloak.issuer`; `quarkus.http.port=8080` | Declared and consistent. |
| ENV-09 one realm source | Compose mounts `realm-dev.json`; `Dockerfile.keycloak` copies `realm-staging.json` into the same import directory | **Conflicts** — G018. Which file Keycloak imports first, and whether the second is skipped as an existing realm, was not executed. |
| ENV-10 native iOS client | Both realm files: `partyhub-ios` public, standard flow, no direct grants, S256, redirects `partyhub.auth://callback` and `partyhub.auth://callback/*` | Declared; matches AUTH-10 and `KeycloakConfig.swift`. |
| ENV-11 non-authoritative bypass | Base default false; `%dev`/`%staging`/test true; `XUserIdAuthFilter` | Default-off declared. Real-token local verification was not run; all JUnit/HTTPYac identity is bypass or `@TestSecurity` (G061, G013). |

## Ports and dependencies

| Component | Local | Kubernetes | Dependency |
|---|---|---|---|
| PartyHub app | 8080 | Service 8080 / NodePort 30801, ingress `/` | Postgres; Keycloak issuer JWKS reachable at request time; SMTP for mail |
| Keycloak | host 8000 | Service, ingress `/keycloak` | Postgres (`keycloak` locally, `demo` in cluster) |
| Postgres | 5432 | Service `postgres`, PVC `postgres-pvc` 1Gi | none |
| Swagger/OpenAPI | `/q/swagger-ui`, `/q/openapi` (dev) | not verified | `quarkus-smallrye-openapi`; the static root `openapi.yaml` is not the served document (G063) |

The browser falls back to `<origin>/keycloak/realms/partyhub` when public configuration fails, and iOS falls back to the declared cloud realm (see [auth-environments.md](auth-environments.md)). Locally, the browser fallback does not match the local issuer on port 8000. ENV-08 therefore depends on `/api/config/public` succeeding; G021 already records the browser failure path.

## Scripts and workflows

| File | Declared effect | Safety note |
|---|---|---|
| `deploy-local.sh` | `docker-compose down -v` (removes volumes), `up -d`, `./mvnw clean package` (runs JUnit), stops any running `quarkus-run.jar`, checks port 8080, starts `quarkus:dev` | Destroys local Postgres/Keycloak data every run. README calls a non-existent `deploy.sh` (G015); G060. |
| `sync-import.sh` | Applies `import.sql` to local Compose Postgres **and** Kubernetes Postgres unless `--local-only`/`--skip-k8s` | `import.sql` begins with `TRUNCATE TABLE ...`; the default touches the cluster (G060). Not executed. |
| `run-http-tests.sh` | Starts dependencies/dev server, waits, runs API npm tests | Dev profile: bypass and drop-and-create (G061). |
| `.github/workflows/test.yml` | On push to `main` for listed paths: Compose up, `mvn clean test`, `quarkus:dev`, HTTPYac `--all` | No real-JWT job; historical results are not current evidence. |
| `.github/workflows/push.yaml` | On Test completion **with success**: `mvn package -DskipTests`, push backend and Keycloak images `latest` + SHA | Correctly gated on Test success. |
| `.github/workflows/deploy.yml` | On Build and Push **completion** (any conclusion) or manual: apply Postgres, delete app/Keycloak deployments, `DROP SCHEMA public CASCADE` on `demo`, apply manifests, replay `import.sql` | Not gated on success (G061); wipes all application and Keycloak state (G057). |

## Findings routed to gaps

- G002 (existing): Kubernetes bypass override. Unchanged.
- G005/G018 (existing, refreshed): README realm filename; two local realm inputs. ENV-09 now defines the target.
- G015 (existing): README `deploy.sh`. The actual script is destructive (G060).
- G057 (new): every deploy drops the shared `demo` schema, which also holds Keycloak data.
- G058 (new): party media is stored outside the persistent volume.
- G060 (new): destructive seed/reset scripts are under-documented.
- G061 (new): pipeline gating and the lack of real-JWT test evidence.
- G063 (new): the static OpenAPI document is stale and not served.
