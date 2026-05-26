x## Context

`MapView.swift` already filters visible parties by a small set of booleans and a text field, but the currently implemented party-map filters are not working reliably in the shipped experience. `PartyAttendeeMapView.swift` meanwhile uses a more cohesive filter presentation with an active-state indicator, count-aware rows, and a dedicated sheet interaction. The requested change therefore has two parts: restore correct filter behavior for the regular party map and expand that filter surface to include time window, party theme, distance, minimum/maximum age, free-only filtering, and text search while keeping discovery scoped to parties the client already knows are visible.

One implementation constraint is that the iOS `Party` model currently persists `categoryId`, age bounds, fee, time, and searchable text fields, but does not persist a displayable theme/category label. Although some decoded payloads already expose `theme` or category metadata, the map cannot offer a user-friendly theme filter until that label is stored or otherwise resolved client-side.

## Goals / Non-Goals

**Goals:**
- Make the already-implemented regular party-map filters function correctly and predictably.
- Align the regular map’s filter UX with the attendee map’s existing sheet-and-status style.
- Support combining multiple filter dimensions without breaking map clustering or party visibility rules.
- Make theme filtering implementation-ready by defining how theme/category labels become available on the client.
- Keep filter state local to the iOS map experience and immediately reflected in visible annotations.

**Non-Goals:**
- Changing backend visibility rules for which parties a user may discover.
- Introducing server-side filtering or new map API endpoints.
- Redesigning clustering behavior beyond recalculating clusters from filtered parties.
- Redefining attendee-map filtering beyond borrowing its interaction style and state model patterns.

## Decisions

### Decision: Replace ad hoc booleans with a dedicated party-map filter state model

The current regular map uses separate state properties such as `costFilter`, `nearMeEnabled`, `myAgeEnabled`, `within2WeeksEnabled`, and `searchText`. The change should consolidate these into a dedicated filter state/value object plus small helper enums for theme and distance selection where needed.

Rationale:
- It matches the attendee map’s more deliberate filter-state organization.
- It makes combined filtering easier to test and reason about.
- It gives the UI a single source of truth for “is active”, summary text, reset behavior, and counts.

Alternatives considered:
- Keep adding more `@State` booleans and optional values directly in `MapView`.
  Rejected because it will make the filter sheet and predicate logic harder to maintain as criteria grow.

### Decision: Treat the current broken filter behavior as a correctness bug to resolve first

Before polishing the UI, the implementation should verify why the existing `MapView` filters do not reliably change the displayed party set and should make that predicate-to-render path correct. The new filter model should only replace the current behavior once filtered results, active state, and cluster refreshes are confirmed to stay in sync.

Rationale:
- The user explicitly reported that the current party filter is already broken.
- Adding more filter controls on top of an unreliable update path would make debugging and user trust worse.

Alternatives considered:
- Ignore the current bug and only implement the requested new filters.
  Rejected because it would preserve a known broken discovery flow.

### Decision: Mirror attendee-map interaction patterns, but use controls appropriate for party filters

The regular map should reuse the attendee map’s visible active-filter affordances:
- highlighted toolbar filter button when any non-default filter is active
- compact overlay summary of the active filter state
- sheet-based editing flow with clear selected state

Party filters are not a pure checklist, so the sheet should combine row-style toggles and pickers/inputs while preserving the attendee map’s visual language.

Rationale:
- The user explicitly asked to reuse the attendee map’s style and logic.
- It improves consistency without forcing awkward control shapes for age and text entry.

Alternatives considered:
- Reuse the current `Form` layout and only add more controls.
  Rejected because it preserves the current UX mismatch the user wants to remove.

### Decision: Theme filtering requires storing a theme/category label on `Party`

Because `Party` currently persists only `categoryId`, the iOS app cannot present or search distinct theme names from local data alone. The implementation should add an optional persisted theme/category display field on `Party` and populate it during party sync from whichever backend payload is authoritative (`theme`, category name, or both).

Rationale:
- A theme filter needs a stable label to display and compare.
- It avoids hardcoding category ID mappings in the map UI.

Alternatives considered:
- Filter by `categoryId` only and expose numeric or app-local mappings in the UI.
  Rejected because it is brittle and not user-friendly.
- Omit theme filtering until a new endpoint exists.
  Rejected because current payloads already indicate theme/category data is at least partially available.

### Decision: Distance filtering should remain client-side and location-aware

Distance filtering should calculate distance from the current user location to each party coordinate using `CLLocation`, similar to the existing “near me” behavior, but allow a selectable threshold instead of a fixed 5 km toggle.

Rationale:
- It reuses available data and avoids backend changes.
- It keeps behavior consistent with the existing map and permission model.

Alternatives considered:
- Server-side geo filtering.
  Rejected because this proposal is a client-only discovery refinement.

### Decision: Age filtering should target party admission bounds, not only “my age”

The requested “minimum and maximum age” filter should let users narrow parties by selected age-bound ranges rather than only matching their own age. Existing “my age” convenience can be removed or expressed as defaulting the range to the user profile age if desired during implementation.

Rationale:
- It matches the stated requirement more closely.
- It gives users more control when browsing for specific audiences.

Alternatives considered:
- Keep only the existing “my age” toggle.
  Rejected because it does not satisfy the requested min/max age filtering capability.

## Risks / Trade-offs

- [Theme source ambiguity] -> Mitigation: choose one canonical client field and populate it from the best available decoded payload; if both `theme` and category name exist, document precedence in implementation.
- [Filter sheet complexity grows beyond attendee map simplicity] -> Mitigation: group controls into short sections and keep a single reset/default path so the UI stays scannable.
- [Distance filtering depends on location permission] -> Mitigation: disable or explain distance options when no current location is available rather than silently filtering nothing.
- [Age range combinations may be interpreted differently] -> Mitigation: define the client rule explicitly, such as matching parties whose allowed age window overlaps the selected filter window.
- [Persisted-model change may require SwiftData migration behavior] -> Mitigation: add the new optional theme field in a backwards-compatible way and verify local data sync repopulates it.
- [Existing filter bug has multiple contributing causes] -> Mitigation: isolate filter-state evaluation, filtered-party derivation, and cluster refresh behavior so each can be validated independently during implementation.
