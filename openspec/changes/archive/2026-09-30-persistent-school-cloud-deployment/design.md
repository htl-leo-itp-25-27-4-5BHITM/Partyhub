# Design

## Context

For motivation, see proposal.md, section Why. The required behaviour is DEPLOY-01 and DEPLOY-02 in `openspec/specs/deployment-environment/spec.md`. They are not changed here.

Current state that shapes the approach:

- **Pipeline:** `test.yml` runs on push to `main`. `push.yaml` (Build and Push) is triggered by `workflow_run` on Test and gates its job on `conclusion == 'success'`. `deploy.yml` is triggered by `workflow_run` on Build and Push `completed` and has **no** gate. A skipped Build and Push job still ends that workflow as `completed`, and GitHub reports a skipped job as a success. So gating `deploy.yml` on the upstream conclusion is not a reliable way to detect that the image was really built. Both `workflow_run` workflows also check out the default branch head instead of `workflow_run.head_sha`.
- **Deploy steps:** Deletes the `quarkus` and `keycloak` Deployments and Services, runs `DROP SCHEMA public CASCADE` on `demo`, applies the manifests, waits for Quarkus, then replays `import.sql` (which starts with `TRUNCATE ... RESTART IDENTITY CASCADE`).
- **Databases:** One Postgres Deployment (`postgres:16-alpine`, PVC `postgres-pvc`, user/db `demo`). Keycloak (`k8s/keycloak.yaml`, `start --import-realm`, image with `realm-staging.json`) uses `demo`, so its tables share `public` with the PartyHub tables. Locally, Compose already uses a separate `keycloak` database, created by `docker/postgres/init/01-create-keycloak-db.sql`. That init script only runs on an empty volume, so it cannot help on the existing cloud PVC.
- **Schema management:** `%prod` uses Hibernate `update`, and `%dev` uses `drop-and-create` plus `import.sql`. JUnit runs on H2 with `drop-and-create`. `NotificationSchemaCompatibility` runs hand-written DDL and a backfill at startup on PostgreSQL (`notification.party_id` nullable, `invitation.status` added, backfilled, defaulted and set NOT NULL), and it ignores any failure.
- **Uploads:** Profile pictures are stored on `profile-uploads-pvc`, which is already persistent. Gallery storage (G058) belongs to a separate backlog item.

## Goals / Non-Goals

**Goals:**
- No deploy step can drop, truncate or reseed the deployed database.
- Deployment only runs for a commit that passed Test and whose images were actually built, and it deploys exactly that commit's images.
- Keycloak state lives in its own database and survives redeploys. Realm import never overwrites an existing realm.
- The schema only changes through reviewed, versioned, forward-only migrations, and CI runs them against real Postgres before they reach the school cloud.
- There is a documented, rehearsable one-time cut-over for the existing cloud.

**Non-Goals:**
- Moving database credentials into Kubernetes Secrets, adding TLS, or running Postgres in HA or as a managed service.
- Automated backups or point-in-time recovery. The cut-over takes a manual dump, and scheduled backups are follow-up work.
- Gallery storage (G058), removing the auth bypass (B02), real-token CI (B03), and making `sync-import.sh` safe (B19). This change only updates the seed path that `sync-import.sh` uses and the README warning.
- Migrating Keycloak data that exists at cut-over. See Decision 7.

## Decisions

### 1. Deploy as a job inside Build and Push, not as a separate `workflow_run` workflow
`deploy.yml` becomes a reusable workflow (`on: workflow_call` with an `image-tag` input, plus `workflow_dispatch` with the same input for manual redeploys). `push.yaml` gets a `deploy` job with `needs: build-and-push` that calls it and passes the commit's short SHA. `needs` skips the deploy whenever the build job fails or is skipped, and that is exactly the scenario *Failed pipeline does not deploy*.

- *Alternative:* keep `workflow_run` and add `if: github.event.workflow_run.conclusion == 'success'`, as G061 suggests. This is rejected as the only gate: a Build and Push run whose job was skipped (because Test failed) can still count as a success. So it would depend on how GitHub reports a skipped job, not on whether an image exists.
- Both the build job and the deploy job check out `github.event.workflow_run.head_sha` (or `github.sha` on dispatch). The images are then built from the tested commit, and `docker/metadata-action`'s `type=sha` tag names that commit.

