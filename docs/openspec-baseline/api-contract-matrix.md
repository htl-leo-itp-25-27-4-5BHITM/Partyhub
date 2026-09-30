# Cross-client API contract matrix

Group 11.3, inspected 2026-09-30 at `3a3f6ed` (source unchanged since `9487ccb`). Row numbers match the [inventory](inventory.md#endpoint-inventory) and the [access matrix](access-matrix.md), which remains authoritative for identity and access. This matrix adds the method/path, request and validation shape, the **source-observed** statuses and response bodies, the client callers, and the compatibility disposition. No request was executed. Status codes come from resource/repository source and Quarkus defaults, not from observed responses.

Accepted requirements are intentionally wire-agnostic: they say rejected, denied or not visible without fixing status codes or envelopes. Under D024, the plural `/api/parties` routes are canonical, and client calls to routes the backend does not expose are client compatibility gaps, not implied server routes. Q014 keeps the remaining choices of one error envelope and full-replacement versus partial `PUT`.

## Framework-level behaviour applying to many rows

| Condition | Source-derived default | Rows |
|---|---|---|
| Missing/invalid bearer on `@Authenticated` | 401 from Quarkus security; `NotAuthorizedException("Bearer token required")` from `CurrentUserResolver` when the subject is blank | All Auth rows |
| Bypass enabled | Any nonblank `X-User-Id` authenticates (see [auth-environments.md](auth-environments.md)) | All Auth rows; G002/G019 |
| `@Valid` constraint violation | 400 with the Hibernate Validator/Quarkus violation report | 2, 15, 18, 36, 44, 56 |
| Validation groups | `PartyCreateDto` title `@NotBlank` and start-time `@NotNull` are declared only for `OnCreate`/`OnUpdate`. A plain `@Valid` validates the Default group, so they are not enforced at the resource boundary | 15, 18 (G029) |
| Non-numeric `Long` path parameter | 404 (no matching route) | Numeric-ID rows |
| Unhandled exception / DB error | 500 | All |
| Request body JSON mismatch / wrong media type | 400 / 415 | Body rows |

Observed application error bodies vary: a JSON string `{"error": "..."}` built by concatenation, a JSON map, plain text, or an empty body (G062).

## Endpoint rows

Legend: **B** browser (`src/main/resources/META-INF/resources/`), **I** iOS (`PartyHubiOS/PartyHubiOS/`), **H** HTTPYac (`api/`). "No client" means neither browser nor iOS source calls it.

| # | Method path | Request / validation | Observed statuses | Response body | Callers | Compatibility disposition |
|---:|---|---|---|---|---|---|
| 1 | GET `/api/config/public` | none | 200 | `{keycloakIssuer}` | B `auth-service.js:26`; I `KeycloakConfig.swift:37` | Match (AUTH-10, ENV-08). |
| 2 | POST `/api/invitations` | JSON `InvitationDto` with `@NotNull` recipient/party IDs | 201, 200 (existing), 404, 409, 400 | Invitation projection / error | B `backend-functions.js:206`; I `InviteUsersView.swift:34`; H | Match on route. Payload/state mismatches G031/G033. |
| 3 | GET `/api/invitations?direction=sent` | `direction`; any other value → received | 200 (400 branch unreachable) | Invitation list DTOs | B `backend-functions.js:221,232`, `listPartys.js:122`, `notifications.js:266`; I `InvitationsViewModel.swift:44`, `MapView.swift:676`; H | Match. The iOS `user=` query parameter is ignored; identity comes from the token (D001). Projection G032. |
| 4 | DELETE `/api/invitations/{id}` | path id | 204, 400, 403, 404 | empty / error | B `backend-functions.js:243`; H | Match. Withdrawal semantics G031. |
| 5 | GET `/api/invitations/{id}/details` | path id | 200, 403, 404 | `InvitationDetailsDto` | No client | Server-only surface; retain under PARTY-14. |
| 6 | POST `/api/invitations/{id}/accept` | path id | 200, 204, 403, 404 | varies | B `notifications.js:380,468` | Match. Retry/no-op G031. |
| 7 | POST `/api/invitations/{id}/decline` | path id | 200, 204, 403, 404 | varies | B `notifications.js:451` | Match. |
| 8 | GET `/api/notifications` | `partyId`, `type`, `search` | 200 | `NotificationDto[]` | B `notifications.js:316`; H | Match. Typed filters G040. |
| 9 | GET `/api/notifications/unread` | none | 200 | `NotificationDto[]` | No client; H | Server-only surface. |
| 10 | POST `/api/notifications/{id}/read` | path id | 200, 400, 403, 404 | empty/error | No client; H | Server-only; browser read state G045. |
| 11 | DELETE `/api/notifications/{id}` | path id | 204, 400, 403, 404 | empty/error | B `notifications.js:365`; H | Match. |
| 12 | GET `/api/users/{id}/notification-settings` | path id must equal caller | 200, 403, 404 | `NotificationSettingsDto` | No client | Server-only; the settings UI gap is G045. |
| 13 | PUT `/api/users/{id}/notification-settings` | JSON `NotificationSettingsDto`, no constraints; all flags overwritten | 200, 403, 404 | `NotificationSettingsDto` | No client | Server-only; defaults G042. |
| 14 | GET `/api/parties` | `q`, `theme`, `date_from`, `date_to`, `sort`, `user_age`, `free`, `user_latitude`, `user_longitude`, `distance`, `limit`, `offset`; coordinate/distance pairing checks | 200, 400 (JSON string or plain text "Invalid filter or incomplete data"; `BadRequestException` for dates) | `Party` entity list | B `index.js:43,497`, `backend-functions.js:22,50,64,79`, `listPartys.js:103`, `profile.js:277`, `addParty.js:524`, `script.js:64`; I `PartyHubiOSApp.swift:134`, `PartyView.swift:168`; H | Match on route. Branch composition/pagination G034; entity exposure G030. |
| 15 | POST `/api/parties` | JSON `PartyCreateDto` `@Valid` (Default group only) | 201, 400, 404 | created party / error | B `addParty.js:1215`, `script.js:139`; I `PartyFormView.swift:293`; H | Match. Validation activation G029. |
| 16 | GET `/api/parties/{id}` | path id; optional caller | 200, 404 (not visible = not found) | `Party` entity | B `backend-functions.js:98`, `gallery.js:28`, `advancedPartyInfos.js:119`, `addParty.js:516`, `notifications.js:217`, `profile.js:1676` | Match. |
| 17 | DELETE `/api/parties/{id}` | path id | 204, 400, 403, 404 | empty / JSON string error | B `backend-functions.js:127`; I `PartyView.swift:282` | Match. |
| 18 | PUT `/api/parties/{id}` | JSON `PartyCreateDto`; null body → 400 | 200, 400, 404 (no ownership 403; G003) | updated party | B `addParty.js:1214`; I `ApiService.swift:21`, `PartyDetailView.swift:472` | Match. Replacement vs partial is Q014; clients overwriting lifecycle fields is G030. |
| 19 | PUT `/api/parties/device-token?token=` | query token | 200, 400 (plain text) | empty | No client | Duplicate of row 58. Push unsupported (D020, G044). |
| 20 | POST `/api/parties/{id}/join` | path id | 204, 400, 404 | empty/error | B `api.js:9`, `backend-functions.js:138`, `script.js:92`, `advancedPartyInfos.js:291`; I `InvitationsViewModel.swift:63` | Match. |
| 21 | DELETE `/api/parties/{id}/join` | path id | 200, 400, 404 | status body | B `api.js:29`, `backend-functions.js:150`, `script.js:112`; I `InvitationsViewModel.swift:81` | Match. |
| 22 | GET `/api/parties/{id}/join/status` | path id | 200, 400, 404 | attendance status/count | B `api.js:47`, `advancedPartyInfos.js:177` | Match. |
| 23 | GET `/api/parties/{id}/invited-members` | path id | 200, 404 | `InvitedMemberDto[]` | B `advancedPartyInfos.js:348`, `addParty.js:568`; I `PartyAttendeeMapView.swift:179`, `UserLocationListView.swift:31` | Match on route. Audience G032; iOS attendee-location use is deferred (D022, G053). |
| 24 | GET `/api/parties/{id}/joined-members` | path id | 200, 404 | member list | B `advancedPartyInfos.js:373` | Match. |
| 25 | GET `/api/parties/{id}/invitation-stats` | path id | 200, 404, 400 (`BadRequestException`) | `InvitationStatsDto` | No client | Server-only surface. |
| 26 | POST `/api/parties/{partyId}/media/upload` | multipart `FileUploadInput` | 200, 400, 404, 500 | media reference JSON | No client (browser gallery has no upload call; iOS photos are local) | Server-only. UI gap G014/G038; storage G037/G058. |
| 27 | GET `/api/parties/{id}/can-edit` | path id | 200, 404 | `{canEdit, role, partyId, userId}` | No client | Server-only. |
| 28 | GET `/api/parties/{id}/locations` | path id | 200, 404 | `UserLocation` list | B `index.js:72`; I `UserLocationViewModel.swift:44` | **Deferred/unsupported** (D022). Containment is a backlog item; G051/G053. |
| 29 | GET `/api/parties/{id}/media` | path id | 200, 404 | `MediaDto[]` | B `backend-functions.js:162`, `gallery.js:45`, `advancedPartyInfos.js:598`; H | Match on route. Viewer boundary G036. |
| 30 | GET `/api/qr/generate` | optional ignored `userId` | 200, 500 | QR payload | B `profile.js:698`, `register_login/qr-login.html:115`; H | **Deferred** (D021); G046/G049. |
| 31 | GET `/api/qr/status/{token}` | path token | 200, 404 | status | B `qr-login.html:137`; H | Deferred; G047. |
| 32 | GET `/api/qr/image/user/{userId}` | path id | 200 PNG, 404, 500 | image | No client; H | Deferred; G047. |
| 33 | GET `/api/qr/image/{token}` | path token | 200 PNG, 404, 500 | image | No client; H | Deferred. |
| 34 | POST `/api/qr/exchange` | JSON token | 200, 400, 404 | mobile token | No client; H | Deferred; G048. |
| 35 | POST `/api/qr/mobile/me` | JSON/header token | 200, 400, 401, 500 | user id | No client | Deferred; G008/G048. |
| 36 | POST `/api/users` | JSON `UserCreateDto`, `@Valid` with no constraints | 201 | created user | No client; H setup | Q011; no validation (G064). |
| 37 | GET `/api/users?q=` | optional `q` | 200 | `User` entity list | B `backend-functions.js:174`, `addParty.js:336`, `profile.js:1380,1491`, `script.js:4`; H | Match on route. Raw fields G026. |
| 38 | GET `/api/users/{id}` | path id | 200, 404 | `User` entity | B `backend-functions.js:185`, `editProfile.js:27`, `profile.js:1000`; I `ProfileView.swift:253`; H | Match. |
| 39 | GET `/api/users/handle/{distinctName}` | path handle | 200, 404 | `User` entity | B `editProfile.js:202`, `profile.js:984` | Match. |
| 40 | GET `/api/users/username/{username}` | path username | 200, 404 | `User` entity | No client | Server-only. |
| 41 | GET `/api/users/me` | bearer | 200 | `User` entity | B `auth-service.js:399`, `notifications.js:37`; I `KeycloakAuthService.swift:233` | Match (AUTH). |
| 42 | GET `/api/users/{id}/followers/count` | path id | 200, 404 | JSON string `{"count": n}` | I `ProfileView.swift:258`; H | Match. |
| 43 | GET `/api/users/{id}/following/count` | path id | 200, 404 | JSON string `{"count": n}` | I `ProfileView.swift:263`; H | Match. |
| 44 | PUT `/api/users/{id}` | JSON `UserCreateDto`, no constraints; all five fields overwritten | 200, 403, 404 | `User` entity | B `editProfile.js:246` | Match on route. Missing validation G064; field exposure G026. |
| 45 | GET `/api/users/{id}/profile-picture` | path id; iOS adds `?v=` cache key | 200 image or default SVG, 404 | image | B `backend-functions.js:195`, `editProfile.js:49,318`, `profile.js:380,1034,1250`, `notifications.js:790+`, `advancedPartyInfos.js:468`; I `ApiService.swift:62`; H | Match. Anonymous read G039. |
| 46 | GET `/api/users/{id}/profile-picture-filename` | path id | 200, 404 | filename | B `editProfile.js:314`; I `ApiService.swift:110`; H | Match. |
| 47 | POST `/api/users/{id}/upload-profile-picture` | multipart | 200 `{"filename"}`, 403, 404, 500 | JSON string | B `editProfile.js:289`; I `ProfileView.swift:322` | Match. Validation G039. |
| 48 | GET `/api/users/{id}/followers` | path id | 200 | `User` list | B `backend-functions.js:329`, `profile.js:170`, `addParty.js:326`; H | Match. |
| 49 | GET `/api/users/{id}/following` | path id | 200 | `User` list | B `backend-functions.js:341`, `profile.js:184`, `addParty.js:327`; I `MapView.swift:690`, `InviteUsersView.swift:17`, `PartyAttendeeMapView.swift:201`, `UserLocationListView.swift:108`; H | Match. |
| 50 | GET `/api/users/{id}/follow-requests` | path id | 200 | `User` list | B `backend-functions.js:441`, `profile.js:217`, `notifications.js:294`; H | Match on route; recipient privacy G027. |
| 51 | GET `/api/users/{userId1}/followers/{userId2}/status` | two ids | 200 | boolean | B `backend-functions.js:353`, `profile.js:202`; H | Match; G027. |
| 52 | POST `/api/users/{id}/follow?targetUserId=` | query target; path `id` ignored | 201, 400, 409 | follow / empty | B `backend-functions.js:380`, `profile.js:243`; H | Match on route; path meaning G024. |
| 53 | PUT `/api/users/{id}/followers/{followerId}` | path ids; `id` ignored | 200, 404 | follow | B `notifications.js:338` | Match; G024. |
| 54 | DELETE `/api/users/{id}/followers/{followerId}` | path ids; removes caller → `id` | 204, 404 | empty | B `backend-functions.js:409`, `profile.js:269`, `notifications.js:351` | Match on route; inconsistent path meaning G024. |
| 55 | GET `/api/users/location/{id}` | path id used as the location primary key | 200, 404 | `UserLocation` | No matching client (browser calls `/api/users/{id}/location`); H | **Deferred** (D022); G051/G052. |
| 56 | PUT `/api/users/location` | JSON `UserLocationUpdateDto` with lat/long range | 200, 400, 404 | `UserLocation` | I `UserLocationViewModel.swift:65`; H | **Deferred**; G052/G053. |
| 57 | GET `/api/users/{id}/media` | path id | 200 | media list | No client; H | Server-only; Viewer boundary G036. |
| 58 | PUT `/api/users/device-token?token=` | query token | 200, 400 (empty) | empty | No client | Duplicate of row 19; push unsupported. |

## Client calls without a matching endpoint

| Client call site | Call | Nearest backend contract | Disposition |
|---|---|---|---|
| B `backend-functions.js:112` | POST `/api/party/{id}` | Row 18 PUT `/api/parties/{id}` | Stale singular route (G006). D024: no redirect; fix the client. |
| B `gallery.js:89,166,195` | GET `/api/media/{id}` (image `src`) | No REST route; `MediaRepository.getMediaById` helper only | Missing serving route (G036). The media item contract is MEDIA-01/MEDIA-03; the route choice is a remediation item. |
| B `script.js:4,50` | `${BASE_URL}/api/users`, `/api/media/1` on an old remote host | Rows 37 / none | Prototype script (inventory); retire or fix in Step 12 backlog. |
| B `index.js:396` | GET `/api/users/{id}/location` | Row 55 uses `/api/users/location/{id}` | Deferred feature plus route mismatch (D022, G053). |
| I `Partynotificationsystem.swift:390` | GET `/api/party/{id}/attendees` | Rows 23/24 | Stale singular route (G006). |
| I `Partynotificationsystem.swift:419` | GET `/api/party/{id}` | Row 16 | Stale singular route (G006). |
| I `PartyView/PartyDetailView.swift:339` | PUT `/api/party/{id}?user=` | Row 18 | `#if DEBUG` simulation, unreachable; remove with G006. |
| I `Partynotificationsystem.swift:567`, `PartyHubiOSApp.swift:279` | POST `/api/users/{id}/device-token` | Rows 19/58 (PUT, query token, caller-derived) | Method/path/payload mismatch; push unsupported (D020, G044). |

Endpoints with no browser or iOS caller: 5, 9, 10, 12, 13, 19, 25, 26, 27, 32-36, 40, 57, 58. Being server-only is not a defect by itself. Rows 12/13/26 have accepted client-facing requirements whose UI support is tracked in G045/G014.

## README and static OpenAPI claims

| Source | Claim | Disposition |
|---|---|---|
| README:140 | `/api/auth/*` | No such resource. Identity is Keycloak plus rows 1/41 (G004). Correct in Step 12. |
| README:141 | `/api/users/*` | Exists (rows 12-13, 36-58). |
| README:142 | `/api/parties/*` | Exists (rows 14-29). |
| README:143 | `/api/categories/*` | No resource. Parties use `theme` (PARTY-11). Stale documentation (G004). |
| README:144 | `/api/media/*` | No resource. Media is party/user scoped (rows 26, 29, 57) plus the missing serving route (G036). |
| README:145 | `/api/invitations/*` | Exists (rows 2-7). |
| README:146 | `/api/follow/*` | No resource. Follow operations are under `/api/users/{id}/...` (rows 48-54). |
| `openapi.yaml` (root, 48 operations) | Documents 46 of the 58 endpoints. It omits rows 1, 5-7, 12, 13, 19, 23-26 and 58, lists `POST /api/parties/{id}/media` instead of row 26's `/{partyId}/media/upload`, and lists a non-existent `GET /api/media/{id}` | Stale hand-written document outside `META-INF`, so it is not served; `/q/openapi` is generated from annotations (G063). |

## Verification

- All 58 inventoried endpoints appear once, in inventory order.
- Every browser/iOS `/api/` call site found by `grep` over `*.js`, `*.html` and `*.swift` (excluding `._*` AppleDouble files) is either listed in a row's Callers column or in the unmatched table. Dynamic URL construction outside literal `/api/` strings was not traced.
- Every README route claim and every static OpenAPI operation is dispositioned.
