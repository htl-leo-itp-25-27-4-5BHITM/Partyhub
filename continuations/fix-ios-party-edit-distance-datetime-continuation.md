# Continuation: fix-ios-party-edit-distance-datetime

Date: 2026-06-24

## Goal

Start implementation for three PartyHub iOS fixes discovered in explore mode.

Do not restart discovery from scratch. Pick up from the current workspace state and implement the Swift-side fixes. The user reported that backend party update works, but saving edited parties from iOS fails. They also want newly created parties to appear correctly sorted by distance in the party list, and Party Details should show a clear date/time section.

## User-Reported Issues

1. A party can be opened for editing when the current user is the organiser, but tapping Save shows an error.
2. After creating a new party, it should be inserted/sorted directly in the party list by "Distance".
3. Party Details should have a section where the party date and time are shown.

## Important Context

This should be treated as an iOS/Swift implementation task. The backend update endpoint works and is authenticated via Keycloak/JWT.

Relevant backend endpoint:

- `src/main/java/at/htl/party/PartyResource.java`
  - `PUT /api/parties/{id}`
  - annotated with `@Authenticated`
  - resolves the acting user via `CurrentUserResolver.requireCurrentUserId()`

Relevant backend DTO date format:

- `src/main/java/at/htl/party/PartyCreateDto.java`
  - `time_start` and `time_end` use `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")`
  - dates are local-date-time strings without a timezone suffix

## Findings From Explore Mode

### 1. Edit Save Error

Primary likely bug:

- `PartyHubiOS/PartyHubiOS/PartyView/PartyDetailView.swift`
- `updatePartyOnBackend(_:)` builds a `PUT` request but does not set:

```swift
Authorization: Bearer <access token>
```

Create already does this correctly in:

- `PartyHubiOS/PartyHubiOS/PartyView/PartyFormView.swift`
- `sendCreateRequest()`

Because the backend `PUT` endpoint is `@Authenticated`, the update request should use:

```swift
request.setValue("Bearer \(try await KeycloakAuthService.shared.validAccessToken())", forHTTPHeaderField: "Authorization")
```

or the existing `APIClient` with `authType: .bearerToken`, if that fits cleanly.

Secondary edit bug:

- `PartyHubiOS/PartyHubiOS/PartyView/PartyFormView.swift`
- In `save()`, edit mode currently sends the original `party.latitude` and `party.longitude`, not the selected picker coordinates.
- Use the selected coordinates when present, falling back to the existing party/default coordinates.

### 2. New Party Distance Sorting

Relevant file:

- `PartyHubiOS/PartyHubiOS/PartyView/PartyView.swift`

Current shape:

- `sortedParties(userCoord:)` sorts by `drivingDistances` if both parties have a cached driving distance.
- Otherwise it falls back to straight-line `CLLocation.distance(from:)`.
- After `.partyDidUpdate`, the list fetches backend parties:

```swift
.onReceive(NotificationCenter.default.publisher(for: .partyDidUpdate)) { _ in
    Task { await fetchPartiesFromBackend() }
}
```

Problem:

- Fetching new parties does not trigger route distance calculation for the newly inserted party.
- `fetchIfNeeded(userCoord:)` skips work if the user has not moved more than 200m.
- That means a freshly created party may have no `drivingDistances` entry and may not settle into the intended distance order immediately.

Implementation direction:

- After `fetchPartiesFromBackend()` completes, recalculate missing driving distances for the current party set.
- Avoid depending only on user movement to calculate new party distances.
- Consider splitting the distance calculation into a helper like `fetchMissingDrivingDistances(userCoord:force:)` or making `fetchIfNeeded` able to run after backend refresh.
- Clear stale distance entries for party IDs no longer present after backend refresh.
- Keep the existing fallback to straight-line distance so the UI remains stable while routes are loading.

### 3. Party Details Date/Time Section

Relevant files:

- `PartyHubiOS/PartyHubiOS/PartyView/PartyDetailView.swift`
- `PartyHubiOS/PartyHubiOS/PartyView/PartyDetailsSection.swift`
- `PartyHubiOS/PartyHubiOS/PartyView/PartyView.swift`
- `PartyHubiOS/PartyHubiOS/PartyHubiOSApp.swift`

Current state:

- `PartyDetailsSection` already displays `Start` and `End` inside the `Details` section when `party.timeStart` / `party.timeEnd` are non-nil.
- The user wants a distinct sector/section for date and time.

Important parsing issue:

