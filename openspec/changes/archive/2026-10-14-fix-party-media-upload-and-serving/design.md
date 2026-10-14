# Design

## Context

- Requirements: `openspec/specs/party-media-gallery/spec.md`. Gaps: `docs/openspec-baseline/gaps.md` G036, G037, G058.
- `PartyResource.upload` is `@Authenticated @Transactional` and takes `MediaRepository.FileUploadInput` (a nested class with `@FormParam("file") List<FileUpload>`) without `@Valid`.
- `MediaRepository.upload` writes to `src/main/resources/uploads/party{id}/`. `getMediaById` reads the classpath and `getImgByMediaId` reads `src/main/resources/uploads`. Neither is called by any resource.
- Profile pictures already use `partyhub.profile-picture.upload-dir` (prod `/app/uploads/profiles` on PVC `profile-uploads-pvc`) with a legacy fallback to `src/main/resources/uploads/profiles`.
- The seed's media rows use `/uploads/partyN/<name>.jpg`, but only `party2/` files exist. The seed's profile pictures are named `profile_N`, but the files are `pp_N`.
- `PartyRepository.getPartyByIdIfVisible(partyId, userId)` implements the Viewer rule (public, host, pending invitee, joined). `CurrentUserResolver.currentUserIdIfAuthenticated()` supports anonymous callers.
- `gallery.js` sets `<img src="/api/media/{id}">`. An `<img>` tag cannot send a bearer token.

## Goals / Non-Goals

**Goals:** see proposal. Every MEDIA scenario in the spec gets a test.

**Non-Goals:**
- No media delete endpoint or physical retention policy (Q006/G065).
- No iOS gallery changes (G038).
- No migration of lost production files. They can't be recovered.

## Decisions

- **Content check by magic bytes.** Read the first 12 bytes and accept only JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), GIF (`GIF8`) and WebP (`RIFF....WEBP`). The detected type picks the stored extension. No new dependency. Alternative: Apache Tika. That's a heavy dependency for four signatures.
- **Validate everything, then write.** First pass: reject an empty list, an empty file, size > 5 MiB, or an unknown signature, and return 400 with no side effects. Second pass: move each file to `<dir>/party{id}/<uuid>.<ext>`, then persist rows. If a move fails, delete the files already moved in this request and throw, so the transaction rolls back. The stored reference is `party{id}/<uuid>.<ext>`. The client file name isn't used at all (the spec allows a server-owned reference).
- **`@Valid` on the form.** `FileUploadInput` becomes a top-level class in `media/` with `@NotNull(message=...) @Size(min = 1, max = 20, message=...)` on `file`. The max of 20 bounds request work. Byte-level checks stay in code, because Bean Validation can't read `FileUpload` content.
- **New `MediaResource` at `/api/media`.** `GET /{id}` resolves the media row, checks `getPartyByIdIfVisible(media.party.id, callerOrNull)`, and returns 404 for both "not visible" and "missing file". It streams from `<dir>/<reference>`, and the path is normalized and checked to stay inside `<dir>`. No `@Authenticated`, because anonymous users may view public-party media per the spec.
- **List endpoints filter by visibility.** `getMediaByParty` returns 404 when the party isn't visible. `getMediaByUser` joins on party visibility (a JPQL predicate mirroring `getPartyByIdIfVisible`) so it doesn't load all parties.
- **Web gallery uses blob URLs.** `gallery.js` fetches `/api/media/{id}` through `window.authService.apiCall` and sets `img.src = URL.createObjectURL(blob)`. Alternative: cookie or query-token auth. That would weaken the bearer-only model.
- **Dev seed files.** Move `src/main/resources/uploads/` to `dev-uploads/` (repo root, not in the jar), with profile images renamed `profile_N.*` and media renamed to match the seed rows. In dev, `partyhub.media.upload-dir=dev-uploads/media` and `partyhub.profile-picture.upload-dir=dev-uploads/profiles`. Fix the seed `media.file` values to the new reference format (`party1/...`). Remove the `LEGACY_UPLOAD_DIR` fallback and the Dockerfile copy of `uploads/profiles`.

## Risks / Trade-offs

- [Prod profile pictures that only existed in the image's `uploads/profiles` disappear] → before merging, do a read-only listing of the pod's `/app/uploads/profiles` and the `profile_picture` rows, after asking the user. If needed, copy the files onto the PVC with the user's OK. Never delete anything.
- [Removing the legacy fallback breaks a dev setup that still has files in `src/main/resources/uploads/profiles`] → the dev directory moves to `dev-uploads/`, and the change notes it in the PR.
- [Blob URLs leak memory if they are never revoked] → revoke when the grid re-renders or the modal closes.
- [Magic-byte sniffing accepts a polyglot file] → acceptable. Files are served with the detected image type and `X-Content-Type-Options: nosniff`.

## Migration Plan

One PR. After deploying, the PVC gets `/app/uploads/media`, which the app creates on first upload. To roll back, revert. Rows uploaded with the new format would then not be served by the old code, which never served any rows anyway.
