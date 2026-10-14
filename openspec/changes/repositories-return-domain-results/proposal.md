# Proposal

## Why

Audit section 3 found these problems:
- Seven repositories build JAX-RS `Response` objects, often with hand-written JSON strings such as `"{\"error\": \"Party not found\"}"`.
- `UserResource` and `PartyResource` bypass their repositories with direct `EntityManager` calls (14 and 4 uses).
- `PartyRepository` has 915 lines that mix CRUD, attendance, invitations and notification side effects.
- Two packages use snake_case names.

Because HTTP decisions are spread across layers, the security fixes in the other cleanup changes are harder to review, and the same 404 or 403 rule gets implemented several times.

## What Changes

- Repositories return entities, DTOs, `Optional` or a small result type. Resources map these to status codes and JSON error bodies.
- `EntityManager` calls in `UserResource` and `PartyResource` move into repositories.
- Attendance and invitation logic moves out of `PartyRepository` into dedicated classes.
- Rename the packages `user_location` → `userlocation` and `profile_picture` → `profilepicture`.
- No intended behaviour change: same routes, statuses and response bodies. Where an existing error body is a hand-written JSON string, the resource returns the same JSON from a `Map`/record, so the wire output stays the same.

## Capabilities

### New Capabilities

### Modified Capabilities

None. This is a pure refactor. `.openspec.yaml` sets `skip_specs: true`.

## Impact

- Code: every `*Repository` and `*Resource` under `src/main/java/at/htl/`, plus tests that assert on repository `Response` objects (`src/test/java/at/htl/repository/*`).
- Done as **one PR per task group** (one domain each), as the audit recommends. Each PR must pass `./mvnw clean test` and the HTTP tests unchanged.
- Order: after `secure-user-location-endpoints`, `fix-party-media-upload-and-serving` and `consolidate-device-token-endpoint`, because those touch the same classes and are worth more.