- `PartyView.fetchPartiesFromBackend()` currently parses only ISO8601 internet date strings with optional fractional seconds.
- The backend returns or accepts `yyyy-MM-dd'T'HH:mm:ss` local date-time strings without timezone.
- `PartyHubiOSApp.swift` has a more robust `parseDate(_:)` helper that already supports:
  - `yyyy-MM-dd'T'HH:mm:ss.SSSSSS`
  - `yyyy-MM-dd'T'HH:mm:ss.SSS`
  - `yyyy-MM-dd'T'HH:mm:ss`
  - `yyyy-MM-dd HH:mm:ss`
  - `dd.MM.yyyy HH:mm`

Implementation direction:

- Unify date parsing so `PartyView.fetchPartiesFromBackend()` can parse backend local-date-time strings too.
- Prefer a small shared helper rather than duplicating different parsers in multiple files.
- Add a dedicated SwiftUI section, for example `Section("Date & Time")`, in Party Details.
- Move Start/End date/time display there, or create a new `PartyDateTimeSection` component.
- Keep presentation concise and iOS-native.
- Display user-facing date/time values as `dd.MM.yyyy HH:mm`, for example `24.06.2026 19:30`.
- Keep backend request/parse formats separate from the UI display format; backend date-time values should continue to use `yyyy-MM-dd'T'HH:mm:ss`.

## Files To Inspect Before Editing

- `PartyHubiOS/PartyHubiOS/PartyView/PartyDetailView.swift`
- `PartyHubiOS/PartyHubiOS/PartyView/PartyFormView.swift`
- `PartyHubiOS/PartyHubiOS/PartyView/PartyView.swift`
- `PartyHubiOS/PartyHubiOS/PartyView/PartyDetailsSection.swift`
- `PartyHubiOS/PartyHubiOS/PartyView/Party.swift`
- `PartyHubiOS/PartyHubiOS/PartyHubiOSApp.swift`
- `PartyHubiOS/PartyHubiOS/APIClient.swift`
- `PartyHubiOS/PartyHubiOS/APIError.swift`
- `src/main/java/at/htl/party/PartyResource.java`
- `src/main/java/at/htl/party/PartyCreateDto.java`

## Suggested Implementation Plan

1. Add or centralize a reusable Swift date parser for backend party dates.
   - A good lightweight option is a small helper type/file in the iOS target, for example `BackendDateParser`.
   - Reuse it in `PartyHubiOSApp.fetchAndStoreParties(context:)` and `PartyView.fetchPartiesFromBackend()`.
2. Fix `updatePartyOnBackend(_:)` so the `PUT` request sends the Bearer token.
3. Improve update request error reporting if useful, but keep the behavioral change focused.
4. Fix edit-mode coordinates in `PartyFormView.save()`.
5. Update `PartyView` so party refresh after create/update also calculates missing driving distances and removes stale distance cache entries.
6. Add a dedicated date/time details section in `PartyDetailView` / `PartyDetailsSection`.
7. Remove duplicated Start/End rows from the generic details section if they move into a new dedicated section.
8. Run available build/tests or at least Swift compile checks if available from the workspace.

## Guardrails

- Keep the change scoped to the Swift iOS app unless a backend issue is discovered during implementation.
- Do not alter the backend auth model.
- Do not remove Keycloak authentication.
- Do not silently reset local SwiftData or Docker/Keycloak state.
- Preserve existing app style: SwiftUI views, small helper structs/functions, no large architecture rewrite.
- Use existing `KeycloakAuthService.shared.validAccessToken()` or `APIClient` auth support rather than creating another auth path.
- Be careful with the current worktree. Do not revert unrelated user changes.

## Verification Expectations

At minimum, verify by inspection/build where possible:

- Editing a party sends `Authorization: Bearer ...` on the `PUT /api/parties/{id}` request.
- Save no longer depends on the obsolete `?user=` query parameter for authentication.
- Changing location in the edit form sends the selected coordinates.
- Creating a party posts `.partyDidUpdate`, refreshes parties, and triggers distance calculation for any new party without requiring user movement.
- Deleted/nonexistent party IDs are removed from the distance cache after refresh.
- Party Details show a dedicated date/time section when start/end data exists.
- Party date parsing handles backend local-date-time values like `2026-06-24T19:30:00`.

If an iOS build cannot be run in the environment, report that clearly and include the exact command attempted or why it was not available.

## Output Expectation For The New Thread

The new thread should implement the fixes, not re-open broad discovery.

When reporting back, include:

- files changed
- summary of the three implemented fixes
- verification performed
- any remaining manual simulator checks needed
