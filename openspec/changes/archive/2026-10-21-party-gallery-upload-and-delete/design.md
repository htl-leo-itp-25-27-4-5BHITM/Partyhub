# Design

## Context

`main` already serves gallery images through `GET /api/media/{id}`. Party visibility is enforced in `MediaRepository` with a JPQL visibility predicate, uploads are validated from their leading bytes (`ImageType`), and files are stored under `partyhub.media.upload-dir` (`dev-uploads/media` in dev, `/app/uploads/media` on the persistent volume in production) with server-generated names. `MediaDto` is `(id, partyId)`. The browser gallery fetches each image with `authService.apiCall` and shows it through an object URL. It has no upload or delete controls. The `media` table has `party_id`, `user_id` and `file`. The uploader is `user_id`.

## Goals / Non-Goals

**Goals:**
- Delete endpoint with the uploader-or-host rule and file cleanup that never leaves a listed item without its file.
- Per-item `canDelete` so the browser doesn't have to duplicate the permission rule.
- Upload and delete UI in the existing gallery page style.

**Non-Goals:**
- Soft delete, undo or audit trail.
- Upload progress percentages (the Fetch API has no upload progress; an indeterminate "Uploading…" state is enough).
- Image resizing or thumbnails.
- iOS.

## Decisions

### `DELETE /api/media/{id}` on `MediaResource`, `@Authenticated` + `@Transactional`
Lives next to `GET /api/media/{id}` because both act on one media item. Flow: load the item with the existing `findVisibleMedia(id, callerId)`. If it's empty, return 404, which matches how the GET hides private items. If the caller is neither the uploader nor the party host, return 403. A viewer who can already see the item learns nothing new from a 403. Otherwise remove the row, flush, and return 204.
- *Alternative:* `DELETE /api/parties/{partyId}/media/{id}`. Rejected: redundant party id, and a mismatch between the party id and the item's party would need extra handling.

### File is deleted after the row commits
The row is removed and flushed inside the transaction. The file is removed after commit through a JTA `Synchronization` (`TransactionSynchronizationRegistry.registerInterposedSynchronization`, acting on `afterCompletion(STATUS_COMMITTED)`). If the transaction rolls back, the file stays and the item stays fully valid. If the file deletion fails after commit, we only log it: an orphan file is never listed or served, so it is harmless. A missing file is fine (`deleteIfExists`).
- *Alternative:* delete the file before the commit. Rejected: a rollback would leave a listed item without its image, which the spec forbids.

### `MediaDto(id, partyId, canDelete)`
`getMediaByParty` and `getVisibleMediaByUser` take the caller id and compute `canDelete = caller != null && (caller == uploader || caller == host)`, in one shared helper that the delete endpoint also uses. This is an additive JSON field; existing consumers ignore it.

### Browser upload flow
- Header button "Add photos" opens a hidden `<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple>`. It shows when `authService.isLoggedIn()`. Anonymous users see "Log in to add photos", which calls `authService.login()` with a redirect back to the gallery.
- Pre-checks before sending: type from `file.type`, size ≤ 5 MiB, count ≤ 20. Errors are shown in one status line under the header, so no new modal.
- Upload sends **one request per file**, one after another, as `FormData` with a single `file` part through `authService.apiCall` (which already leaves the multipart content type to the browser). While it runs, the button is disabled and shows "Uploading 3 of 7…". Afterwards the gallery reloads once and a status line names each file that failed, with the server's `error` message.
- *Why per file instead of one multipart request:* every request stays ≤ 5 MiB plus overhead, under both Quarkus' default 10 MiB body limit and the ingress limit; the browser gets real progress; and one bad file doesn't cancel the others. The server keeps its all-or-nothing behaviour per request, so the multi-file endpoint contract is unchanged for other clients.
- *Alternative:* one request with up to 20 files. Rejected: it can reach 100 MiB, which would need large body limits on both Quarkus and nginx, and it gives no progress.

### Ingress body size
The nginx ingress uses the controller default `proxy-body-size` of 1 MiB, so typical phone photos are rejected with 413 before they reach Quarkus. Add `nginx.ingress.kubernetes.io/proxy-body-size: "8m"` to `k8s/ingress.yaml`: a 5 MiB file plus multipart overhead, with room to spare, but not unlimited.

### Browser delete flow
Items with `canDelete` get a small trash button in the corner of the tile (always visible on touch, shown on hover/focus on desktop) and in the modal toolbar. Confirmation uses `window.confirm`. On 204 the gallery reloads (closing the modal if it's open). On error a status message shows and the item stays.

## Risks / Trade-offs

- [Orphan file if post-commit delete fails] → logged; it can't be listed or served. Acceptable.
- [`window.confirm` looks plain] → consistent with existing pages; a custom dialog can come later without changing the spec.
- [Partial batch result: some files uploaded, some not] → the status line names every failed file; the gallery always shows what the server actually stored.
- [Ingress annotation is not supported or overridden by the school cluster's controller] → verify after deploy by uploading a photo larger than 1 MiB; if it still returns 413, ask the cluster admins.

## Migration Plan

No schema or data migration. Merging to `main` deploys both the app and the ingress annotation (the pipeline runs `kubectl apply` on `k8s/`). Rollback: revert the commit. Existing items keep working because the new field is additive.
