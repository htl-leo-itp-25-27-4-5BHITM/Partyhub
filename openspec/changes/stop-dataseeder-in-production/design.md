# Design

## Context

See proposal.md for why this change is needed. The current setup, per profile:

- **prod:** Flyway runs `migrate-at-start` with `baseline-version=1`. `DataSeeder` then runs: it creates or renames `follow_status` 1–3, and for each of the first six users returned by `UserRepository.getUsers()`, it inserts a Vienna `user_location` if `em.find(UserLocation, userId)` returns nothing. That lookup is by the location's primary key, not by `user_id`, so it can also miss or match the wrong row.
- **dev:** `clean-at-start` plus `db/dev-seed/afterMigrate.sql` truncate the tables and seed `follow_status` and ten Linz locations. `DataSeeder` adds nothing here.
- **test:** H2 with `drop-and-create`; Flyway is off. Tests insert their own `FollowStatus` rows. At startup there are no users, so `DataSeeder` does nothing.

## Goals / Non-Goals

**Goals:**
- Nothing is written at application startup in any profile.
- Production keeps getting the follow-status reference rows, now from a migration.

**Non-Goals:**
- Cleaning up fake locations that may already be in production. These are only reported (see Migration Plan).
- Changing `FollowStatus` modelling, for example into an enum.

## Decisions

1. **Reference rows via Flyway migration, not startup code.** Migrations run once, are versioned and match the rule "schema and reference data through Flyway". Alternative considered: keep `DataSeeder` but limit it to `@IfBuildProfile("dev")`. Rejected because dev already has the data from `afterMigrate.sql`, and the prod case still needs the statuses.
2. **`INSERT ... ON CONFLICT (id) DO NOTHING`.** Production most likely already has rows 1–3 (created by `DataSeeder`), so the migration must not fail on or overwrite them. Postgres supports this syntax. The migration does not run under H2 tests (Flyway is disabled there).
3. **Don't touch `afterMigrate.sql`.** It truncates `follow_status` and inserts the same three rows after migrations run, so dev ends up the same.
4. **Delete `DataSeeder` entirely** instead of moving its location logic. The seed already has better (Linz) locations.

## Risks / Trade-offs

- [Production has `follow_status` rows with a different id/name mapping than 1–3] → `ON CONFLICT DO NOTHING` keeps them as they are. Before merging, check with the read-only query below.
- [Some code path relied on `DataSeeder` renaming statuses] → `FollowRepository` looks statuses up by id. Run `./mvnw clean test` and a manual follow/accept in dev to confirm.
- [The id sequence for `follow_status`] → The table uses explicit ids and no identity column, so there's nothing to reset.

## Migration Plan

1. Before merging, run these read-only checks against production (via `kubectl exec` into Postgres, `SELECT` only):
   - `SELECT id, name FROM follow_status ORDER BY id;` should return the three expected rows.
   - `SELECT ul.id, ul.user_id, ul.latitude, ul.longitude FROM user_location ul WHERE (ul.latitude, ul.longitude) IN ((48.2082,16.3738),(48.2099,16.3567),(48.1985,16.3839),(48.2200,16.3500),(48.2150,16.3900),(48.2050,16.3600));` lists the fake locations for manual review. Nothing is deleted as part of this change.
2. Merge the PR. The pipeline runs Test → Build → Deploy, Flyway applies V3, and `DataSeeder` no longer runs.
3. **Rollback:** `kubectl rollout undo deployment/quarkus`. The V3 row stays in `flyway_schema_history`, which is harmless because the migration only inserts what already exists.
