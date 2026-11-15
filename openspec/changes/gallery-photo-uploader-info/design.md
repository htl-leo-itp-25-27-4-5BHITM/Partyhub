# Design

## Context

`media` has only `id`, `party_id`, `user_id` and `file`; nothing records when a row was created. `user_id` is nullable. `MediaDto` is built in one place, `MediaRepository` (the `canDelete` mapping), and is used by both `GET /api/parties/{id}/media` and `GET /api/users/{id}/media`. Profiles are linked elsewhere in the browser as `/profile/profile.html?handle=<distinctName>`. The image-sizing part of the change is already implemented in `gallery.css` on this branch.

## Goals / Non-Goals

**Goals:**
- One additive column and additive DTO fields; no change to existing fields or endpoints.
- Uploader data travels with the listing, so opening a photo needs no extra request.

**Non-Goals:**
- Backfilling upload times for existing rows (the real time is unknown, and inventing one would be wrong).
- Profile pictures of the uploader in the viewer, user-written captions, or EXIF "taken at" dates.
- iOS client changes.

## Decisions

- **Nullable `uploaded_at timestamp(6) without time zone`, set in Java on `new Media(...)`.** This matches the existing `created_at` columns in V1. Alternative: `NOT NULL DEFAULT now()` would stamp every old row with the migration time, which would show a false date. Setting the value in the entity constructor used by upload keeps the time in one place; the column has no DB default.
- **Flat DTO fields** `uploaderId`, `uploaderHandle`, `uploaderDisplayName`, `uploadedAt` (ISO-8601 `LocalDateTime`, serialized like other timestamps in the API). Alternative: a nested `uploader` object, but the repo's DTOs are flat records and the browser needs only three values. All four are `null` when unknown.
- **Uploader is shown to anyone who can view the party, including anonymous visitors of public parties.** Display names and handles are already public on profiles and party attendee lists, and the existing Viewer boundary already hides items (and therefore uploaders) from callers who cannot view the party.
- **Date formatting in the browser** with `Intl.DateTimeFormat("de-AT")` like the rest of the frontend, in the viewer's time zone, e.g. "15. Nov. 2026, 21:40". The server sends the local `LocalDateTime` it stores, like other timestamps in the API.
- **Display name via `textContent`, profile link via `encodeURIComponent(handle)`**, never `innerHTML`, so a display name cannot inject markup.
- **Details caption below the photo inside `.modal-content`.** The image is limited to `85vh`, which leaves room for a one-line caption plus the controls above it.

## Risks / Trade-offs

- [Existing photos show no date] → Accepted and specified; the caption simply omits it.
- [Extra join to `user` per listing] → `Media.user` is already loaded for `canDelete`, so there is no extra query in practice; galleries are small.
- [Server and browser time zones differ] → Same behaviour as the rest of the API's `LocalDateTime` fields; out of scope here.

## Migration Plan

`V5__media_uploaded_at.sql` runs automatically on deploy. It only adds a nullable column, so it's safe on the persistent school-cloud database. Rollback means deploying the previous image; the extra column is ignored by old code.
