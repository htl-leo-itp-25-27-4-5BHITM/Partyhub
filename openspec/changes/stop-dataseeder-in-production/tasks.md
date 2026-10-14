# Tasks

## 1. Pre-checks (read-only)

- [x] 1.1 Confirm `V3` is still the next free migration number (`ls src/main/resources/db/migration` shows only V1 and V2); otherwise use the next free number throughout
- [x] 1.2 Ask the user before running the read-only production queries from design.md (Migration Plan step 1); record the `follow_status` rows and the count of fake Vienna locations in the PR description

## 2. Reference data migration

- [x] 2.1 Add `src/main/resources/db/migration/V3__follow_status_reference_data.sql` inserting `(1,'pending'),(2,'accepted'),(3,'blocked')` with `ON CONFLICT (id) DO NOTHING`; verify by starting dev mode (`./mvnw quarkus:dev`) and checking the log shows `Migrating schema "public" to version "3"` with no Flyway error
- [x] 2.2 Verify idempotency: against the local Postgres, run the V3 statement a second time manually and confirm `SELECT id, name FROM follow_status` still returns exactly the three rows

## 3. Remove startup seeding

- [x] 3.1 Delete `src/main/java/at/htl/DataSeeder.java` and verify `grep -rn DataSeeder src` returns nothing
- [x] 3.2 Run `./mvnw clean test` and verify all tests pass (baseline: 254, 0 failures)

## 4. Integration check

- [x] 4.1 In dev, log in through Keycloak as `viki_vej`, send a follow request to another user and accept it as that user (real Keycloak login, not `X-User-Id`); verify both calls return success
- [x] 4.2 Open the map in the browser app and verify seeded users still show their Linz locations; restart dev mode and verify no Vienna locations appear in `user_location`
  - Note: Claude in Chrome was not connected, so the map was not checked visually. Verified via `GET /api/users/location/{id}` with a Keycloak token (Linz coordinates) and the DB after a dev restart (10 rows, 0 in Vienna). Pre-existing, unrelated: `index.js` calls `/api/users/{id}/location`, which does not exist (backend path is `/api/users/location/{id}`).
- [x] 4.3 Run `./run-http-tests.sh` (or `api/follow.http`) and verify it passes
- [ ] 4.4 Open a PR from `carla/cleanup` with a note on the new migration (insert-only, no DROP/DELETE) and the pre-check results; update `docs/cleanup-audit.md` item 1.1 to reference this change
