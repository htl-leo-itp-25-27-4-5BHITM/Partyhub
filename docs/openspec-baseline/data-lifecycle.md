# Persistence and storage lifecycle evidence

Group 11.2, inspected 2026-09-30 at `3a3f6ed` (source unchanged since `9487ccb`). This record describes **declared and source-observed** lifecycles only. No database, container, cluster or file system was inspected at runtime, and no seed, reset or deployment script was executed. Accepted behavioural rules stay in the main specs. The only accepted persistence statements are D012/SOC-08 (the centre's read/delete state persists), MEDIA-03/SOC-07 (failure-consistent storage, and the previous picture is kept on failure) and PARTY-15/SOC-03 (cancellation snapshot semantics). No accepted retention period, backup policy or deletion SLA exists; see Q015/Q016.

## Schema management

| Mechanism | Evidence | Observation |
|---|---|---|
| Hibernate schema strategy | `application.properties`: base `quarkus.hibernate-orm.schema-management.strategy=update`; `%dev` `drop-and-create`; test resources `drop-and-create` | No migration tool (no Flyway/Liquibase in `pom.xml`). Production-profile schema evolves only through Hibernate `update`, which adds but does not drop or rename columns. |
| Startup compatibility DDL | `NotificationSchemaCompatibility` observes `StartupEvent` on PostgreSQL: makes `notification.party_id` nullable; adds/backfills `invitation.status` default `PENDING` NOT NULL | Hand-written migration steps outside any migration record; failures are logged at debug and ignored. |
| Load script | base `sql-load-script=${PARTYHUB_SQL_LOAD_SCRIPT:no-file}`; `%dev` `import.sql` | Dev reloads seed data on every start. Prod loads nothing unless the environment variable is set. |
| Static SQL | `src/main/resources/import.sql`; root `create-tables.sql` (hand-written `CREATE TABLE IF NOT EXISTS` DDL) and `test-data.sql` (manual seed for users `alice`/`bob`/`carol`, which are not in the current realm files) | No script, workflow or profile references the root files; they are unmaintained manual fixtures, not a migration path. `import.sql` starts with `TRUNCATE TABLE notification, invitation, media, party_user, party, qr_login, user_location, profile_picture, follow, follow_status, location, users RESTART IDENTITY CASCADE`, then inserts seed rows and resets sequences. |

## Environment data lifecycle

| Environment | Application data | Keycloak data | Declared reset triggers |
|---|---|---|---|
| Local dev (`quarkus:dev`) | Dropped, recreated and reseeded on every app start (`%dev` drop-and-create + `import.sql`) | Separate `keycloak` DB on the Compose volume; realm imported only if absent (standard `--import-realm` behaviour, not executed) | App restart; `deploy-local.sh` (`down -v` removes the Postgres volume, including Keycloak); `sync-import.sh` (truncates and reseeds) |
| JUnit | H2 in-memory, per test JVM, drop-and-create, no seed | none | Every test run |
| CI HTTPYac | Dev profile against Compose Postgres; reseeded on start | Compose Keycloak started but unused | Every workflow run |
| Kubernetes | `postgres-pvc` 1Gi. Prod profile uses `update`; **every deploy** runs `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` on `demo`, then replays `import.sql` | Keycloak uses the **same `demo` database and `public` schema** (`k8s/keycloak.yaml`), so the drop also deletes realm state; `start --import-realm` then recreates it from `realm-staging.json` | Every run of `deploy.yml` (automatic after Build and Push completes, or manual); `sync-import.sh` without `--local-only` |

Observation: the deployed environment does not retain user accounts, parties, invitations, follows, notifications or Keycloak registrations across deployments. The workflow comment says "Drop Keycloak schema", but the command drops the shared application schema. Whether this reset-on-deploy behaviour is intended for a demonstration environment is Q015. G057 records the discrepancy.

## Uploaded files

| Data | Write path | Read path | Persistence by environment | Deletion |
|---|---|---|---|---|
| Profile pictures | `partyhub.profile-picture.upload-dir`: `%dev` `uploads/profiles`, `%prod` `/app/uploads/profiles`, default `uploads/profiles`; the `ProfilePicture` row is persisted per upload | Upload dir, then legacy `src/main/resources/uploads/profiles`, else default SVG | Kubernetes: PVC `profile-uploads-pvc` mounted at `/app/uploads`. The image also copies seed avatars to `/app/uploads/profiles`; a PVC mounted on the same path hides image content, so whether the seed avatars are visible in the cluster is unverified. | No code deletes a replaced or orphaned file. A deploy reset deletes the rows but leaves the files on the PVC (orphans). G039 covers replacement consistency. |
| Party gallery media | `MediaRepository.upload`: `src/main/resources/uploads/party{partyId}/` relative to the working directory | `getMediaById` reads a **classpath** resource `uploads/<file>` (not exposed by any REST route; G036) | Local dev: under the source tree. Packaged/Kubernetes: `/app/src/main/resources/uploads/...` is outside the PVC and lost on pod replacement. Classpath reads only find files packaged at build time (the tracked `party2` samples). | Party deletion cascades `Media` rows (`Party.media` `CascadeType.ALL`, orphanRemoval), but no code deletes the files. |
| Seed media | 10 tracked profile images, 4 tracked `party2` images | as above | Packaged into the jar/image at build time | n/a |

G058 records the storage-location and serving mismatch against D019/MEDIA-03 (a stored reference must stay usable). Orphan-file cleanup and retention are Q016.

## Notification and related-row cleanup

| Trigger | Source behaviour | Accepted reference |
|---|---|---|
| Party deletion (host) | `PartyRepository.removeParty` deletes every notification whose `party` is the party, then removes the party; invitations and media rows cascade; `party_user` rows are removed by the join table | PARTY-15/SOC-03/SOC-08 require a bounded cancellation snapshot independent of the deleted party; G040/G041 record the missing typed snapshot. |
| Invitation re-issue / resolution | Producers delete earlier message-pattern notification rows and create new ones (Group 8 evidence) | SOC-08; G040/G041 |
| Recipient delete | `DELETE /api/notifications/{id}` removes the row after recipient/message checks | SOC-08; G040/G045 |
| Scheduled cleanup | None. The only `@Scheduled` job is the weekly digest `PartyEmailDigestService` (`0 0 10 ? * MON`) | No accepted age-based retention; Q016 |
| Account deletion | No user-deletion endpoint or repository path exists | No accepted account-deletion rule; Q016 |
| Deferred location rows | `user_location` has no timestamps, expiry or revocation (G054) | D022 defers sharing; retention stays with a future proposal |
| QR tokens | `qr_login` rows have expiry/used fields, but no cleanup job exists (G050) | D021 defers QR |

## Unknowns kept explicit

- Actual deployed Postgres/PVC contents, backups, snapshots or storage classes: not inspected; no backup declaration exists in the repository.
- Keycloak import precedence with two same-realm files: not executed (G018).
- Whether production ever ran with `PARTYHUB_SQL_LOAD_SCRIPT` set: unknown; no manifest sets it.
- Email retry and delivery receipts: the mailer sends once, and failures are isolated per SOC-10. No retry policy is accepted (Q018).
