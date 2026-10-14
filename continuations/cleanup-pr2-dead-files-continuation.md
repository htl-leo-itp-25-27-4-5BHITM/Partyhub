# Continuation: cleanup PR 2 (remove unused root files and dead frontend files)

Date: 2026-10-14

## Goal

Continue the cleanup audit (`docs/cleanup-audit.md`, "Suggested order"). PR 1 is done and waiting for review. The next step is PR 2, **`chore: remove unused root files and dead frontend files`**. It covers audit sections 2 and 4, except `project/`. There should be no behaviour change.

## State of PR 1 (don't redo)

- OpenSpec change `stop-dataseeder-in-production`: 10/10 tasks done.
- **PR #156** is open: https://github.com/htl-leo-itp-25-27-4-5BHITM/Partyhub/pull/156 (branch `carla/cleanup` → `main`).
  - Commits: `d3f4d0e` proposal, `80812e3` fix (deleted `DataSeeder`, added `V3__follow_status_reference_data.sql`), `ad964d5` audit link.
  - Verified: `./mvnw clean test` passes with 254 tests and 0 failures. All `api/*.http` tests pass (191/191). A real Keycloak PKCE follow/accept works (201/200). After a restart there are 0 Vienna locations.
  - Production pre-check (read-only): `follow_status` already has 1/2/3, and there are 0 fake Vienna locations. Nothing to clean up.
  - PR checks: GitHub runs Test and Build only on pushes to `main`, so nothing tests the PR before you merge.
- **After the user merges #156:** run `/opsx:archive stop-dataseeder-in-production` (ask first), then update audit item 1.1 from "in progress" to "done".
- Don't push more commits to `carla/cleanup` unless they belong to PR #156.

## PR 2 Scope (from the audit, verify each item before deleting)

Work on a **new branch from `origin/main`**, for example `carla/cleanup-dead-files`. It doesn't depend on #156.

Safe deletions (the audit found no references; confirm with `grep` before deleting):
- `src/main/java/at/htl/FilterDto.java` and `FilterDtoTest`. Also remove the unused import in `PartyResource`.
- `META-INF/resources/api.js`, `test.html` (a public debug page) and `script.js`.
- Root: `create-tables.sql`, `test-data.sql`, `wrapper/maven-wrapper.properties`, `openapi.yaml` (point the README to `/q/openapi`) and `e2e/` (it only has a `.gitignore`).
- `continuations/`, including this file and the older notes. Git history keeps them.

Items that need a decision from the user. Ask, don't guess:
- `prompts/` and `AGENTS.md`: both are tracked but listed in `.gitignore`. Should they stay or go?
- `.agents/` and `.codex/`: duplicate OpenSpec skills. Which tool's copy should stay?
- `src/main/resources/uploads/` (4.3 MB of test uploads in the jar): does the seed need any of these demo images?
- Moves: `SWIFT_FILTER_IMPLEMENTATION.md` and `SwiftVertiefungREADME.md` → `docs/history/`; `image.png` and `logo.png` → `docs/images/`, then update the README links and compress the logo.

Not in PR 2:
- `project/` (PR 3).
- `PushNotificationService` (part of 1.2/1.3, PR 4).
- Section 3 refactor.
- Section 5 docs.

## New Finding To Add To The Audit

`src/main/resources/META-INF/resources/index.js` (~line 396) fetches `/api/users/${id}/location`, but the backend only serves `GET /api/users/location/{id}`. The map's own-location marker never loads from the API. This already exists on `main`. Add it to audit section 1 as a new item. It's a behaviour fix, so it doesn't belong in PR 2.

## Established Facts (don't re-derive)

- Migrations on `main`: V1 and V2. V3 exists on `carla/cleanup` (PR #156).
- Local Docker Postgres (5432) and Keycloak (8000) are running. Demo users: password = username.
- A dev server started by the previous Claude session may still be running on :8080. Check with `lsof -iTCP:8080 -sTCP:LISTEN`. The user's IntelliJ dev instance was stopped with their OK. Ask before stopping a dev server you didn't start.
- `./run-http-tests.sh` starts its own `mvn quarkus:dev` on :8080. If dev is already running, run `cd api && npm ci && npm test` instead; it's the same test set.
- Real PKCE login for API checks without a browser: the `frontend` client has direct grants disabled. Script the authorization-code + PKCE flow with curl against `http://localhost:8000/realms/partyhub`, with redirect `http://localhost:8080/auth/callback.html`. The previous script was in that session's scratchpad and is gone, so write a new one.
- Claude in Chrome was not connected last session. If you need visual checks, ask the user to connect it, or say the check was skipped.
- Local JDK 26, project targets 21. Builds work.

## Guardrails

- Never run `./sync-import.sh` without `--local-only`. Ask before `./deploy-local.sh` (it wipes the volumes).
- No `kubectl` writes. Ask before any production query, even a read-only one.
- Pushing to `main` deploys to production. Use a branch and a PR.
- Conventional Commits, ending with the Co-Authored-By trailer.
- Before claiming done: run `./mvnw clean test`, and run the HTTP tests if anything under `META-INF/resources` or endpoints changed.

## Output Expectation For The New Thread

When reporting back, include:
- what you deleted or moved, and the `grep` evidence that nothing referenced it
- the user's decisions on the open items
- the `./mvnw clean test` result (count and failures) and the HTTP test result
- the PR link, with `docs/cleanup-audit.md` updated (items marked, new index.js finding added)
