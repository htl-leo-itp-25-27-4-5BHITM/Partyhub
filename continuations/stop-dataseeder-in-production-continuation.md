# Continuation: stop-dataseeder-in-production

Date: 2026-10-14

## Goal

Implement the OpenSpec change `stop-dataseeder-in-production`. It is the first fix from the cleanup audit.

Do not redo the audit or the proposal. All planning artifacts already exist and pass validation (`openspec validate stop-dataseeder-in-production --strict`). Pick up at task 1.1 in `tasks.md`.

## Where Things Are

- **Branch:** `carla/cleanup`, created from `main` at `787de5f` ("docs: add codebase cleanup audit").
- **Change:** `openspec/changes/stop-dataseeder-in-production/`
  - `proposal.md`: why
  - `design.md`: decisions, risks, and the read-only production queries
  - `specs/deployment-environment/spec.md`: the ADDED requirement "Application startup does not write seed or test data"
  - `tasks.md`: 10 tasks in 4 groups, all unchecked
- **Audit:** `docs/cleanup-audit.md` (already on `main`). This change is item 1.1, and the file lists PR 1 of 7 in the suggested order.
- **Uncommitted when this note was written:** the change folder and this continuation file.

## Established Facts (don't re-derive)

- `src/main/java/at/htl/DataSeeder.java` observes `StartupEvent` in every profile.
  - Outside the test profile, it creates or renames `follow_status` 1/2/3 (pending/accepted/blocked).
  - In all profiles, including prod, it gives up to six users Vienna coordinates in `user_location`. It checks for an existing row with `em.find(UserLocation.class, userId)`, which looks up the location's primary key instead of `user_id`, so the check is wrong.
- In prod, `DataSeeder` is the **only** source of the `follow_status` rows. That's why a migration is required before deleting it.
- Dev uses `clean-at-start` and `db/dev-seed/afterMigrate.sql`, which already seeds `follow_status` and ten Linz `user_location` rows. Nothing needs to move into the seed file. (The original request said to move the locations; that was dropped as unnecessary.)
- Tests use H2 with `drop-and-create` and Flyway disabled, and create their own `FollowStatus` rows. Deleting `DataSeeder` shouldn't affect them.
- Migrations on disk: only `V1__baseline.sql` and `V2__notification_party_optional_and_invitation_status.sql`, so `V3` is next. Re-check before creating it.
- Baseline before the change: `./mvnw clean test` gives 254 tests, 0 failures. Local Docker Postgres (5432) and Keycloak (8000) were running, and a real PKCE login as `viki_vej` worked.
- The local default JDK is 26 and the project targets 21. Builds work with 26. Temurin 21.0.11 is installed if needed.
- A Quarkus dev instance may already be running on :8080 (it was started from IntelliJ). Check with `lsof -iTCP:8080 -sTCP:LISTEN` before starting another one.

## Guardrails

- **Production DB:** only `SELECT` queries, and only after asking the user (task 1.2). No DELETE or UPDATE on fake locations; they are only reported.
- Never run `./sync-import.sh` without `--local-only`. Ask before `./deploy-local.sh`, because it wipes local volumes.
- Pushing `src/` changes to `main` deploys to production. Push `carla/cleanup` and open a PR. Only push to `main` directly if the user explicitly says so again for this change.
- Commits use Conventional Commits style and end with the Co-Authored-By trailer.
- Verify login with a real Keycloak login (demo users: password = username), not `X-User-Id`.
- The PR description needs a note on the new migration: it only inserts, with no DROP or DELETE.

## Next Steps

1. `/opsx:apply stop-dataseeder-in-production`
2. Work through `tasks.md` in order, ticking each box as it's verified.
3. Open the PR, then update `docs/cleanup-audit.md` item 1.1 to link to it.
4. Next audit item after this one: PR 2, "remove unused root files and dead frontend files". `continuations/` itself is on that list, so this file can be deleted then.

## Output Expectation For The New Thread

When reporting back, include:

- files changed
- the result of `./mvnw clean test` (count and failures)
- the results of the dev-mode Flyway log and the follow/map checks
- the production read-only query results, if the user allowed them
- the PR link
