# Continuation: add-party-map-filters

Date: 2026-05-25

## Goal

Start implementing the OpenSpec change `add-party-map-filters`.

This is not just a feature addition. The current regular party-map filter flow in `PartyHubiOS/PartyHubiOS/Map/MapView.swift` is already broken and should be treated as a correctness bug first, then rebuilt cleanly to match the attendee-map filter style.

Do not restart discovery from scratch unless the user asks. Pick up from the current workspace state and implement the agreed rebuild path.

## Current OpenSpec Status

Change: `add-party-map-filters`
Schema: `spec-driven`
Progress: `0/16` tasks complete

Primary artifacts:

- `openspec/changes/add-party-map-filters/proposal.md`
- `openspec/changes/add-party-map-filters/design.md`
- `openspec/changes/add-party-map-filters/tasks.md`
- `openspec/changes/add-party-map-filters/specs/party-discovery-and-management/spec.md`

## What Was Decided In Explore Mode

### Implementation direction

Take the cleaner rebuild path for `MapView`, not a tiny patch on the current filter code.

The target shape is:

```text
shared backend-backed data
- Party from SwiftData
- current user profile/filter support data
- invited/following relationship data

shared runtime service
- LocationManager.currentLocation

local MapView state
- filter selections
- search text
- filter sheet visibility
- map camera/region
- map size
- derived clusters
```

### Why the current filter is broken

The current `MapView` only recomputes clusters when `filteredParties.count` changes:

- `PartyHubiOS/PartyHubiOS/Map/MapView.swift`

That means the visible map can stay stale when the filtered set changes but the count stays the same.

Other known problems in the current file:

- `within2WeeksEnabled` exists but is not actually applied as a filter
- `myAgeEnabled` depends on `userAge`, but `userAge` is never loaded
- `userLocation` is only snapshot-loaded once instead of reacting to later location updates
- `searchText` affects filtering but is not included in active-filter UI state
- Reset does not clear all filter-related values consistently

### Data ownership decisions

Backend-backed facts should be shared.
Map interaction and filter choices should stay local.
Rendered results should be derived, never manually synchronized.

## Relevant Existing Fetch/Storage Context

Read:

- `PartyHubiOS/PartyHubiOS/PartyHubiOSApp.swift`
- `PartyHubiOS/PartyHubiOS/PartyView/Party.swift`

Important context:

- `/api/parties` is already fetched centrally in `PartyHubiOSApp.fetchAndStoreParties(context:)`
- parties are already stored into SwiftData and consumed with `@Query`
- this means party filtering in `MapView` should be built from shared `Party` data, not from view-specific fetching

Important gap:

- `PartyHubiOSApp.swift` decodes `category.name` but only persists `categoryId`
- the implementation should add a shared displayable theme field on `Party`, such as `themeName: String?`, and populate it during sync

## Recommended Ownership Split

### Shared backend-backed data

- `Party`
- `Party.themeName` or equivalent displayable category/theme field
- current user profile data needed for filtering, especially age if available from backend
- invited party ids for current user
- following/friend ids for current user

### Shared runtime data

- `LocationManager.currentLocation`

### Local to `MapView`

- selected filter values
- search text
- `showFilterSheet`
- `position`
- `currentRegion`
- `mapViewSize`
- `partyClusters`
- derived summary/active state

## Files To Inspect Before Editing

- `PartyHubiOS/PartyHubiOS/Map/MapView.swift`
- `PartyHubiOS/PartyHubiOS/Map/PartyAttendeeMapView.swift`
- `PartyHubiOS/PartyHubiOS/Map/UserLocationListView.swift`
- `PartyHubiOS/PartyHubiOS/HomeView.swift`
- `PartyHubiOS/PartyHubiOS/PartyView/PartyView.swift`
- `PartyHubiOS/PartyHubiOS/PartyView/Party.swift`
- `PartyHubiOS/PartyHubiOS/PartyHubiOSApp.swift`

What to borrow:

- from `PartyAttendeeMapView.swift`: filter sheet feel, active-state affordance, summary treatment, structured filter state
- from `PartyView.swift`: react to `locationManager.currentLocation` changes instead of one-time snapshots
- from `HomeView.swift`: simple derived filtering from shared party data

## Suggested Implementation Plan

1. Update the `Party` model to include a displayable theme/category field.
2. Update `PartyHubiOSApp.fetchAndStoreParties(context:)` to persist that field from backend party data.
3. Replace the scattered regular-map filter booleans in `MapView` with one dedicated filter-state model plus small helper enums/value types.
4. Rebuild `filteredParties` as one clear derived pipeline:
   - time filter
   - theme filter
   - distance filter
   - age filter
   - free filter
   - text search
5. Rebuild cluster recomputation so it depends on actual filtered results plus region/size changes, not just count changes.
6. Make `MapView` react to live location changes from `LocationManager`.
7. Rework the filter sheet to match the attendee-map style while still using appropriate controls for mixed filter types.
8. Add a compact active-filter summary overlay.
9. Make reset/default behavior fully consistent.
10. Verify old filters now truly affect visible parties and new filters work too.

## Specific Guardrails

- Do not introduce a large new architecture if a few small helper types inside the iOS app will do.
- Keep the app’s existing style: view-centric SwiftUI with clear derived values.
- Avoid global loose variables; prefer shared persisted/shared service state for backend-backed facts.
- Keep device/runtime-only concerns local to `MapView`.
- Do not change backend discovery/visibility rules as part of this work.

## Good First Checks In The New Thread

1. Re-read `openspec/changes/add-party-map-filters/tasks.md`
2. Inspect `MapView.swift` and confirm the stale cluster refresh path
3. Inspect `PartyHubiOSApp.swift` and `Party.swift` to add the missing theme field
4. Decide whether current-user age already exists in an existing backend profile DTO; if not, pause before implementing a “my age” equivalent

## Verification Expectations

At minimum, verify:

- existing regular-map filters now change visible parties immediately
- cluster annotations update when the filtered set changes even if the count does not
- theme options come from persisted shared party data
- distance behavior works when location appears after view load
- reset clears all active filters consistently
- the filter toolbar state and visible results stay in sync

Run the relevant iOS build/test workflow if available in the workspace, and report clearly if simulator/manual verification is still needed.

## Output Expectation For The Next Thread

The next thread should implement the change, not re-open discovery.

When reporting back, include:

- what was changed
- any backend/user-profile data gap that blocked a specific filter
- what was verified
- any residual risk, especially around theme source or age source

