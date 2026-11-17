# Proposal

## Why

When a guest opens a photo in the party gallery, nothing says who took it or when. Since any party viewer can now upload, people want to know whose photo they are looking at and get to that person's profile. Separately, the photo viewer currently renders tall images at their full size, so they overflow the screen.

## What Changes

- Store an upload time for every new gallery item. Items uploaded before this change have no known upload time.
- Each item in the party media list and the user media projection reports its uploader (id, handle, display name) and its upload time when known.
- The browser photo viewer shows the uploader's display name, linking to their profile, and the upload date and time below the photo. If the upload time is unknown, only the uploader is shown; if the uploader account no longer exists, the viewer shows "Unknown user" without a link.
- The browser photo viewer always fits the photo inside the screen while keeping its aspect ratio.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `party-media-gallery`: media listings report uploader and upload time; the browser photo viewer shows them and fits the photo to the screen.

## Impact

- **Database:** new Flyway migration `V5__media_uploaded_at.sql` adds a nullable `uploaded_at` column to `media`. No backfill, no data deletion.
- **Backend:** `Media` gets `uploadedAt`, set on upload; `MediaDto` gets `uploaderId`, `uploaderHandle`, `uploaderDisplayName`, `uploadedAt`. Additive JSON fields, so existing clients keep working.
- **Frontend:** `gallery/gallery.html`, `gallery/gallery.css`, `gallery/gallery.js`.
- **Tests/contract:** `MediaRepositoryTest`, `MediaResourceTest`, `api/media.http`, `docs/openspec-baseline/api-contract-matrix.md` if it lists `MediaDto` fields.
- **Seed:** dev seed media rows may get an `uploaded_at` value so the viewer shows dates locally.
