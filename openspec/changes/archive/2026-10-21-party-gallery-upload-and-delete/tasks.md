# Tasks

## 1. Backend: delete permission and listing flag

- [x] 1.1 Add `canDelete` to `MediaDto` and a shared `MediaRepository.canDelete(Media, Long callerId)` (uploader or party host, false for anonymous); verify `./mvnw clean test` still passes
- [x] 1.2 Pass the caller id into `getMediaByParty` (from `PartyResource.getPartyMedia`) and `getVisibleMediaByUser` (from `UserResource.getUserMedia`) so every DTO carries `canDelete`; verify with new `MediaResourceTest` cases: uploader sees own item deletable, host sees all deletable, other viewer and anonymous see none
- [x] 1.3 Add `MediaRepository.delete(long mediaId, long callerId)`: not visible → 404, not permitted → 403, otherwise remove the row, flush, and delete the file after commit (JTA synchronization, `deleteIfExists`, log failures); verify file and row are gone in tests
- [x] 1.4 Add `DELETE /api/media/{id}` to `MediaResource` with `@Authenticated` and `@Transactional`, returning 204; verify `MediaResourceTest` cases: uploader 204, host 204, other viewer 403 with row and file kept, anonymous 401, non-viewer of private party 404, unknown id 404, missing backing file still 204

## 2. Deployment

- [x] 2.1 Add `nginx.ingress.kubernetes.io/proxy-body-size: "8m"` to `k8s/ingress.yaml`; verify `kubectl apply --dry-run=client -f k8s/ingress.yaml` accepts it

## 3. Browser: upload

- [x] 3.1 Add the "Add photos" button, hidden file input (`accept` JPEG/PNG/GIF/WebP, `multiple`), login prompt for anonymous visitors and a status line to `gallery.html`/`gallery.css` using the existing tokens; verify layout at phone width and desktop
- [x] 3.2 Implement pre-checks (type, ≤ 5 MiB, ≤ 20 files) and sequential one-file-per-request uploads with "Uploading n of m…", per-file error list and one gallery reload in `gallery.js`; verify in the browser with a valid photo, a > 5 MiB file, a renamed non-image and a mixed selection

## 4. Browser: delete

- [x] 4.1 Render a delete button on tiles and in the modal only when `media.canDelete`, with `window.confirm`, `DELETE /api/media/{id}`, reload on success and an error message on failure; verify as uploader, as host, and as another viewer (no button)

## 5. Party details photo count

- [x] 5.1 Load the media count in `advancedPartyInfos.js` through `authService.apiCall` with `authRequired: false`; verify a private party shows its real count for its host

## 6. Verification

- [x] 6.1 Extend `api/media.http` with the delete endpoint and the `canDelete` field; run `./run-http-tests.sh` (or `api/media.http`) and verify it passes
- [x] 6.2 Run `./mvnw clean test` and verify all tests pass
- [x] 6.3 Log in through real Keycloak (demo users: password = username) and walk through upload, view, delete and the forbidden case on a public and a private party; verify the spec scenarios hold
- [x] 6.4 Run `openspec validate party-gallery-upload-and-delete --strict` and verify it passes
