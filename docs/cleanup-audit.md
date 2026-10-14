# PartyHub Cleanup Audit

Date: 2026-10-14

## Baseline

Checked on a local machine before any cleanup:

- The app starts. Postgres and Keycloak run in Docker; Quarkus dev runs on :8080.
- A real Keycloak login (`viki_vej`, PKCE) works, and `/api/users/me` and `/api/notifications` return that user's data.
- `./mvnw clean test`: 254 tests, 0 failures.
- The local default JDK is 26 and the project targets Java 21. It works, but use JDK 21 if startup behaves strangely.

Nothing below blocks startup. The findings are ordered by how much they matter.

---

## 1. Bugs and rule violations (fix first)

### 1.1 `DataSeeder` writes test data in production

`src/main/java/at/htl/DataSeeder.java` observes `StartupEvent` in **every** profile, including prod. On each start it:

- inserts follow statuses (`pending`, `accepted`, `blocked`) outside the test profile, and
- gives the first six users made-up Vienna coordinates in `user_location` if they have none.

This breaks the rule that seed data belongs only in `db/dev-seed/afterMigrate.sql`. Real production users may already have fake locations.

**Fix:**
- Move the follow statuses into a Flyway migration (they are reference data, not seed data).
- Move the test locations into `afterMigrate.sql`.
- Delete `DataSeeder`.

