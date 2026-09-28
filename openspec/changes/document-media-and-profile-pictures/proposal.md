# Proposal

## Why

PartyHub's accepted gallery rule does not yet define complete access, serving, validation, storage-error, or client-state boundaries, and profile-picture behavior has no durable requirement beyond a projection reference. The current source also exposes open media/profile-picture reads, omits a REST resource used by the browser gallery, applies inconsistent upload validation, and mixes server-backed media with iOS local-only photos.

## What Changes

- Make party-gallery list, item serving, user-media projections, empty/error states, and private-party access follow the accepted party Viewer predicate.
- Resolve Q005 by requiring authenticated PartyHub identity for gallery upload while retaining anonymous viewing of public-party galleries and upload-at-any-time behavior for authenticated Viewers.
- Define a shared upload boundary for non-empty JPEG, PNG, GIF, or WebP images up to 5 MiB, safe server-owned storage references, and failure behavior that does not create a usable media record for an unstored file.
- Require any client that presents shared party-gallery content to use the server-backed gallery; local device photos remain local unless explicitly synchronized through that contract. This records current browser/iOS support without requiring identical UI controls.
- Add profile-picture viewing, placeholder, self-upload, validation, logical replacement, refresh, and failure-preservation behavior under the existing profile/social capability.
- Keep physical retention, orphan cleanup, explicit gallery/profile-picture deletion, and exact response-envelope details assigned to Step 11/Q006 rather than inventing a deletion or retention policy.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `party-media-gallery`: Reconcile party-media access, serving, upload validation, server-backed client behavior, projection boundaries, and storage/error states.
- `social-and-notifications`: Add the bounded profile-picture contract that complements the existing audience-specific profile projection and self-edit rules.

## Impact

- Main-spec targets: `openspec/specs/party-media-gallery/spec.md` and `openspec/specs/social-and-notifications/spec.md` after a later explicit apply/sync task.
- Evidence and later implementation areas: `MediaRepository`, party/user media endpoints, `UserResource` profile-picture paths, browser gallery/profile-edit pages, iOS gallery/profile-image surfaces, and their tests/HTTPYac requests.
- No application code, upload files, database rows, runtime configuration, dependency, or deployed service changes are part of this documentation proposal.
