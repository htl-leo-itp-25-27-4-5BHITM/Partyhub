# Design

## Context

- `UserLocation` has its own identity `id` and a `@OneToOne user_id` column. `UserResource.getUserLocation` and `updateUserLocation` call `em.find(UserLocation.class, userId)`, which looks up the location's `id`, not `user_id`. `UserLocationRepository.findByUserId` already does the correct lookup and isn't used here.
- `user_location.user_id` has no unique constraint in `V1__baseline.sql`, so duplicate rows per user are possible.
- `GET /api/parties/{id}/locations` and `GET /api/users/location/{id}` have no `@Authenticated`, and `application.properties` has no HTTP permission policy, so both are public.
- Clients read `latitude`, `longitude`, `user.id`, `user.displayName` and `user.distinctName` (web `index.js:72`, iOS `UserLocationViewModel`). Neither client calls the single-user GET today. The web own-location fetch at `index.js:396` uses a wrong path and only runs when `USE_FAKE_LOCATION` is false. On `main` it is `true` (`index.js:27`), so the bug is currently dormant.
- `PartyRepository.getPartyByIdIfVisible(partyId, userId)` is the existing visibility check.

## Goals / Non-Goals

**Goals:**
- Close the anonymous read and the internal-field leak without changing the JSON shape the clients parse.
- Make location reads and writes key on `user_id`.

**Non-Goals:**
- No unique constraint migration on `user_location.user_id`. Existing duplicates would make it fail; that needs a read-only production check first and is a follow-up.
- No change to `USE_FAKE_LOCATION` or to the iOS map radius behaviour.
- No change to who appears in the attendee list (still the party's joined users).

## Decisions

- **Projection record `UserLocationDto(double latitude, double longitude, LocatedUser user)`** with nested `LocatedUser(Long id, String displayName, String distinctName)`. It keeps the client shape as-is. Today, internal fields are hidden only because of `@JsonIgnore` on `User` getters, so every new `User` field is a potential leak. A projection doesn't depend on that.
- **Single-user GET is self-only.** If the path ID isn't the caller's ID, it returns 403. This follows the spec's rule that a path identifier isn't authority. It keeps the existing route `/api/users/location/{id}` so the web fix only touches the path. Alternative: add `/api/users/location/me`. That's cleaner, but it adds a route without removing one.
- **Party locations reuse `getPartyByIdIfVisible`.** If it returns null, the endpoint returns 404, the same as for a missing party, so the response doesn't reveal that a private party exists.
- **PUT uses `findByUserId`.** If several rows already exist, it updates the first one. Cleaning up duplicates is left to the follow-up above.
- **Clients:** web uses `window.authService.apiCall` (already used by `editProfile.js`). iOS copies the `validAccessToken()` pattern from `uploadUserLocation` in the same file.

## Risks / Trade-offs

- [Older iOS builds send no token → attendee locations disappear] → acceptable. The data was leaking, and the feature isn't core per the existing requirement "Core party discovery excludes live location features".
- [The iOS change can't be compiled in this environment] → if Xcode is available, run `xcodebuild` for the PartyHubiOS scheme. If not, state in the PR that the Swift change is unbuilt and needs a check on a Mac with Xcode.
- [Duplicate rows already in production] → the read path uses the first match, so nothing breaks. A read-only count is listed in tasks as optional and needs the user's OK.

## Migration Plan

Deploy backend and web together (same jar). Ship the iOS change in the next app build. To roll back, revert the PR; there is no schema change.
