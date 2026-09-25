# Profiles and social relationships review

Group 3 source review began 2026-09-23 and specification integration completed 2026-09-25. The proposal checkpoint starts at `6866f3fed3d6a438d3e6a9463a1e6b14da88419f`; application source remains the foundation source snapshot from `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. This document separates accepted SOC-01-SOC-06 behavior from observed source after integrating `document-profiles-and-social-relationships`. No application source, configuration or data is changed here.

Read this with [coverage](coverage.md), [access matrix](access-matrix.md), [decisions](decisions.md), [gaps](gaps.md) and the accepted [social-and-notifications spec](../../openspec/specs/social-and-notifications/spec.md). Profile-picture file validation/storage belongs to Step 7, notification delivery belongs to Step 8, and final API schemas/statuses belong to Step 11.

## Evidence index

| ID | Inspected evidence |
|---|---|
| P1 | [User.java](../../src/main/java/at/htl/user/User.java), [UserCreateDto.java](../../src/main/java/at/htl/user/UserCreateDto.java), [UserResource.java](../../src/main/java/at/htl/user/UserResource.java) and [UserRepository.java](../../src/main/java/at/htl/user/UserRepository.java): stored fields, list/search/read, current-user lookup and self update. |
| P2 | Browser [profile.js](../../src/main/resources/META-INF/resources/profile/profile.js), [profile.html](../../src/main/resources/META-INF/resources/profile/profile.html), [editProfile.js](../../src/main/resources/META-INF/resources/editProfile/editProfile.js) and [editProfile.html](../../src/main/resources/META-INF/resources/editProfile/editProfile.html): profile search/read, counts/lists, follow actions, hosted-party cards and self edit. |
| P3 | iOS [ProfileView.swift](../../PartyHubiOS/PartyHubiOS/ProfileView.swift), [APIClient.swift](../../PartyHubiOS/PartyHubiOS/APIClient.swift) and [UserProfileImageView.swift](../../PartyHubiOS/PartyHubiOS/UserProfileImageView.swift): authenticated self profile, counts, picture upload and client data shape. |
| F1 | [Follow.java](../../src/main/java/at/htl/follow/Follow.java), [FollowStatus.java](../../src/main/java/at/htl/follow/FollowStatus.java), [FollowRepository.java](../../src/main/java/at/htl/follow/FollowRepository.java) and `UserResource` follow routes: directed PENDING/ACCEPTED rows and mutation semantics. |
| F2 | Browser profile/search and [notifications.js](../../src/main/resources/META-INF/resources/notifications/notifications.js): request, pending detection, accept, dismiss and unfollow call sites. The standalone follower-list page is static and its JavaScript file is empty. |
| F3 | [FollowRepositoryTest.java](../../src/test/java/at/htl/repository/FollowRepositoryTest.java), [FollowTest.java](../../src/test/java/at/htl/follow/FollowTest.java), [FollowStatusTest.java](../../src/test/java/at/htl/follow/FollowStatusTest.java), [UserRepositoryTest.java](../../src/test/java/at/htl/repository/UserRepositoryTest.java), [UserResourceTest.java](../../src/test/java/at/htl/resource/UserResourceTest.java), [follow.http](../../api/follow.http) and [user.http](../../api/user.http). Tests/requests were inspected but not run. |
| V1 | [PartyResource.java](../../src/main/java/at/htl/party/PartyResource.java), [PartyRepository.java](../../src/main/java/at/htl/party/PartyRepository.java) and browser profile party filtering: profile party context is derived from the general visible-party query, then filtered by host. |

## Profile field contract

The current REST reads serialize the `User` entity directly. That can expose fields that browser screens do not render, so raw source output is not treated as the intended profile contract. The bounded contract below resolves Q009 through accepted SOC-04-SOC-06 while keeping source mismatches in G026-G027.

| Field / surface | Observed source | Accepted profile disposition |
|---|---|---|
| `id` | Generated database identifier used by routes and clients. | Stable profile reference in self and cross-user projections; never authentication evidence. |
| `displayName` | Stored, rendered by both clients, browser-editable. | Cross-user profile/search display field; authenticated self may edit it. |
| `distinctName` | Stored handle; exact lookup is case-insensitive and search performs a case-insensitive substring match. Database column is not declared unique. | Unique public profile handle and supported search/navigation identifier; authenticated self may edit it subject to server validation/conflict rejection. |
| `biography` | Stored, browser-editable and rendered by iOS; the browser profile page does not currently render it. | Cross-user profile field; authenticated self may edit it. Exact length policy stays an API-validation matter unless accepted separately. |
| `username` | Keycloak/user-link input; iOS currently displays it as the handle fallback and an open exact lookup route returns raw users. | Self-visible identity descriptor, not a generally searchable/editable profile handle. `distinctName` remains the social handle. |
| `email` | Stored and browser-editable; raw user responses expose it. | Private self field; excluded from cross-user search/profile/social projections. |
| `phoneNumber` | Stored and accepted by the DTO; not present in the browser edit form, but decoded by iOS. | Private self field; excluded from cross-user projections. Client support remains source evidence rather than a parity guarantee. |
| `keycloakId` | Stored external subject link; raw user responses can serialize it. | Internal identity-link field; never included in profile/search/follow projections and not profile-editable. |
| `deviceToken` | Stored delivery token; raw user responses can serialize it. | Internal notification-delivery field; never included in profile/search/follow projections and not profile-editable. |
| Profile picture | Separate entity and read/upload endpoints; browser and iOS display it. | Profile-facing image reference/placeholder. Upload, replacement, validation and storage remain Step 7. |
| Follower/following counts and accepted lists | Separate open endpoints backed by accepted rows. | Social context for authenticated profile viewers using the bounded profile projection for each listed user. |
| Pending follow requests | Open path-ID endpoint returns requesters for any target. | Private inbox visible only to the authenticated recipient; it is not cross-user profile context. |
| Hosted parties | Browser fetches the general party list and filters it by host. | Self sees their visible/hosted context; another authenticated viewer sees the target's public parties plus private parties to which that viewer was invited, preserving D008. |

The accepted cross-user/search projection is limited to `id`, `displayName`, `distinctName`, `biography`, profile-picture reference/placeholder and accepted follower/following counts. Email, phone number, provider username, Keycloak subject and device token are excluded. Profile-picture transport remains Step 7.

## Access and client scope

| Operation | Accepted intended access | Observed behavior and disposition |
|---|---|---|
| Search/list profiles | Authenticated-user access returning the bounded search projection; case-insensitive `distinctName` search is the minimum supported query. | Rows 37/39 are open and serialize full entities; row 40 exposes exact provider-username lookup. G026. |
| Read another profile | Authenticated-user access to the bounded cross-user projection. | Row 38 is open and returns the entity. Browser supports ID/handle profiles; iOS has no other-user profile navigation. G026/G028. |
| Read own profile | AUTH-01/08 authenticated self, including private editable fields but excluding internal credentials/delivery tokens. | `/me` and ID reads return the same entity shape. G026. |
| Edit profile text | Authenticated self only; editable fields are display name, distinct handle, email, phone and biography. Provider username, Keycloak link, device token and database ID are not profile-editable. | Row 44 correctly compares the token-resolved user with the path ID, but server-side field validation/handle uniqueness are incomplete. G026. |
| Read accepted counts/lists | Authenticated profile viewers; listed users use the bounded cross-user projection. | Rows 42/43/48/49 are open and return counts or raw users. G026. |
| Read pending requests | Authenticated recipient only. | Row 50 accepts any path ID without authentication/self check. G027. |
| Read relationship status | Authenticated caller may inspect their own directed relationship with a target. | Row 51 permits arbitrary pair queries. G027. |
| Send/accept/reject/remove | Actor comes only from validated identity; target/path identifiers select the other user or relationship and never replace the actor. | Rows 52-54 ignore one or more path values. Existing browser happy paths happen to align for send/accept/unfollow, while incoming-request dismissal uses the wrong direction. G024/G027. |
| Profile-created parties | D008 and D007: authenticated viewer gets public parties plus private parties for which that viewer qualifies; another user's profile does not grant extra party access. | Browser reuses `/api/parties` visibility and filters by host; source gaps on some party-query branches remain G009 and later Steps 4/6. |

Browser evidence covers search, other-user profiles, follow/request state, accepted lists and hosted-party context, plus authenticated self edit. iOS evidence covers authenticated self profile, counts and picture upload. Its Follow and Message buttons have empty actions and it has no profile search, other-user profile or follow-request inbox. The bounded change records those differences and does not infer iOS parity from the browser implementation.

## Follow transition model

A directed relationship is keyed as `requester/follower A -> target/recipient B`. PENDING and ACCEPTED are relationship states; mutual contact is derived only when both directed rows are ACCEPTED. Exact HTTP status codes and final route shapes remain Step 11 work.

| Prior A→B | Action and authorized actor | Next A→B | Reverse B→A | Required outcome |
|---|---|---|---|---|
| None | A requests B | PENDING | Unchanged | Create one pending row; do not create an accepted or reverse relationship. |
| None | A requests A | None | Same relation | Reject self-follow without creating a row. |
| PENDING | A repeats request to B | PENDING | Unchanged | Do not create a duplicate row or notification-equivalent request. |
| ACCEPTED | A repeats request to B | ACCEPTED | Unchanged | Do not create a duplicate or downgrade the relationship. |
| PENDING | B accepts A's request | ACCEPTED | Unchanged | Only the recipient can accept; acceptance creates one-way A→B following. Step 8 owns notification side effects. |
| PENDING | Any user other than B attempts acceptance | PENDING | Unchanged | Reject without changing the relationship. |
| PENDING | A cancels the outgoing request | None | Unchanged | Remove only A→B. |
| PENDING | B rejects/removes the incoming request | None | Unchanged | Remove only A→B. |
| ACCEPTED | A unfollows B | None | Unchanged | Remove only A→B. |
| ACCEPTED | B removes follower A | None | Unchanged | Remove only A→B. |
| Missing/other state | Accept/remove is repeated | Unchanged | Unchanged | Do not create a relationship or change the reverse direction; response idempotency/status is an API-contract decision. |

Mutual contact is false for zero, one or pending directions. It becomes true only when A→B and B→A are both ACCEPTED. Removing either accepted direction makes mutual contact false while preserving the other accepted direction.

## Evidence and completion limits

- Source supports PENDING creation, duplicate conflict, recipient acceptance, accepted counts/lists/status and removal of a supplied directed row. The repository does not reject self-follow or verify referenced users before persisting.
- `FollowRepositoryTest` asserts several repository outcomes, including duplicate conflict, one-way acceptance and two acceptance notifications. It does not cover self-follow, unauthorized acceptance, crossed requests, recipient rejection/removal, repeated removal or preservation of the reverse direction.
- Existing resource tests mostly assert anonymous 401/not-found shapes and use synthetic/bypass authentication elsewhere. HTTPYac files use `X-User-Id`; they do not verify the accepted bearer identity boundary.
- No backend tests, browser flows, iOS flows, database, Keycloak or HTTPYac requests were executed for Group 3.
- The field/access and transition contract is accepted in SOC-01/SOC-04-SOC-06. Application mismatches remain gaps rather than implementation tasks in this documentation stage.
