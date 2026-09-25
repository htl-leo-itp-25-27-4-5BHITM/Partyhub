# Proposal

## Why

PartyHub's accepted discovery requirements mix a shared visible-party contract with iOS-only map controls, omit stable query and pagination boundaries, and contain conflicting wording for parties without theme metadata. The documentation baseline needs one coherent contract before implementation work can safely reconcile the backend, browser, and iOS clients.

## What Changes

- Define the backend as the authority for viewer eligibility before search, filtering, sorting, and pagination, with explicit anonymous and authenticated result boundaries.
- Define shared query composition, deterministic pagination, search fields, time boundaries, missing-metadata behavior, and the distinct responsibilities of the browser and iOS clients.
- Scope the archived home-map filter interaction, combined predicates, reset behavior, and direct radius control explicitly to the iOS home map without creating browser UI parity requirements.
- Resolve missing-theme behavior so an active theme filter excludes parties without matching displayable theme metadata and no other filter can override the all-active-criteria rule.
- Define finite and unlimited radius states, location-unavailable behavior, radius visualization, and reset synchronization for the iOS SwiftUI map.
- Preserve the existing `map-radius-control` Purpose placeholder for the separately scoped Step 12 repair.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `party-discovery-and-management`: add a shared visible-party query and pagination contract and make the existing iOS filter requirements' platform, combination, metadata, location, and reset boundaries explicit.
- `map-radius-control`: make the iOS SwiftUI scope and finite, unlimited, unavailable-location, visualization, and reset behavior explicit without changing the existing Purpose.

## Impact

- Affected specifications: `party-discovery-and-management` and `map-radius-control`.
- Affected documentation: the Group 6 discovery/maps evidence record, coverage, decisions, gaps, inventory, runbook, checklist, and handoff.
- Future implementation scope: `GET /api/parties` query branches, browser party list/map callers, and iOS `MapView`/`PartyMapFilter`; this proposal performs no application, configuration, database, or deployment change.
