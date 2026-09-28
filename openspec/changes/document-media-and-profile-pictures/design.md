# Design

## Context

See [proposal.md](proposal.md) for motivation. The accepted D009 contract permits party Viewers to upload at any time, while D001/D015 require authenticated identity for protected mutations and profile/social reads. Current source is inconsistent with those floors: gallery list and user-media routes are open, the browser references an unexposed `/api/media/{id}` resource, upload lacks a Viewer check, profile reads are open, and profile replacement removes metadata before validating or storing the new file.

Browser gallery UI reads the backend list but has no upload control. iOS party-photo surfaces store device-local files and do not call the backend gallery. Browser and iOS profile surfaces both upload self pictures, but only the browser prechecks a broad image type and 5 MiB limit; the profile backend performs no equivalent content/size validation. No party-media or profile-picture deletion endpoint or accepted physical-retention policy was found.

This change is documentation/specification work only. Application repairs, storage migration and runtime verification require later bounded implementation changes.

## Goals / Non-Goals

**Goals:**

- Preserve D007/D009 party visibility for gallery lists, item serving and user-media projections.
- Resolve Q005 consistently with the accepted token-derived mutation identity.
- Define one observable image type/size boundary for gallery and profile-picture uploads.
- Distinguish shared server media from iOS local-only photo state without requiring UI parity.
- Add an atomic logical replacement contract for profile pictures and failure consistency for uploads.
- Leave exact physical deletion/retention and response-envelope policy visible for Step 11 rather than silently choosing it.

**Non-Goals:**

- Implement endpoints, clients, file moves, cleanup, migrations or tests.
- Require the browser and iOS client to expose identical gallery controls.
- Turn local iOS photos into server media by documentation alone.
- Add gallery-item deletion, profile-picture removal, retention duration or orphan-cleanup behavior without an accepted Step 11 decision.
- Change AUTH-01-AUTH-12, PARTY-01-PARTY-16, existing SOC-01-SOC-06, RADIUS-01-RADIUS-03, or the radius Purpose.

## Decisions

### 1. Reuse the existing media and social capabilities

Party-gallery behavior remains in `party-media-gallery`; profile pictures remain in `social-and-notifications` because SOC-05 already makes a picture reference/placeholder part of the bounded profile projection and SOC-06 owns self editing. A separate image capability would split one profile contract and duplicate authorization vocabulary.

Alternative considered: place every image rule in `party-media-gallery`. Rejected because a self-managed profile picture is not party media and follows profile audience/ownership rules.

### 2. Apply the party Viewer predicate to every media projection and item

A public party remains anonymously viewable, including its gallery. Private list, individual item and user-media projection paths reuse PARTY-04/PARTY-14 Viewer eligibility. A media identifier or uploader query never bypasses its owning party.

Alternative considered: authorize only the gallery list and make individual files public. Rejected because an item URL would become a stable private-party bypass.

### 3. Require authentication for gallery upload

Q005 is answered prospectively by combining D009 with D001 and the archived authentication migration: viewing a public gallery may be anonymous, while upload is a token-derived mutation by an authenticated PartyHub user who also qualifies as a party Viewer. This keeps upload-at-any-time intent and prevents a public party from becoming anonymous write access.

Alternative considered: interpret “any viewer” as anonymous upload permission. Rejected because it conflicts with the accepted protected media mutation path and provides no trustworthy uploader identity.

### 4. Use one bounded upload validation rule

The proposal adopts the source-established gallery boundary for both image domains: non-empty JPEG, PNG, GIF or WebP content, at most 5 MiB. Validation concerns actual content/media type rather than filename extension, and the server owns the storage reference. The default SVG is a trusted application placeholder, not an allowed user-upload type.

Alternative considered: retain the browser's `image/*` check and leave profile backend validation unspecified. Rejected because clients are not an authorization/validation boundary and the result would differ by caller.

### 5. Keep logical consistency separate from physical retention

A gallery upload does not expose metadata for a file that failed to persist. Profile replacement preserves the prior usable logical picture on failure and exposes exactly one current reference after success. Whether superseded files, party media or account data are physically deleted and for how long remains Q006/Step 11.

Alternative considered: add deletion endpoints and immediate file cleanup requirements now. Rejected because no accepted deletion/retention authority exists and Group 7 may not invent one.

### 6. Treat client support as evidence, not implicit parity

A client claiming shared gallery support reads/writes server state. Browser grid/modal behavior is server-backed but read-only; iOS party-photo code is local-only. The contract labels local files honestly and permits platform-specific UI while preserving the server upload target. Both profile clients already have self-upload entry points, but their conformance remains unverified.

Alternative considered: require both clients to implement the same gallery UI. Rejected because prior cross-client decisions permit different controls and the evidence does not establish that parity as accepted scope.

## Risks / Trade-offs

- **[Authenticated profile-picture reads break current direct image URLs]** → Record the browser/iOS bearer-delivery mismatch as an implementation gap; future clients can fetch authenticated bytes and render object/native images without weakening D015.
- **[Five MiB and the type allowlist may reject files previously accepted by the profile endpoint]** → Treat this as a proposed observable boundary requiring explicit apply review before it becomes accepted.
- **[Logical replacement does not settle orphaned files]** → Keep physical cleanup and retention under Q006/Step 11 and inventory the affected storage paths.
- **[No current `/api/media/{id}` resource exists]** → Keep the missing serving surface as a bounded implementation gap; the specification states behavior, not a guessed route migration.
- **[Source tests use bypass identity and were not run]** → Report only assertion presence and keep runtime conformance unverified.

## Migration Plan

1. Review the complete media modifications and new profile-picture requirement against D001/D007/D009/D015/D017 and access rows 26, 29, 45-47 and 57.
2. In a later explicit apply task, sync the two deltas into their existing main capabilities and update stable coverage/decision/gap records.
3. Implement backend authorization, serving, validation and consistency in separate application changes, followed by browser/iOS client alignment and meaningful authorization/upload/error tests.
4. Resolve physical retention, deletion, storage-root and exact API compatibility in Step 11 before final acceptance.
