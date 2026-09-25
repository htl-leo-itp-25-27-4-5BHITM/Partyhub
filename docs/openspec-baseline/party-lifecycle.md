# Party lifecycle evidence and proposed contract

Group 4 review, 2026-09-25, against application-source snapshot `9487ccb90bb438e24b3cfab547a5dc900b11aecb` from repository checkpoint `c4e19b8505fd185075cb3bd94802aaae7751f418`. This document separates accepted D001/D007-D008 behavior, source observations, and the unapplied [document-party-lifecycle proposal](../../openspec/changes/document-party-lifecycle/proposal.md). No application, API, browser, iOS, database, or runtime test was executed.

## Scope and stable boundaries

- Group 4 owns party create/read/update/delete authorization, party fields and validation, and browser/iOS lifecycle compatibility.
- D001 supplies the authenticated PartyHub actor. D007 supplies public/private viewer roles and host-only management. D008 preserves the profile-specific party-list rule.
- Invitation status/revocation and join/leave transitions remain Q003 and Group 5. Age/capacity admission enforcement remains Q004 and Group 5. Roster, invitation-detail, statistics and `can-edit` exposure remain Q010. Exact response envelopes, status codes and update wire semantics remain Q014 and Group 11.
- The proposed child changes only `party-discovery-and-management`. It preserves AUTH-01-AUTH-12, SOC-01-SOC-06, the invitation/attendance requirements, and all discovery/map requirements.

## Lifecycle actor matrix

| Operation | Anonymous | Authenticated host | Qualifying invitee | Joined attendee | Unrelated authenticated user | Observed source / proposed disposition |
|---|---|---|---|---|---|---|
| List/read public party | Allow | Allow | Allow | Allow | Allow | Default list and detail paths allow public access. Proposed contract retains this. |
| List/read private party | Deny | Allow | Allow under Q003 invitation-state rules | Allow | Deny | Default list/detail use host/invitation/member predicates; legacy filter/sort branches omit them (G009). Proposed contract applies one viewer predicate to every list/detail branch. |
| Create party | Deny | Allow as authenticated creator | Allow as authenticated creator | Allow as authenticated creator | Allow as authenticated creator | Resource is authenticated and repository assigns caller as host. Proposed contract makes payload host identifiers non-authoritative. |
| Update party | Deny | Allow | Deny unless also stored host | Deny unless also stored host | Deny | Resource authenticates, but repository overwrites host with caller without comparing stored host (G003). Proposed contract denies before mutation and preserves host. |
| Delete party | Deny | Allow | Deny unless also stored host | Deny unless also stored host | Deny | Repository checks stored host; resource tests contain owner 204/non-owner 403 assertions. Proposed contract preserves the host-only rule without fixing exact status policy here. |