### 2. Roll out in place, pinned to the commit's image tag
The deploy job runs `kubectl apply -f k8s/postgres.yaml -f k8s/keycloak.yaml -f k8s/quarkus.yaml`. It then runs `kubectl set image` for `quarkus` and `keycloak` to `…:<short-sha>` and waits with `kubectl rollout status`. All `kubectl delete` calls, the `DROP SCHEMA` step and the `Reset Database` step are removed. Manifests keep `:latest` as their default image, so a manual `kubectl apply` still works.

- *Why a pinned tag:* re-applying an unchanged manifest that uses `:latest` does not restart pods, so a new image would never roll out. The pinned tag also makes rollback a `kubectl rollout undo`.
- *Alternative:* `kubectl rollout restart` with `:latest`. It is simpler, but you cannot tell which commit is running, and it races with later pushes.
- Quarkus keeps `RollingUpdate`. Keycloak switches to `strategy: Recreate`. Two Keycloak pods on the same database during a Keycloak version upgrade would compete for the schema migration lock, and a single replica does not need rolling updates.

### 3. Keycloak gets its own `keycloak` database, created by an initContainer
`k8s/keycloak.yaml` sets `KC_DB_URL_DATABASE=keycloak` and adds an initContainer (`postgres:16-alpine`) that waits for `pg_isready` and then creates the database if it is missing (`SELECT 1 FROM pg_database WHERE datname='keycloak'` → `CREATE DATABASE keycloak`). This mirrors the local Compose setup (the local-keycloak-environment "dedicated database" requirement).

- *Why an initContainer rather than a deploy-workflow step or a Postgres init script:* it runs before every Keycloak start, so it also works when someone applies the manifest by hand, and it works on the existing PVC where `docker-entrypoint-initdb.d` never runs again.
- *Alternative:* a separate `keycloak` schema inside `demo`. This is rejected: it diverges from local Compose, and a future `DROP SCHEMA public` in `demo` would still be one typo away from Keycloak.

### 4. Realm import keeps an existing realm
Keycloak's `--import-realm` uses the `IGNORE_EXISTING` strategy by default. The args stay `["start", "--import-realm"]`, and the manifest sets no override strategy. The existing realm therefore wins, so realm changes after cut-over go through the Admin Console or a deliberate, documented re-import, not through a redeploy. This is written into the README.

### 5. Flyway with a baseline, Hibernate only validates
- Add `quarkus-flyway` and `flyway-database-postgresql` (both managed by the Quarkus BOM).
- `src/main/resources/db/migration/V1__baseline.sql` is the schema that the current entities produce on PostgreSQL. It is generated once: start the current app with `drop-and-create` against an empty Postgres and run `pg_dump --schema-only --no-owner` on `public`. The result is then reviewed and trimmed to PartyHub tables and sequences.
- `V2__notification_party_optional_and_invitation_status.sql` replaces `NotificationSchemaCompatibility` and uses the same idempotent statements (`ALTER … DROP NOT NULL`, `ADD COLUMN IF NOT EXISTS`, backfill, `SET DEFAULT`, `SET NOT NULL`). They are safe both on a fresh V1 database and on the school-cloud database, where the startup class already ran them. The class is deleted.
- **Profiles:**
  - Base and `%prod`/`%staging`: `quarkus.flyway.migrate-at-start=true`, `baseline-on-migrate=true`, `baseline-version=1`, `clean-disabled=true`, `quarkus.hibernate-orm.schema-management.strategy=validate`, and no SQL load script.
  - `%dev`: `migrate-at-start=true`, `clean-at-start=true`, `clean-disabled=false`, locations `db/migration,db/dev-seed`, strategy `validate`.
  - Test (H2): `quarkus.flyway.migrate-at-start=false`, and `drop-and-create` is kept unchanged. The migrations are PostgreSQL SQL and are not run on H2.
- **Baseline behaviour:** on the school cloud, `demo.public` is not empty and has no `flyway_schema_history`. Flyway records a baseline at version 1, skips V1 and applies V2 onward. On a fresh database (CI, local, a new environment), V1 runs.
- *Alternative:* Liquibase. It is rejected because it is heavier for a team that writes plain SQL, and Flyway is the Quarkus default. *Alternative:* keep Hibernate `update`. This is rejected because it cannot express the backfill, it silently drifts, and DEPLOY-02 needs predictable changes.

