# Continuation: add-plain-js-keycloak-auth

Date: 2026-05-21

## Goal

Continue the OpenSpec change `add-plain-js-keycloak-auth` and finish the remaining live verification/archive work.

The implementation is mostly complete. Do not restart from scratch unless the user explicitly asks. Pick up from the current workspace state.

## Current OpenSpec Status

Change: `add-plain-js-keycloak-auth`
Schema: `spec-driven`
Progress: `33/36` tasks complete

Remaining tasks:

- [ ] 7.2 Start local Postgres and Keycloak, verify the `partyhub` realm imports successfully, and confirm the demo user can authenticate.
- [ ] 7.3 Run Quarkus dev mode and complete browser login through the plain JavaScript OIDC flow.
- [ ] 7.5 Verify logout clears browser-session token data and ends the Keycloak session.

Important: The user asked to archive, but the change was not archived because these 3 verification tasks are still open.

## What Was Implemented

Backend:

- Added `src/main/java/at/htl/auth/CurrentUserResolver.java`.
- Added nullable unique `keycloak_id` to `User`.
- Added `UserRepository.findByKeycloakId(...)`, unlinked username/email matching, and link helper.
- Protected acting-user endpoints now resolve caller identity from authenticated Keycloak/JWT identity instead of `X-User-Id`, `user`, or `userId`.
- Added/updated tests using `quarkus-test-security`.

Frontend:

- Replaced local numeric-ID auth in `src/main/resources/META-INF/resources/auth-service.js`.
- Added plain JavaScript OIDC Authorization Code + PKCE.
- Added callback page at `src/main/resources/META-INF/resources/auth/callback.html`.
- `authService.apiCall()` refreshes and sends `Authorization: Bearer <access_token>`.
- Token session data is in `sessionStorage`; legacy `localStorage` auth is cleared.
- Updated route guard, login/start flows, and shared frontend API helpers.

Keycloak/config/docs:

- Updated `keycloak/realm-export.json`:
  - `frontend` redirect URI: `http://localhost:8080/*`
  - web origin: `http://localhost:8080`
  - direct access grants disabled
  - standard flow enabled
  - PKCE S256 attribute added
  - demo user `viki_dji` / `partyhub`
- Added JWT config to `src/main/resources/application.properties`.
- Documented demo credentials and re-import note in `README.md`.

## Verification Already Run

Passed:

```bash
./mvnw test
```

Result: `230` tests, `0` failures.

Passed syntax checks:

```bash
node --check src/main/resources/META-INF/resources/auth-service.js
node --check src/main/resources/META-INF/resources/route-guard.js
node --check src/main/resources/META-INF/resources/user-utils.js
node --check src/main/resources/META-INF/resources/backend-functions.js
node --check src/main/resources/META-INF/resources/api.js
node --check src/main/resources/META-INF/resources/addParty/addParty.js
node --check src/main/resources/META-INF/resources/advancedPartyInfos/advancedPartyInfos.js
node --check src/main/resources/META-INF/resources/notifications/notifications.js
node --check src/main/resources/META-INF/resources/profile/profile.js
node --check src/main/resources/META-INF/resources/editProfile/editProfile.js
node --check src/main/resources/META-INF/resources/index.js
node --check src/main/resources/META-INF/resources/gallery/gallery.js
node --check src/main/resources/META-INF/resources/listPartys/listPartys.js
node --check src/main/resources/META-INF/resources/script.js
```

Passed:

```bash
openspec validate add-plain-js-keycloak-auth --strict
```

Checked:

```bash
rg -n "X-User-Id|@HeaderParam\\(\"X-User-Id\"\\)|@QueryParam\\(\"user\"\\)|@QueryParam\\(\"userId\"\\)|[?&]user=" src/main/java src/main/resources/META-INF/resources -S
```

Result: no remaining main-code matches.

## Current Blocker

Docker is running:

```bash
docker compose ps
```

Showed `postgres` and `keycloak` up.

However, the running Keycloak realm is stale. It still reports:

- redirect URI `http://localhost:8000/*`
- web origin `http://localhost:8000`
- direct access grants enabled

The edited `keycloak/realm-export.json` is correct, but Keycloak only imports the mounted realm on first startup. The next chat should ask before destructive volume work, then either:

1. Re-import/update the `partyhub` realm through Keycloak Admin API, or
2. Recreate the local Postgres/Keycloak data volume so the realm export is imported fresh.

Do not silently delete Docker volumes without the user's approval.

## Suggested Next Steps

1. Ask the user whether to re-import the Keycloak realm via Admin API or reset/recreate the local Docker volume.
2. Make the running Keycloak realm match `keycloak/realm-export.json`.
3. Verify `frontend` client from Keycloak Admin API:
   - public client
   - standard flow enabled
   - direct access grants disabled
   - redirect URI `http://localhost:8080/*`
   - web origin `http://localhost:8080`
4. Confirm demo user `viki_dji` with password `partyhub` can authenticate.
5. Start Quarkus dev mode:

```bash
./mvnw io.quarkus.platform:quarkus-maven-plugin:3.34.6:dev
```

6. Open `http://localhost:8080/register_login/start.html`.
7. Complete browser login through Keycloak.
8. Verify a protected frontend action sends a bearer token.
9. Verify logout clears session token data and ends the Keycloak session.
10. Mark tasks `7.2`, `7.3`, and `7.5` complete in `openspec/changes/add-plain-js-keycloak-auth/tasks.md`.
11. Then archive the change with `/ospx:archive` or the OpenSpec archive workflow.

## Dirty Worktree Notes

There are unrelated pre-existing dirty files that should not be reverted unless the user asks:

- `.gitignore`
- `continuations/add-keycloak-compose-implementation.md` deleted
- `docs/keycloak-merge-summary.md`
- `prompts/answers.md`
- `prompts/prompts.md`

The new continuation file is `continuations/add-plain-js-keycloak-auth-continuation.md`.

