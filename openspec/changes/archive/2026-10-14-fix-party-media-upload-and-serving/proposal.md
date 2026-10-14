# Proposal

## Why

The party gallery doesn't meet the accepted `party-media-gallery` requirements (baseline gaps G036, G037 and G058, audit item 1.4).

- Upload doesn't check that the caller can view the party.
- Upload trusts the client's declared content type.
- Upload persists metadata before the file is stored, and a multi-file upload can leave earlier files stored when a later one is rejected.
- Upload writes into `src/main/resources/uploads/`, which in the container is outside the persistent `/app/uploads` volume, so the files are lost on every pod restart.
- No route serves the bytes: the browser requests `/api/media/{id}`, which doesn't exist.
- The media list endpoints apply no visibility check, so private-party media is listed to anyone.

## What Changes

- Upload: `@Valid` form input moved to `media/`, Viewer check via the shared party visibility rule, server-side image sniffing (magic bytes) instead of the declared content type, every file validated before any side effect, and file stored before the media row is committed (with cleanup on failure).
- Storage: gallery files go to a configurable directory `partyhub.media.upload-dir` (prod `/app/uploads/media` on the existing PVC), with a server-generated file name.
- New `GET /api/media/{id}` serves the bytes behind the same Viewer check (anonymous allowed for public parties). The two unused byte helpers in `MediaRepository` are removed.
- `GET /api/parties/{id}/media` and `GET /api/users/{id}/media` only return items from parties the caller can view.
- Web gallery loads images with the access token (fetch → blob URL), so private-party images work.
- `src/main/resources/uploads/` is removed from the jar. The dev seed's media and profile-picture references point to files that are copied into the dev upload directory, so the seed images exist locally.

## Capabilities

### New Capabilities

### Modified Capabilities

None. This change implements requirements that are already accepted in `openspec/specs/party-media-gallery/spec.md` ("Party gallery uploads are available to party viewers", the Viewer boundary requirement) and doesn't change them. `.openspec.yaml` sets `skip_specs: true`.

## Impact

- Code: `PartyResource.upload`, `MediaRepository`, new `media/FileUploadInput`, new `media/MediaResource`, `UserResource.getUserMedia`, `UserResource` profile-picture legacy fallback.
- Config: `application.properties` (`partyhub.media.upload-dir`), `Dockerfile`, `.dockerignore`.
- Frontend: `gallery/gallery.js`.
- Seed: `db/dev-seed/afterMigrate.sql` file references; dev seed images move to a dev-only folder.
- Production: existing gallery rows point to files that were already lost on restart; they will return 404 instead of a broken image. No schema change.
- Tests: `MediaRepositoryTest`, `PartyResourceTest`, `UserResourceTest`, `api/*.http`.