Sources: [PartyResource](../../src/main/java/at/htl/party/PartyResource.java):47-173, [PartyRepository](../../src/main/java/at/htl/party/PartyRepository.java):59-201 and 411-466, and [access rows 14-18](access-matrix.md#access-matrix).

## Field and validation matrix

| Field | Stored / transported evidence | Observed constraints and client behavior | Proposed lifecycle rule |
|---|---|---|---|
| Host | `Party.host_user`; absent from `PartyCreateDto` | Create derives caller. Update currently assigns caller without stored-host check. | Derived from authenticated creator, immutable through lifecycle payloads. |
| Title | Entity and DTO; browser/iOS forms | DTO has size 2-100 and `ValidPartyName`; required annotations use validation groups that resource `@Valid` does not select. Browser checks nonblank; iOS substitutes `New Party`. | Required, 2-100 characters, accepted party-name character policy; invalid mutation fails atomically. |
| Description | Entity and DTO; both clients | DTO maximum 2000. Browser requires it; iOS substitutes a default on create. | Optional lifecycle field up to 2000; a client must not invent replacement meaning for an absent/unedited value. |
| Start/end | Entity and DTO; both clients | Create-required start uses a validation group. Browser requires both and checks end after start; backend has no cross-field check. iOS always supplies both and can replace missing edit times with current time. | Start required on create; end optional and later than start when present; unedited values preserved. |
| Location | Non-null entity relation; DTO has latitude, longitude and address | DTO has no coordinate presence/range checks; repository uses nullable boxed values in primitive setters. Browser geocodes an address; iOS supplies selected/current/default coordinates and may substitute `TBD`. | A usable coordinate pair is required for create; latitude -90..90 and longitude -180..180; address up to 500 is optional display metadata. |
| Visibility | Non-null entity string default `PUBLIC`; DTO string | DTO only limits length. Repository maps blank/unknown values to `PUBLIC`. Browser defaults private and supports selection; iOS hard-codes public. | Omitted create visibility defaults `PUBLIC`; accepted non-empty values are `PUBLIC`/`PRIVATE`; other values fail rather than silently changing meaning. |
| Theme | Entity/DTO; browser form and iOS payload | DTO maximum 50. Browser edits a value; iOS hard-codes `Standard` during create/update. | Optional up to 50; clients preserve an existing unedited value. Discovery fallback remains Group 6/Q008. |
| Fee | Entity/DTO; both clients | DTO 0..99999.99. Browser sends `fee` plus unused `entry_costs`; iOS parses text and defaults create to zero. | Optional 0..99999.99; invalid value rejects the mutation. |
| Minimum/maximum age | Entity/DTO; both clients | Each DTO value is 0..150; browser checks nonnegative and min<=max. Backend has no cross-field check. iOS supplies defaults. | Optional 0..150 with min<=max. Stored/displayed/filtered metadata; admission enforcement remains Q004. |
| Capacity | Entity/DTO; iOS form | DTO range 1..10000. Active browser form/payload has no `max_people` field. | Optional 1..10000 metadata; admission enforcement remains Q004 and unsupported clients preserve it. |
| Website | Entity/DTO; both clients | DTO maximum 500; no backend URL-format validator observed. | Optional up to 500. URL-format policy is not invented here. |
| Selected invitees | DTO and browser private-party flow | Browser supplies selected IDs; iOS sends an empty list. Backend lacks the D005 mutual-contact check (G017). | Invitation eligibility, retention and transition semantics remain Group 5; lifecycle validation must not partially change invitations on failure. |

Sources: [Party model](../../src/main/java/at/htl/party/Party.java), [PartyCreateDto](../../src/main/java/at/htl/party/PartyCreateDto.java), [Location](../../src/main/java/at/htl/location/Location.java), [party-name validator](../../src/main/java/at/htl/validation/ValidPartyNameValidator.java), [browser form](../../src/main/resources/META-INF/resources/addParty/addParty.js), and [iOS form](../../PartyHubiOS/PartyHubiOS/PartyView/PartyFormView.swift).

The proposal makes create/update validation atomic before party, ownership, invitation, or notification changes. Exact payload error envelopes and PUT replacement-versus-partial semantics remain Q014 rather than being inferred from the current repository assignments.

## Client and route compatibility

| Client/call site | Observed method and path | Authentication / payload observation | Disposition |
|---|---|---|---|
| Browser active add/edit wizard `addParty.js:1171-1261` | `POST /api/parties`; `PUT /api/parties/{id}` | `authService.apiCall`; sends lifecycle fields and invitees, but omits capacity. | Canonical route. Preserve unsupported/unedited capacity; backend still enforces authorization/validation. |
| Browser edit load `addParty.js:511-552` | `GET /api/parties/{id}`, fallback list | Explicit `authRequired: false`, so authenticated private visibility may not be conveyed. | G030; viewer-dependent reads send a usable bearer token. |
| Browser shared helper `backend-functions.js:76-123` | Filter uses `POST /api/parties?q=...`; update uses `POST /api/party/{id}` | Update uses raw `fetch` and no shared authenticated call. | G006; canonical filter is GET and lifecycle update is bearer `PUT /api/parties/{id}`. Reachability still needs later application tracing. |
| Browser detail `advancedPartyInfos.js` | `GET /api/parties/{id}` | Reads detail metadata through shared browser request behavior. | Canonical path; private viewer identity must be available. |
| iOS party list `PartyView.swift:166-269` | `GET /api/parties` | Uses unauthenticated `URLSession.shared.data`; removes local rows missing from returned public list. | G030; authenticated list reads need bearer identity before reconciling private local data. |
| iOS create `PartyFormView.swift:266-315` | `POST /api/parties` | Bearer token; substitutes title/description/address/theme/public/empty invitee defaults. | Canonical route; hard-coded values may express supported create defaults only when intentional and valid. |
| iOS edit `PartyDetailView.swift:413-520` | `PUT /api/parties/{id}` | Bearer token and local owner guard; hard-codes theme `Standard`, visibility `public`, empty invitees, default times/ages. | Canonical route but G030 field-preservation conflict. Client owner guard is not backend authorization. |
| iOS delete `PartyView.swift:271-298` | `DELETE /api/parties/{id}` | Shared bearer API client; local state removed only after success. | Canonical operation and failure-state shape. |
| iOS notification polling `Partynotificationsystem.swift:389-432` | `GET /api/party/{id}/attendees` and `GET /api/party/{id}` | Bearer supplied, but no matching singular backend resources were inventoried. | G006; invitation/notification purpose remains Groups 5/8 while party read uses canonical plural route. |

The proposed client rule defines common API behavior without requiring identical browser/iOS controls. It requires server-consistent failures and preservation of fields outside a client's editing surface. Route aliasing, response schemas, HTTP status selection, and partial-versus-replacement update mechanics remain Group 11/Q014.

## Test evidence and limitations

- `PartyResourceTest` contains anonymous create/update/delete rejection, missing-party cases, and owner/non-owner delete assertions under synthetic `@TestSecurity` identities.
- `PartyRepositoryTest` contains public visibility normalization, private selected-user invitation, public-to-private update, and cancellation-notification assertions.
- No inspected test establishes non-host update denial, immutable ownership, grouped validation activation, cross-field validation, geographic bounds, unsupported-visibility rejection, every visibility query branch, or both clients' payload preservation.
- Tests were read but not run. The test profile's authentication setup does not prove real Keycloak bearer validation; G013 remains applicable.

## Proposal-boundary result

The [proposal](../../openspec/changes/document-party-lifecycle/proposal.md), [design](../../openspec/changes/document-party-lifecycle/design.md), [delta](../../openspec/changes/document-party-lifecycle/specs/party-discovery-and-management/spec.md), and [tasks](../../openspec/changes/document-party-lifecycle/tasks.md) are planning-complete. The delta modifies PARTY-03 through PARTY-05 and proposes PARTY-12 atomic lifecycle validation plus PARTY-13 shared client/API behavior. Until a later explicit apply/sync task, the accepted main spec remains **11 requirements/33 scenarios**; the projected integrated party spec is **13/60**, and the projected full baseline is **44/172**.