### 6. Dev seed data becomes a Flyway `afterMigrate` callback
`src/main/resources/import.sql` moves to `src/main/resources/db/dev-seed/afterMigrate.sql`, and its content is unchanged. With `clean-at-start` it runs after every dev start, which keeps today's "fresh seeded DB on each `quarkus:dev`" behaviour. Because the seed only exists in the `%dev` Flyway locations, `%prod` has no way to load it. `sync-import.sh` and its README section point to the new path.

- This keeps the CI evidence path: `test.yml`'s HTTPYac step starts `quarkus:dev` against Compose Postgres, so every push to `main` applies V1…Vn on real PostgreSQL, validates the entities against them and seeds the data. A migration that breaks the schema or the entity mapping fails Test, and then (Decision 1) nothing is deployed.
- *Alternative:* keep `drop-and-create` in dev and add a separate CI job that runs migrations. This is rejected because dev would then never run the schema that prod runs.

### 7. Keycloak data at cut-over is re-imported, not migrated
Today every deploy already drops Keycloak's tables, so at most the accounts registered since the last deploy exist. On first start, the new `keycloak` database imports `realm-staging.json` (with its demo users). Accounts registered after the last reset are lost once, and PartyHub `users` rows stay. On the next login, AUTH-08 first-login linking re-links users whose email matches. The runbook includes an optional step that copies the Keycloak tables across with `pg_dump -t` in case that loss is not acceptable on the day.

## Risks / Trade-offs

- [The school-cloud schema (built by Hibernate `update` plus the startup DDL) has drifted from V1, for example leftover columns or different nullability] → `validate` fails and the pod does not become Ready. Mitigation: in the cut-over rehearsal, compare `pg_dump -s` of the cloud `public` schema against V1 and add a reconciling migration before the first deploy. Because of the rolling update the old pod keeps serving, and `kubectl rollout undo` restores it.
- [Flyway migrations are forward-only, and a bad migration against persistent data cannot be undone by redeploying] → CI runs every migration on Postgres first (Decision 6). The cut-over takes a `pg_dump` of `demo` before the first deploy. Destructive migrations need a note in the PR review, as for raw SQL (see "SQL Security" in AGENTS.md).
- [The Keycloak tables left in `demo.public` after the cut-over confuse `baseline-on-migrate` or get in the way] → Flyway ignores unknown tables. The runbook drops them explicitly after Keycloak is confirmed healthy on its new database.
- [`kubectl set image` drifts from the `:latest` in the manifests] → This is intended. The next deploy sets the tag again, and the README says so.
- [Postgres is a single replica on a 1Gi PVC with no scheduled backups] → This is accepted for now (non-goal) and recorded in gaps.md as follow-up work.
- [`sync-import.sh --k8s-only` can still wipe the persistent cloud] → README warns about it more strongly, and making it opt-in is B19.

## Migration Plan

One-time cut-over, rehearsed locally first:

1. **Rehearse locally:** build the current `main` in `prod`-like mode (`update`) against a Compose Postgres, seed it and register a user. Switch to this branch with the `prod` profile and confirm that Flyway baselines, V2 applies, `validate` passes and the data is still there. Fix any drift with a new migration.
2. **Back up the cloud:** `kubectl exec <postgres> -- pg_dump -U demo demo > demo-before-b01.sql`. Keep the dump off-cluster and outside the repo, because it contains personal data.
3. **Merge to `main`:** the pipeline runs Test → Build and Push → deploy. The deploy no longer resets anything. The Keycloak initContainer creates `keycloak`, Keycloak imports the realm, and Quarkus baselines `demo` and applies V2.
4. **Check:** the Quarkus and Keycloak rollouts are complete. The row counts in `demo` match the dump. A demo user can log in. Push a trivial commit and confirm that the data and the Keycloak users survive it.
5. **Clean up:** drop the old Keycloak tables in `demo.public`. Build the list from the `keycloak` database's table names, and review it before running it.

**Rollback:** `kubectl rollout undo deployment/quarkus` (and `keycloak`). If the data itself is damaged, restore `demo-before-b01.sql`. Rolling back to a pre-B01 image of `deploy.yml` would bring the reset back, so revert through a commit instead.
