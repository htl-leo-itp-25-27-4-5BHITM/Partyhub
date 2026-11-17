# Tasks

## 1. Database

- [x] 1.1 Add `src/main/resources/db/migration/V5__media_uploaded_at.sql` adding nullable `uploaded_at timestamp(6) without time zone` to `media`; verify `./mvnw clean test` starts with the migration applied
- [x] 1.2 Give the dev seed media rows in `db/dev-seed/afterMigrate.sql` an `uploaded_at` value (leave one row NULL to show the "no date" case); verify the seed runs on `quarkus:dev` startup

## 2. Backend

- [x] 2.1 Add `uploadedAt` to `Media`, set to the current time in the `Media(party, user, file)` constructor used by upload; verify a new `MediaRepositoryTest` case that an uploaded item has an upload time
- [x] 2.2 Extend `MediaDto` with `uploaderId`, `uploaderHandle`, `uploaderDisplayName`, `uploadedAt` (all null when unknown) and fill them in the single `MediaRepository` mapping; verify `MediaRepositoryTest`/`MediaResourceTest` cases: new upload reports uploader and time, item with NULL `uploaded_at` reports no time, item with no uploader reports no uploader, anonymous viewer of a public party sees the same fields

## 3. Browser photo viewer

- [x] 3.1 Add a details caption (uploader link + date) inside `.modal-content` (the viewer markup is built in `setupModal` in `gallery.js`) and style it in `gallery.css` with the existing tokens; verify layout at phone width and desktop
- [x] 3.2 Fill the caption in `showModalImage` in `gallery.js`: display name via `textContent`, link `/profile/profile.html?handle=<encoded handle>`, date via `Intl.DateTimeFormat`, no date when `uploadedAt` is null, "Unknown user" without link when there is no uploader; verify in the browser on open and when navigating prev/next
- [x] 3.3 Confirm the image sizing fix (photo limited to `90vw`/`85vh`, `display: block`) with a tall portrait photo on phone width and desktop; verify the whole photo, caption and close button are visible

## 4. Contract and verification

- [x] 4.1 Update `api/media.http` and the `MediaDto` field list in `docs/openspec-baseline/api-contract-matrix.md` (rows 26, 29, 57); run `./run-http-tests.sh` (or `api/media.http`) and verify it passes
- [x] 4.2 Run `./mvnw clean test` and verify all tests pass
- [x] 4.3 Log in through real Keycloak (demo users: password = username), open photos on a public and a private party, and verify the spec scenarios hold
- [x] 4.4 Run `openspec validate gallery-photo-uploader-info --strict` and verify it passes