**Status:** done in [PR #156](https://github.com/htl-leo-itp-25-27-4-5BHITM/Partyhub/pull/156); OpenSpec change `stop-dataseeder-in-production` is synced into `deployment-environment` and archived. Moving the locations turned out to be unnecessary, because `afterMigrate.sql` already seeds ten Linz locations. A read-only check found 0 fake Vienna locations in production.
- Check the production `user_location` rows by hand (read-only) before deciding whether they need cleanup.

### 1.2 Push notifications are never sent

`PushNotificationService` is only referenced from tests (`PushNotificationServiceTest`, `MockPushService`). No production code calls it, so device tokens are stored but nothing pushes to them. It is also the only class that uses `System.out`/`printStackTrace`.

**Decide:** wire it into the notification flow, or delete it. Check the matching spec in `openspec/specs/` first.

### 1.3 Duplicate device-token endpoints

Two endpoints do the same thing, and both use a native `UPDATE users SET device_token ...`:

- `POST /api/parties/device-token` (`PartyResource.java:154`)
- `POST /api/users/device-token` (`UserResource.java:455`)

**Fix:** keep `/api/users/device-token`, switch it to an entity update, and remove the one under `/parties`. Check which one the iOS app calls first.

### 1.4 Multipart upload has no validation

`PartyResource.upload(MediaRepository.FileUploadInput input, ...)` has no `@Valid`, and the form class lives inside the repository.

**Fix:**
- Move `FileUploadInput` to `media/`.
- Add `@Valid` and a `@NotNull`/size constraint.

### 1.5 Map never loads the user's own location from the API

`src/main/resources/META-INF/resources/index.js:396` fetches `/api/users/${currentUserId}/location`, but the backend only serves `GET /api/users/location/{id}` (`UserResource.java:389`). The request fails, the error is only logged with `console.debug`, and the own-location marker never comes from the API. This is already on `main`.

**Fix:** change the fetch to `/api/users/location/${currentUserId}` and check the response shape against the endpoint. This is a behaviour fix, so it gets its own PR (not PR 2).

---

## 2. Dead or duplicated code

| Item | Finding | Action |
|---|---|---|
| `src/main/java/at/htl/FilterDto.java` | Only imported by `PartyResource` and never used. Replaced by `party/FilterParams`. | Delete it and `FilterDtoTest`. **Done in PR 2.** |
| `PushNotificationService` | Not called anywhere (see 1.2). | Wire it in or delete it. |
| `META-INF/resources/api.js` | Not referenced by any page. | Delete. **Done in PR 2.** |
| `META-INF/resources/test.html` | A debug page ("Output in console") that is served publicly in production. | Delete. **Done in PR 2.** |
| `META-INF/resources/script.js` | Only referenced by a commented-out tag in `test.html`. | Delete. **Done in PR 2.** |
| `src/main/resources/uploads/` | 14 test uploads (4.3 MB) packaged into the jar. **Not dead:** `MediaRepository` reads party media from the classpath `uploads/` + url (line 71) and writes new party uploads to `src/main/resources/uploads/party<id>/` (line 129); `UserResource` keeps it as `LEGACY_UPLOAD_DIR`. The seed names `profile_N.jpg`, but the files are `pp_N.jpg`. | Left out of PR 2 (behaviour change). Handle together with 1.4 in PR 5: move uploads out of the classpath, then remove the folder and fix the seed file names. |

## 3. Code structure

- **Repositories return JAX-RS `Response`.** Seven repositories build HTTP responses, with hand-written JSON strings like `"{\"error\": \"Party not found\"}"`. HTTP concerns belong in the resources: repositories should return entities, DTOs or `Optional`, and resources should map them to status codes.
  - Do this one domain per PR. Tests cover the behaviour.
- **`EntityManager` used directly in resources.** `UserResource` (14 uses) and `PartyResource` (4 uses) bypass their repositories. Move these calls into the repositories.
- **`PartyRepository` is 915 lines.** It mixes party CRUD, attendance, invitations and notification side effects. Split out attendance and invitation logic.
- **Inconsistent package names.** `user_location` and `profile_picture` use snake_case; everything else is lower-case single words. Renaming is low-risk but touches many imports, so it should be its own PR.
- **Raw SQL.** There are three `createNativeQuery` calls (the two device-token ones and `PushNotificationService`). Parameters are bound, but each one needs a PR note; items 1.2 and 1.3 remove all three.

## 4. Repository root clutter

| Path | Size | Finding | Action |
|---|---|---|---|
| `project/` | 133 MB tracked | School deliverables: videos, a 32 MB zip, pptx/docx, a Word lock file `~$A Sprechtext.docx`, posters, diagrams. Not part of the app. | Move out of the repo (or into Git LFS / a separate repo). This is the biggest reason the clone is slow. |
| `create-tables.sql` | | Old schema; Flyway `V1__baseline.sql` replaces it. Not referenced. | Delete. **Done in PR 2.** |
| `test-data.sql` | | Old seed; `afterMigrate.sql` replaces it. Not referenced. | Delete. **Done in PR 2.** |
| `wrapper/maven-wrapper.properties` | | Identical copy of `.mvn/wrapper/maven-wrapper.properties`. | Delete. **Done in PR 2.** |
| `openapi.yaml` | | Outdated per the project rules; the live spec is `/q/openapi`. | Delete, and point README to `/q/openapi`. **Done in PR 2.** |
| `continuations/` | | Agent hand-off notes from finished work. | Delete (git history keeps them). **Done in PR 2.** |
| `prompts/` | | Listed in `.gitignore` but tracked anyway. | Keep tracked; removed from `.gitignore`. **Done in PR 2.** |
| `SWIFT_FILTER_IMPLEMENTATION.md`, `SwiftVertiefungREADME.md` | | Marked as historical notes. | Move to `docs/history/` or `PartyHubiOS/`. **Done in PR 2** (`docs/history/`). |
| `image.png` | | Used by README. | Move to `docs/images/`. **Done in PR 2.** |
| `logo.png` | 940 KB | Used by README. | Move to `docs/images/` and compress. **Done in PR 2.** Resized to 400 px (961 KB → 231 KB). |
| `e2e/` | | Contains only a `.gitignore`; no tests. | Delete, or add the Playwright tests it was meant for. **Done in PR 2.** |
| `.agents/`, `.codex/` | | Duplicate copies of the OpenSpec skills that are also in `.claude/skills/`. | Keep one tool's copy if only one tool is used. **Done in PR 2:** `.agents/` deleted; `.claude/` and `.codex/` kept. |
| `AGENTS.md` | | Listed in `.gitignore` but tracked. Mentions `login.css` and `footer.ftl`, which don't exist. | Fix the content and remove it from `.gitignore`. `.gitignore` entry removed in PR 2; content fix stays in PR 7. |
| `api/node_modules` | 59 MB | Ignored correctly; local only. | Nothing to do. |

## 5. Docs

- `docs/functional-spec-codex.md` is marked historical; `docs/intent.md` is a narrative. Move both to `docs/history/`.
- `docs/keycloak-merge-summary.md` refers to `.codex` and `prompts/`. Check it after the root cleanup.
- README links to `openapi.yaml` and has a "Codex commands" section. Update both after the cleanup.

---

## Suggested PR order

Each PR goes on its own branch, because a push to `main` deploys to production. Run `./mvnw clean test` and `./run-http-tests.sh` before each merge.

1. **`fix: stop DataSeeder from running in production`.** Covers 1.1: a new migration for follow statuses; `DataSeeder` deleted ([#156](https://github.com/htl-leo-itp-25-27-4-5BHITM/Partyhub/pull/156)).
2. **`chore: remove unused root files and dead frontend files`.** Covers sections 2 and 4, except `project/`. No behaviour change.
3. **`chore: move school deliverables out of the repo`.** Covers `project/`. Agree on where they go first.
4. **`fix: consolidate device-token endpoint`** and the push decision. Covers 1.2 and 1.3; check the iOS client and the spec.
5. **`fix: validate media upload input`.** Covers 1.4.
6. **`refactor: repositories return domain results instead of Response`.** Section 3, one domain per PR.
7. **`docs: update README and AGENTS.md`.** Section 5.
