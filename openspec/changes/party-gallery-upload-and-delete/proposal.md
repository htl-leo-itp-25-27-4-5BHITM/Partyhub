# Proposal

## Why

The backend for viewing and uploading gallery images is in place (Viewer boundary, content-based type detection, persistent storage), but the browser gallery is still read-only. Users have no way to add the photos they took at a party, and no way to remove a photo they uploaded by mistake. This change adds the upload UI the `party-media-gallery` spec already names as target behaviour, and adds photo deletion, which the spec does not cover yet.

## What Changes

- Browser gallery: an "Add photos" control for logged-in users who can view the party. It supports multi-file selection, client-side pre-checks (type, 5 MiB, at most 20 files), "n of m" progress, per-file error feedback, and a gallery refresh afterwards.
- Production uploads above 1 MiB currently fail at the ingress (nginx default body limit). The ingress limit is raised so 5 MiB photos get through. Anonymous visitors see a prompt to log in instead.
- **New:** an authenticated user can delete a gallery photo when they uploaded it or host its party. Deletion removes the media record and its stored file. Nobody else can delete it, and a refused delete reveals nothing about a private party's media.
- Media list items tell the caller whether they may delete that item, so the browser shows a delete control (in the grid and the modal, with confirmation) only to those users.
- The party details page loads the photo count with the caller's credentials, so private parties show their real count.
- iOS is out of scope.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `party-media-gallery`: adds deleting a gallery item by its uploader or the party host, and makes the browser upload flow accepted behaviour instead of future target.

## Impact

- Backend: `at.htl.media` (`MediaRepository`, `MediaDto`, `MediaResource`: new `DELETE /api/media/{id}`), `PartyResource.getPartyMedia` (passes the caller so items carry a delete flag).
- API: `MediaDto` gains a `canDelete` boolean (additive). New endpoint `DELETE /api/media/{id}`.
- Browser: `gallery/gallery.{html,js,css}`, the media count in `advancedPartyInfos/advancedPartyInfos.js`.
- Tests: `MediaResourceTest` (delete cases, `canDelete` flag), `api/media.http`.
- Deployment: `k8s/ingress.yaml` gets a `proxy-body-size` annotation, because the nginx default of 1 MiB blocks normal phone photos. No schema migration. The stored file is deleted from the existing upload directory (`/app/uploads/media` in production).
