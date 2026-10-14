# Tasks

## 1. Storage location and dev seed files

- [x] 1.1 Add `partyhub.media.upload-dir` (default `uploads/media`, dev `dev-uploads/media`, prod `/app/uploads/media`) and change dev `partyhub.profile-picture.upload-dir` to `dev-uploads/profiles` in `application.properties`. Verify with `./mvnw compile`.
- [x] 1.2 `git mv src/main/resources/uploads` to `dev-uploads/`. Rename the profile files to the seed's `profile_N.*` names and the gallery files to match the seed `media.file` values. Update the seed's `media.file` values to the `partyN/<file>` format. Verify by starting dev mode: the Flyway/afterMigrate log has no errors, and every seeded `media.file` and `profile_picture.picture_name` exists under `dev-uploads/` (check with a small `ls` loop). **Done:** all 16 seeded references exist. The only real gallery image was WebP content named `.jpg` (four identical copies), so the seed now uses `partyN/demo.webp` for the six seeded parties. `dev-uploads/.gitignore` tracks only the seed files.
- [x] 1.3 Remove `LEGACY_UPLOAD_DIR` from `UserResource` and the `uploads/profiles` lines from `Dockerfile` and `.dockerignore`. Verify that `./mvnw clean test` passes and that `unzip -l target/*-runner.jar` (or `target/quarkus-app`) contains no `uploads/`. **Done:** 278 tests pass, the app jar has 0 `uploads/` entries and is 916 KB. The Dockerfile copy did reach production (see 5.2: the live pod has no volume at `/app/uploads`), but production's `profile_picture` rows name `profile_N.*` while the copied files are `pp_N.*`, so no avatar was ever served from it. Removing it changes nothing visible.

## 2. Upload

- [x] 2.1 Create `media/FileUploadInput` with `@NotNull`/`@Size(min=1,max=20)` and messages. Use `@Valid FileUploadInput` in `PartyResource.upload`. Add tests: a request with no `file` part → 400 and no `media` rows. Verify with `./mvnw test -Dtest=PartyResourceTest`.
- [x] 2.2 Add the Viewer check with `getPartyByIdIfVisible` (404 when not visible) before any validation side effects. Add tests: anonymous → 401; authenticated non-viewer of a private party → 404 and no rows or files; joined attendee of a private party → 200.
- [x] 2.3 Rewrite `MediaRepository.upload` as two passes: magic-byte sniffing, empty/size checks, then UUID-named moves into `<upload-dir>/party{id}/`, then persist; clean up moved files on failure. Add tests: PNG renamed `.jpg` with a `text/plain` content type is accepted as PNG; a text file named `.jpg` → 400; 5 MiB + 1 byte → 400; one valid and one invalid file in the same request → 400 with zero rows and zero files; client name `../../evil.jpg` gets stored under a UUID inside `party{id}/`; a move failure (read-only directory) → 500 with zero rows. Verify with `./mvnw test -Dtest=MediaRepositoryTest,PartyResourceTest`. **Done:** the HTTP cases for 2.1–3.2 live in a new `MediaResourceTest` (23 tests; they need committed host/invitee/attendee/stranger fixtures with Keycloak subjects), and the repository cases in `MediaRepositoryTest` (11 tests). Upload now returns the created `MediaDto`s instead of an empty body.

## 3. Serving and lists

- [x] 3.1 Add `MediaResource` `GET /api/media/{id}`: Viewer check, path containment check, detected content type, `X-Content-Type-Options: nosniff`. Delete `getMediaById`/`getImgByMediaId`. Add tests: anonymous on a public party → 200 with bytes; anonymous on a private party → 404; pending invitee, joined attendee and host on a private party → 200; unrelated user → 404; row without a file → 404. Verify with `./mvnw test -Dtest=MediaResourceTest`.
- [x] 3.2 Filter `GET /api/parties/{id}/media` and `GET /api/users/{id}/media` by visibility, and drop the storage reference `url` from `MediaDto` (the spec says clients display media from returned identities and no filesystem path is exposed; no client reads `url`). Add tests: the private-party list returns 404 for anonymous and unrelated users; the user-media list omits private-party items for an unrelated caller. Verify with `./mvnw test -Dtest=PartyResourceTest,UserResourceTest`.
- [x] 3.3 Update `api/*.http` for upload, `/api/media/{id}` and the list cases. Verify with `cd api && npm test` (or `./run-http-tests.sh`).

## 4. Web gallery

- [x] 4.1 `gallery.js`: load images through `apiCall` into blob URLs, and revoke them on re-render or modal close. Verify in the browser, logged in as a joined attendee of a private seeded party: images render and the network tab shows 200 on `/api/media/{id}`. Upload a photo and confirm it appears after refresh. If Claude in Chrome isn't connected, say the visual check was skipped. **Done:** `node --check` passes. Visual check skipped (Claude in Chrome not connected). The upload/refresh flow is covered by `api/media.http` and the real-login check in 5.1. The web gallery has no upload control yet (the spec lists it as target behaviour).

## 5. Integration

- [x] 5.1 Run `./mvnw clean test` (record count and failures) and the full HTTP tests. Do a real Keycloak PKCE login as a demo user, upload one image and fetch it back through `/api/media/{id}`.
- [x] 5.2 Only after asking the user: read-only checks of production `profile_picture`/`media` row counts and `kubectl exec ... ls /app/uploads/profiles`. Report which rows have no backing file. No writes.
- [x] 5.3 Update `docs/cleanup-audit.md` (1.4 and the `uploads/` row in section 2) and mark G036, G037 and G058 in `docs/openspec-baseline/gaps.md` as addressed by this change, with the PR link.

### 5.2 result (read-only, 2026-10-14, with the user's OK)

- **No persistent volume in production.** Deployment `quarkus` has no volumes; PVC `profile-uploads-pvc` doesn't exist (only `postgres-pvc`). The live spec was last applied from an older manifest (image `:latest`, no volume). The deploy workflow's last run was 2026-06-24, so `k8s/quarkus.yaml` hasn't been applied since. `/app/uploads` is the container filesystem, and uploads are lost on every pod restart. This breaks the `deployment-environment` requirement, but this change didn't cause it and doesn't fix it.
- `/app/uploads/profiles` holds the image-copied `pp_1..pp_10`. No `media/` directory exists.
- `profile_picture`: 10 seed rows naming `profile_N.*`; none matches a file, so everyone gets the default avatar.
- `media`: 6 seed rows with `/uploads/partyN/...` paths; no backing files. With this change they return 404 (absolute paths fail the containment check).
- No user-uploaded files exist yet, so nothing has been lost so far.

