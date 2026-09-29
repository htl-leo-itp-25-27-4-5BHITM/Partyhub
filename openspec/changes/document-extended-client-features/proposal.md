# Proposal

## Why

PartyHub exposes iOS calendar export, device-location visit tracking, and attendee-location screens alongside backend user-location routes, but the accepted baseline defines only current-location use for map filtering and explicitly excludes live location from core discovery. These reachable extensions need a bounded contract so device permissions, private-party visibility, local data, and unsupported location sharing are not inferred from prototype code.

## What Changes

- Retain current device location as an iOS-local input to the already accepted finite-distance map behavior; using that location SHALL NOT by itself publish a user's position or establish party attendance.
- Retain calendar export as an optional iOS party-detail integration that is user initiated, permission gated, device local, removable, and isolated from PartyHub server state and party lifecycle success.
- Retain visit/time tracking as an optional iOS-local feature that requires explicit location permission, records only the current user's device-local visits, allows local deletion, and does not become authoritative attendance or a shared location signal.
- Explicitly defer server-stored current location, attendee-location maps/lists, and the related location read/write endpoints from the accepted product baseline. Their presence SHALL NOT establish a supported live-location contract; future retention requires a separate proposal covering consent, audience, freshness, revocation, retention, and private-party access.
- Document current source and test mismatches as implementation gaps without changing application code in this documentation change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `party-discovery-and-management`: Add iOS-only contracts for optional local calendar export and visit tracking, distinguish local current-location use from publication, and make shared live/attendee location explicitly unsupported in the accepted baseline.

## Impact

- Main specification: `openspec/specs/party-discovery-and-management/spec.md` after a later apply and sync step.
- Evidence and planning records: Group 10 files under `docs/openspec-baseline/`, including endpoint access, coverage, decisions, gaps, inventory, runbook, and handoff.
- Observed implementation surfaces for later remediation: `PartyHubiOS/PartyHubiOS/CalendarService.swift`, `PartyDetailView.swift`, `GeoTimeTracking/`, attendee map/list/view-model files, `Info.plist`, `UserLocation`, `UserLocationRepository`, `/api/users/location*`, and `/api/parties/{id}/locations`.
- No browser parity, backend location-sharing service, attendance-policy change, application fix, database migration, or runtime rollout is included.
