# Extended client feature scope and evidence review

Group 10 reviewed the extended location, visit/time-tracking and calendar surfaces on 2026-09-29 and integrated their accepted contracts on 2026-09-30 from proposal checkpoint `a487379115b6c8832f18d043475c774ae42d9742`. Application source remains the foundation snapshot from `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. No application source, configuration, database, device data or deployed service was changed or exercised.

Read this with the accepted [identity specification](../../openspec/specs/user-auth-and-identity/spec.md), [party specification](../../openspec/specs/party-discovery-and-management/spec.md), [radius specification](../../openspec/specs/map-radius-control/spec.md), [access matrix](access-matrix.md), [decisions](decisions.md), [gaps](gaps.md) and the applied [extended-client child change](../../openspec/changes/archive/2026-09-30-document-extended-client-features/proposal.md).

## Scope classification

| Surface | Classification | Accepted boundary |
|---|---|---|
| iOS current device location for finite-distance filters and radius display | Retained existing behavior | PARTY-10/PARTY-11, RADIUS-01-RADIUS-03 and D018 already accept local current-location use with unavailable-location fallback. It does not publish a user position or establish attendance. |
| Server-stored current-user location and attendee location maps/lists | Excluded/deferred | D022/PARTY-17 accept no live-location sharing. Rows 28, 55 and 56 remain inventoried unsupported endpoints; future retention needs a separate consent, audience, freshness, revocation and retention proposal. |
| iOS visit/time tracking | Optional retained extension | D022/PARTY-18 require explicit opt-in, permission-gated, device-local history. It is not server attendance, invitation acceptance, identity or location sharing. |
| iOS calendar export | Optional retained extension | D022/PARTY-19 define a user-initiated device-calendar snapshot with local association/removal and no automatic PartyHub synchronization or server state effect. |
| Browser location, visit tracking and calendar UI | Excluded from this extension | No inspected reachable browser counterpart establishes behavior, and iOS-only support does not imply UI parity. |

This classification preserves D010: core party discovery works without live location. It also preserves the later accepted iOS distance/radius behavior, which consumes current location locally and is distinct from the deferred sharing surfaces.

## Evidence index

| ID | Inspected evidence |
|---|---|
| X1 | [UserResource.java](../../src/main/java/at/htl/user/UserResource.java), [PartyResource.java](../../src/main/java/at/htl/party/PartyResource.java): user-location read/update and party-attendee-location routes. |
| X2 | [UserLocation.java](../../src/main/java/at/htl/user_location/UserLocation.java), [UserLocationRepository.java](../../src/main/java/at/htl/user_location/UserLocationRepository.java), [UserLocationUpdateDto.java](../../src/main/java/at/htl/user_location/UserLocationUpdateDto.java): storage, party-member query and coordinate validation. |
| X3 | [PartyAttendeeMapView.swift](../../PartyHubiOS/PartyHubiOS/Map/PartyAttendeeMapView.swift), [UserLocationListView.swift](../../PartyHubiOS/PartyHubiOS/Map/UserLocationListView.swift), [UserLocationViewModel.swift](../../PartyHubiOS/PartyHubiOS/Map/UserLocationViewModel.swift): reachable attendee map/list, fetch/update and client filtering. |
| X4 | [LocationManager.swift](../../PartyHubiOS/PartyHubiOS/GeoTimeTracking/LocationManager.swift), [TimeEntry.swift](../../PartyHubiOS/PartyHubiOS/GeoTimeTracking/TimeEntry.swift), [TimeTrackingView.swift](../../PartyHubiOS/PartyHubiOS/GeoTimeTracking/TimeTrackingView.swift), [PastVisitsSection.swift](../../PartyHubiOS/PartyHubiOS/PartyView/PastVisitsSection.swift): background geofences and local visit intervals. |
| X5 | [Party.swift](../../PartyHubiOS/PartyHubiOS/PartyView/Party.swift), [PartyView.swift](../../PartyHubiOS/PartyHubiOS/PartyView/PartyView.swift), [PartyHubiOSApp.swift](../../PartyHubiOS/PartyHubiOS/PartyHubiOSApp.swift), [ContentView.swift](../../PartyHubiOS/PartyHubiOS/ContentView.swift): SwiftData ownership, startup monitoring and reachable time-tracking tab. |
| X6 | [CalendarService.swift](../../PartyHubiOS/PartyHubiOS/CalendarService.swift), [PartyDetailView.swift](../../PartyHubiOS/PartyHubiOS/PartyView/PartyDetailView.swift): EventKit permission, add/remove/lookup, local event-ID mapping and party-detail control. |
| X7 | [Info.plist](../../PartyHubiOS/PartyHubiOS/Info.plist), [project.pbxproj](../../PartyHubiOS/PartyHubiOS.xcodeproj/project.pbxproj): location/calendar usage strings and background-mode declarations; declaration does not prove device permission or runtime behavior. |
| X8 | [UserLocationRepositoryTest.java](../../src/test/java/at/htl/repository/UserLocationRepositoryTest.java), [UserResourceTest.java](../../src/test/java/at/htl/resource/UserResourceTest.java), [PartyResourceTest.java](../../src/test/java/at/htl/resource/PartyResourceTest.java): repository and missing-resource assertions. |
| X9 | [Historical functional narrative](../functional-spec-codex.md), [archived scope decision](../../openspec/changes/archive/2026-05-20-capture-partyhub-functional-spec/design.md), [current party spec](../../openspec/specs/party-discovery-and-management/spec.md): live location is extended/optional and excluded from core discovery. |

## Shared location comparison

| Surface | Observed behavior | Disposition |
|---|---|---|
| `GET /api/users/location/{id}` | Publicly loads `UserLocation` by entity primary key, although the path is named as a user location. It has no requester, same-user, consent, freshness or visibility check. | Unsupported/deferred under D022; do not treat the row as a public profile projection. G051/G052. |
| `PUT /api/users/location` | Requires authentication and derives the caller, but looks up `UserLocation` by the caller's user ID as though it were the independently generated location-row ID. It then mutates that row without verifying its linked user. | Unsupported/deferred; token identity alone does not make the storage lookup safe. G052. |
| `GET /api/parties/{id}/locations` | Publicly returns stored locations for users joined to the named party. It checks party existence but no Viewer, private-party, per-user sharing or freshness rule. | Unsupported/deferred; joined membership does not imply consent to publish current coordinates. G051/G053. |
| iOS attendee map/list | Reachable from party details, performs unauthenticated location/follow/invitation reads, uses hard-coded user ID `1` in several self/filter branches, and uploads once on map appearance only if legacy `UserDefaults.currentUserId` exists. | Unsupported client surface; D001/D014 identity and D007/D017 private-party rules remain controlling. G053. |
| Stored `UserLocation` | One row relates to a user and stores only latitude/longitude. No update time, sharing state, precision, expiry, revocation or cleanup policy is present. | Insufficient for a retained live-location contract. G054; exact route containment and physical cleanup remain Steps 11-12. |

Coordinate range validation exists on the update DTO, and repository tests cover persistence and joined-party selection. Those facts do not establish consent, currentness or authorization. The accepted location use for map filtering remains device local and does not need these routes.

## Visit/time-tracking lifecycle

The app creates one `LocationManager` during application setup, requests always-location permission, registers geofences for fetched local parties, and checks current region state. Entry creates an open `TimeEntry`; exit closes the active record. `TimeTrackingView` is a top-level tab, party details show completed visits, and users can delete local entries. `Party` owns entries through a SwiftData cascade, so removing local party data also removes its history.

The source has no separate visit-tracking enable switch, does not limit monitoring to joined or explicitly selected parties, ignores local save failures, and only prints monitoring errors. Startup fetch/monitoring and the permission/configuration declarations were not executed. No automated iOS tests were found for permission changes, background delivery, duplicate/out-of-order region events, geofence limits, persistence, deletion or separation from backend attendance.

PARTY-18 therefore retains this only as an optional iOS-local feature: explicit enablement and permission precede monitoring; one coherent interval exists per party; failures create no fabricated visit; local records are user-removable; local party cleanup owns their deletion; and no local event changes PartyHub attendance or sharing.

## Calendar lifecycle

The reachable party-detail toolbar asks for full EventKit access on first add, creates an event from party title/location/notes/coordinates/times and a PartyHub deep link, stores a party-to-event identifier in `UserDefaults`, detects an existing event, and offers confirmed removal. It sends no calendar data to PartyHub.

Observed limitations are separate from the accepted contract: denial and save/remove failures produce little or no user feedback; a missing start time is replaced by the current time even though accepted parties require a start; the local identifier can become stale after external deletion; party edits/cancellation do not update the exported event; and no calendar tests or device execution were found. D022/PARTY-19 classify export as an optional snapshot, not automatic synchronization. Add/remove failures leave PartyHub state unchanged, repeated add must not duplicate an existing associated event, stale associations must not delete another event, and updated parties require an explicit remove-and-export action.

## Completed Group 10 and test limits

`document-extended-client-features` is applied and synced with 8/8 tasks complete. PARTY-17 through PARTY-19 add 16 scenarios for private current-location context/shared-location exclusion, optional local visit tracking, and optional calendar snapshot export. The party spec is now 19 requirements/113 scenarios and accepted baseline coverage is 55 requirements/290 scenarios.

No JUnit, HTTPYac, browser, iOS simulator/device, EventKit, CoreLocation, database or deployment test was run. Group 10 application behavior remains unverified, and no source/configuration/data change is authorized by this review.
