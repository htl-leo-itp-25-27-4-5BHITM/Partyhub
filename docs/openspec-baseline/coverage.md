# Requirement and scenario coverage baseline

Foundation snapshot: repository revision `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, inspected 2026-09-21. See [runbook](runbook.md), [inventory](inventory.md), [decisions](decisions.md), [gaps](gaps.md) and [handoff](handoff.md).

The foundation snapshot indexed **37 accepted requirements and 106 scenarios** in the six durable specifications. After the accepted Step 2 identity and Step 3 profiles/social integrations, the current main specs contain **42 accepted requirements and 145 scenarios**. Acceptance records normative coverage; it does not assert implementation compliance, complete product scope or completion of Steps 4–12. Requirement titles and scenario labels below reproduce the current main specs exactly.

Platform scope below is a foundation classification grounded in the requirement text, archive context and source entry points. Where existing wording is ambiguous, its owner stage must reconcile it. In particular, browser auth does not establish the iOS auth contract, and iOS map controls are not automatically browser requirements.

**Evidence limit for every entry:** source was inspected; application, browser, iOS, Keycloak, Compose, JUnit and HTTPYac runtime tests were not run. Each scenario inherits its requirement's source evidence and limitations unless specifically distinguished. A related test file or method is a review lead, not proof that its scenario is covered or passing. Where no matching test was identified, that is the result of this bounded foundation review rather than a claim that none can exist.

| Capability | Requirements | Scenarios | Main owner stage |
|---|---:|---:|---|
| [user-auth-and-identity](../../openspec/specs/user-auth-and-identity/spec.md) | 12 | 43 | 2 |
| [social-and-notifications](../../openspec/specs/social-and-notifications/spec.md) | 6 | 35 | 3, 5, 8 |
| [party-discovery-and-management](../../openspec/specs/party-discovery-and-management/spec.md) | 11 | 33 | 4–6 |
| [party-media-gallery](../../openspec/specs/party-media-gallery/spec.md) | 3 | 5 | 7 |
| [map-radius-control](../../openspec/specs/map-radius-control/spec.md) | 3 | 7 | 6 (Purpose repair 12) |
| [local-keycloak-environment](../../openspec/specs/local-keycloak-environment/spec.md) | 7 | 22 | 11 |
| **Total** | **42** | **145** | **All assigned** |

## Source and test evidence groups

Paths below are relative links from this document to repository evidence. They identify the source inspected and the relevant tests found, keeping code observations separate from accepted decisions.

### E01

**Browser authentication.** [src/main/resources/META-INF/resources/auth-service.js](../../src/main/resources/META-INF/resources/auth-service.js); [src/main/resources/META-INF/resources/auth/callback.html](../../src/main/resources/META-INF/resources/auth/callback.html); [src/main/resources/META-INF/resources/register_login/login/login.js](../../src/main/resources/META-INF/resources/register_login/login/login.js); [PartyHubiOS/PartyHubiOS/KeycloakAuthService.swift](../../PartyHubiOS/PartyHubiOS/KeycloakAuthService.swift).

Observed: `auth-service.js` contains login PKCE generation, callback/state handling, refresh, sessionStorage, `/api/users/me` lookup, bearer API calls and logout. The iOS auth service is a separate implementation now covered by accepted AUTH-10–AUTH-12; G022 and G023 record source mismatches against that contract.

Test evidence: No matching automated browser PKCE/session or iOS Keycloak scenario test was identified in the inventoried suites. These flows were not exercised.

### E02

**Backend identity and authentication configuration.** [src/main/java/at/htl/auth/CurrentUserResolver.java](../../src/main/java/at/htl/auth/CurrentUserResolver.java); [src/main/java/at/htl/auth/XUserIdAuthFilter.java](../../src/main/java/at/htl/auth/XUserIdAuthFilter.java); [src/main/java/at/htl/user/UserRepository.java](../../src/main/java/at/htl/user/UserRepository.java); [src/main/resources/application.properties](../../src/main/resources/application.properties); [k8s/quarkus.yaml](../../k8s/quarkus.yaml); [src/test/resources/application.properties](../../src/test/resources/application.properties); [src/test/java/at/htl/auth/CurrentUserResolverTest.java](../../src/test/java/at/htl/auth/CurrentUserResolverTest.java).

Observed: `CurrentUserResolver` resolves linked subjects, links unlinked users, or creates users; it also accepts a numeric principal path. The custom authentication mechanism accepts `X-User-Id` when bypass is enabled. Main configuration declares issuer/JWKS and realm-role mapping; profile and deployment overrides need Step 2 reconciliation.

Test evidence: `resolvesLinkedUserBySubject`, `linksExistingUnlinkedUserOnFirstLogin`, and `createsMinimalUserForUnmatchedAuthenticatedSubject` contain assertions for subject linkage/user creation using `@TestSecurity`. They do not validate real Keycloak tokens. Test configuration disables SmallRye JWT and enables bypass; no runtime tests were run.

### E03

**Authenticated business entry points.** [src/main/java/at/htl/party/PartyResource.java](../../src/main/java/at/htl/party/PartyResource.java); [src/main/java/at/htl/user/UserResource.java](../../src/main/java/at/htl/user/UserResource.java); [src/main/java/at/htl/notification/NotificationResource.java](../../src/main/java/at/htl/notification/NotificationResource.java); [src/test/java/at/htl/resource/PartyResourceTest.java](../../src/test/java/at/htl/resource/PartyResourceTest.java); [src/test/java/at/htl/resource/NotificationResourceTest.java](../../src/test/java/at/htl/resource/NotificationResourceTest.java).

Observed: Party create/join/leave and notification entry points use `CurrentUserResolver`; protected route annotations are source evidence, not a complete access matrix.

Test evidence: `PartyResourceTest` has `testCreateParty_noUser`, `testJoinParty_noUser`, and `testLeaveParty_noUser` as domain-audit candidates; their names alone do not establish scenario coverage. `NotificationResourceTest.testGetNotifications_noUser` asserts 401; its with-user test sends `X-User-Id` and asserts 200/non-null content, not token identity or recipient isolation. No runtime tests were run.

### E04

**Follow relationships and profiles.** [src/main/java/at/htl/follow/FollowRepository.java](../../src/main/java/at/htl/follow/FollowRepository.java); [src/main/java/at/htl/user/UserResource.java](../../src/main/java/at/htl/user/UserResource.java); [src/main/java/at/htl/user/UserRepository.java](../../src/main/java/at/htl/user/UserRepository.java); [src/main/resources/META-INF/resources/profile/profile.js](../../src/main/resources/META-INF/resources/profile/profile.js); [PartyHubiOS/PartyHubiOS/ProfileView.swift](../../PartyHubiOS/PartyHubiOS/ProfileView.swift); [src/test/java/at/htl/repository/FollowRepositoryTest.java](../../src/test/java/at/htl/repository/FollowRepositoryTest.java); [src/test/java/at/htl/resource/UserResourceTest.java](../../src/test/java/at/htl/resource/UserResourceTest.java); [api/follow.http](../../api/follow.http); [api/user.http](../../api/user.http).

Observed: `FollowRepository` creates pending relationships, accepts one direction, and queries accepted followers/following. User resource/repository expose identifier lookup and search. Browser/iOS profile files are consumer entry points; full cross-client behavior is unverified.

Test evidence: `testCreateFollowRequest` asserts 201, not persisted pending state; `testAcceptFollowRequest` asserts accepted forward following and two notification messages, not absence of reverse following or the entire mutual-contact rule. Profile resource tests and HTTPYac files are inventory references pending assertion-to-scenario review. No runtime tests were run.

### E05

**Party invitations and attendance.** [src/main/java/at/htl/party/PartyRepository.java](../../src/main/java/at/htl/party/PartyRepository.java); [src/main/java/at/htl/invitation/InvitationRepository.java](../../src/main/java/at/htl/invitation/InvitationRepository.java); [src/main/java/at/htl/invitation/InvitationResource.java](../../src/main/java/at/htl/invitation/InvitationResource.java); [src/main/resources/META-INF/resources/notifications/notifications.js](../../src/main/resources/META-INF/resources/notifications/notifications.js); [src/test/java/at/htl/repository/InvitationRepositoryTest.java](../../src/test/java/at/htl/repository/InvitationRepositoryTest.java); [src/test/java/at/htl/resource/InvitationResourceTest.java](../../src/test/java/at/htl/resource/InvitationResourceTest.java); [src/test/java/at/htl/repository/PartyRepositoryTest.java](../../src/test/java/at/htl/repository/PartyRepositoryTest.java); [api/invitation.http](../../api/invitation.http).

Observed: `inviteSelectedUsersForPrivateParty` creates/renews invitations; its inspected path has no mutual-follow check. `attendParty` marks an existing invitation accepted on join; `leaveParty` changes it to declined. This is partial source evidence and does not establish authorized transitions or all repeat-action behavior.

Test evidence: Invitation tests and party repository methods such as `testAddPrivatePartyInvitesSelectedUserById` are audit candidates. No test asserting non-mutual invite rejection or the exact join-to-accepted/leave-to-declined pair was confirmed in this foundation pass; none was run.

### E06

**Notifications.** [src/main/java/at/htl/notification/NotificationResource.java](../../src/main/java/at/htl/notification/NotificationResource.java); [src/main/java/at/htl/notification/NotificationRepository.java](../../src/main/java/at/htl/notification/NotificationRepository.java); [src/main/java/at/htl/party/PartyRepository.java](../../src/main/java/at/htl/party/PartyRepository.java); [src/main/java/at/htl/follow/FollowRepository.java](../../src/main/java/at/htl/follow/FollowRepository.java); [src/main/resources/META-INF/resources/notifications/notifications.js](../../src/main/resources/META-INF/resources/notifications/notifications.js); [PartyHubiOS/PartyHubiOS/Partynotificationsystem.swift](../../PartyHubiOS/PartyHubiOS/Partynotificationsystem.swift); [src/test/java/at/htl/repository/NotificationRepositoryTest.java](../../src/test/java/at/htl/repository/NotificationRepositoryTest.java); [src/test/java/at/htl/resource/NotificationResourceTest.java](../../src/test/java/at/htl/resource/NotificationResourceTest.java).

Observed: Notification resources/repository expose list, unread, read and delete operations; party/follow repositories contain event producers and both clients have notification surfaces. Delivery and all event-to-recipient mappings remain Step 8 work.

Test evidence: `NotificationRepositoryTest.testMarkAsRead_success` asserts stored READ state; `testDeleteNotification_success` asserts 204 only. Wrong-user tests assert 403. These do not prove client rendering or complete event generation. Resource tests exercise bypass identity; none was run.

### E07

**Party visibility, discovery, detail and lifecycle.** [src/main/java/at/htl/party/PartyResource.java](../../src/main/java/at/htl/party/PartyResource.java); [src/main/java/at/htl/party/PartyRepository.java](../../src/main/java/at/htl/party/PartyRepository.java); [src/main/java/at/htl/party/PartyCreateDto.java](../../src/main/java/at/htl/party/PartyCreateDto.java); [src/main/resources/META-INF/resources/index.js](../../src/main/resources/META-INF/resources/index.js); [src/main/resources/META-INF/resources/advancedPartyInfos/advancedPartyInfos.js](../../src/main/resources/META-INF/resources/advancedPartyInfos/advancedPartyInfos.js); [src/main/resources/META-INF/resources/backend-functions.js](../../src/main/resources/META-INF/resources/backend-functions.js); [PartyHubiOS/PartyHubiOS/PartyView/PartyDetailView.swift](../../PartyHubiOS/PartyHubiOS/PartyView/PartyDetailView.swift); [src/test/java/at/htl/resource/PartyResourceTest.java](../../src/test/java/at/htl/resource/PartyResourceTest.java); [src/test/java/at/htl/repository/PartyRepositoryTest.java](../../src/test/java/at/htl/repository/PartyRepositoryTest.java); [api/party.http](../../api/party.http).

Observed: `getPartiesByUser` distinguishes public, hosted, invited and joined results; the detail route calls `getPartyByIdIfVisible`. Legacy search/theme/date/sort branches omit that viewer predicate. Create derives the host from the caller, delete checks the stored host, and update sets the caller as host without first checking the existing host. DTO validation has range/length annotations but grouped required rules and cross-field/location constraints are incomplete. Browser/iOS lifecycle callers have the route, authentication and field-preservation differences recorded in [party-lifecycle.md](party-lifecycle.md).

Test evidence: `PartyResourceTest.testDeleteParty_owner` and `testDeleteParty_notOwner` assert 204/403 under `@TestSecurity`; anonymous mutation and missing-party assertions also exist. Repository tests cover visibility normalization, selected private invitees and update/cancellation success cases. No inspected test establishes non-host update denial, immutable ownership, complete validation, every visibility branch, or client field preservation; none was run.

### E08

**iOS map filtering and radius.** [PartyHubiOS/PartyHubiOS/Map/MapView.swift](../../PartyHubiOS/PartyHubiOS/Map/MapView.swift); [PartyHubiOS/PartyHubiOS/Map/PartyMapFilter.swift](../../PartyHubiOS/PartyHubiOS/Map/PartyMapFilter.swift); [PartyHubiOS/PartyHubiOS/Map/PartyAttendeeMapView.swift](../../PartyHubiOS/PartyHubiOS/Map/PartyAttendeeMapView.swift); [src/main/resources/META-INF/resources/index.js](../../src/main/resources/META-INF/resources/index.js); [openspec/changes/archive/2026-05-26-add-party-map-filters/proposal.md](../../openspec/changes/archive/2026-05-26-add-party-map-filters/proposal.md); [openspec/changes/archive/2026-06-03-integrate-map-distance-slider/proposal.md](../../openspec/changes/archive/2026-06-03-integrate-map-distance-slider/proposal.md).

Observed: `MapView.filteredParties`, filter sheet/summary, reset, radius binding, rotated slider, `MapCircle`, location fallback and camera methods are present. Archived changes identify the iOS context; exact browser applicability and conflicting durable wording remain Step 6 decisions.

Test evidence: No matching automated iOS map interaction/filter/radius scenario test was identified. Backend filtering tests and HTTPYac filter requests do not validate these client behaviors. No client was run.

### E09

**Party media.** [src/main/java/at/htl/media/MediaRepository.java](../../src/main/java/at/htl/media/MediaRepository.java); [src/main/java/at/htl/party/PartyResource.java](../../src/main/java/at/htl/party/PartyResource.java); [src/main/resources/META-INF/resources/gallery/gallery.js](../../src/main/resources/META-INF/resources/gallery/gallery.js); [PartyHubiOS/PartyHubiOS/Photo/PhotoView.swift](../../PartyHubiOS/PartyHubiOS/Photo/PhotoView.swift); [PartyHubiOS/PartyHubiOS/Photo/PartyBilderView.swift](../../PartyHubiOS/PartyHubiOS/Photo/PartyBilderView.swift); [PartyHubiOS/PartyHubiOS/PartyView/PhotosSection.swift](../../PartyHubiOS/PartyHubiOS/PartyView/PhotosSection.swift); [src/test/java/at/htl/repository/MediaRepositoryTest.java](../../src/test/java/at/htl/repository/MediaRepositoryTest.java); [api/media.http](../../api/media.http).

Observed: Browser gallery code loads media and renders empty/error states; its inspected flow is read-only. iOS photo files are separate UI/local-storage entry points, not verified backend gallery uploads. Repository upload validates file input/type/size and writes files without an inspected party-visibility check or an end-time gate; listing/serving also need an access audit.

Test evidence: `MediaRepositoryTest.testGetMediaByParty_empty` and `testGetMediaByParty_withData` assert empty/list contents, not gallery UI or viewer authorization. `api/media.http` contains list requests. No matching upload-authorization/UI scenario test was confirmed; none was run.

### E10

**Local Compose and database bootstrap.** [docker-compose.yaml](../../docker-compose.yaml); [Dockerfile.keycloak](../../Dockerfile.keycloak); [docker/postgres/init/01-create-keycloak-db.sql](../../docker/postgres/init/01-create-keycloak-db.sql); [README.md](../../README.md); [openspec/changes/archive/2026-05-20-add-keycloak-compose/design.md](../../openspec/changes/archive/2026-05-20-add-keycloak-compose/design.md).

Observed: Compose declares one Postgres service, Keycloak built from an official-image Dockerfile, port 8000, shared network, dedicated database and initialization script. Startup, readiness and existing-volume remediation were not exercised. README/configuration drift is retained as evidence, not corrected in Step 1.

Test evidence: No matching automated Compose startup/bootstrap scenario test was identified. Configuration inspection cannot prove container startup or a successful import.

### E11

**Realm, frontend client and seeded users.** [keycloak/realm-dev.json](../../keycloak/realm-dev.json); [keycloak/realm-staging.json](../../keycloak/realm-staging.json); [docker-compose.yaml](../../docker-compose.yaml); [Dockerfile.keycloak](../../Dockerfile.keycloak); [src/main/resources/import.sql](../../src/main/resources/import.sql); [README.md](../../README.md); [src/test/java/at/htl/auth/CurrentUserResolverTest.java](../../src/test/java/at/htl/auth/CurrentUserResolverTest.java).

Observed: `realm-dev.json` declares partyhub, a public frontend client with standard flow/S256, disabled direct grants and local redirect/web origins, plus admin/demo users. Compose mounts that file while the image also copies a staging realm; runtime import selection is unverified. README's realm filename and documented demo password differ from the mounted file.

Test evidence: No realm-login or browser-to-real-Keycloak integration scenario was run. Resolver unit/integration-style tests use synthetic `@TestSecurity` identity and cannot prove imported users can log in.

### E12

**Core-discovery exclusions and later decisions.** [openspec/changes/archive/2026-05-20-capture-partyhub-functional-spec/design.md](../../openspec/changes/archive/2026-05-20-capture-partyhub-functional-spec/design.md); [openspec/changes/archive/2026-05-20-capture-partyhub-functional-spec/specs/party-discovery-and-management/spec.md](../../openspec/changes/archive/2026-05-20-capture-partyhub-functional-spec/specs/party-discovery-and-management/spec.md); [openspec/changes/archive/2026-05-26-add-party-map-filters/proposal.md](../../openspec/changes/archive/2026-05-26-add-party-map-filters/proposal.md); [openspec/changes/archive/2026-06-03-integrate-map-distance-slider/proposal.md](../../openspec/changes/archive/2026-06-03-integrate-map-distance-slider/proposal.md); [PartyHubiOS/PartyHubiOS/Map/MapView.swift](../../PartyHubiOS/PartyHubiOS/Map/MapView.swift).

Observed: The initial accepted core discovery excludes a requirement for live location; later approved iOS map changes add filters/radius. Source availability of live-location features does not remove the exclusion or establish extension scope.

Test evidence: This is specification-history evidence; no runtime test can resolve product scope. Step 6 reconciles later filters and Step 10 classifies extensions.

## Step 2 authentication review

Reviewed and integrated 2026-09-23 from source revision `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. [Authentication contract review](authentication.md) supplies platform-specific success/failure cases, [access matrix](access-matrix.md) covers all 58 routes including repository predicates, and [environment evidence](auth-environments.md) covers profile/test/Kubernetes overrides. The accepted main spec preserves AUTH-01–AUTH-09, renames AUTH-02 and AUTH-03 without changing their scenarios, extends AUTH-09 with an object-authority boundary, and adds AUTH-10–AUTH-12.

| Existing requirement | Source review and scenarios | Evidence disposition / gap |
|---|---|---|
| AUTH-01 | Browser B-LOGIN/B-ME/B-NO-SESSION; native N-ME uses the shared backend under AUTH-11. | Source-observed browser identity/guards, no UI execution; failed lookup G021. |
| AUTH-02 | S-REJECT/S-ACTOR; every Auth route traced in matrix, caller/path distinction explicit. | Accepted bearer policy conflicts with bypass G002 and numeric-subject ordering G019. |
| AUTH-03 | B-REGISTER, N-LOGIN/N-LINK; public-client realm files and client flows. | Keycloak is accepted current behavior; older narrative drift remains G001. Local creation scope Q011; registration flags G025. |
| AUTH-04 | B-LOGIN/B-CALLBACK/B-STATE/B-EXCHANGE; no password grant in inspected browser path. | Source-observed state/PKCE paths, no end-to-end validation; nonce hardening caveat G022. |
| AUTH-05 | B-RESTORE/B-API/B-REFRESH/B-INVALID-REFRESH/B-LOGOUT/B-ME-FAIL. | Facade code exists; transport/error cleanup limitations G021, execution G013. |
| AUTH-06 | B-RESTORE/B-CLEAR/B-LOGOUT; sessionStorage/memory, legacy localStorage clearing. | Storage source-observed only; native Keychain is separately governed by AUTH-12. |
| AUTH-07 | S-REJECT and environment JWT/roles declaration. | No real valid/expired/wrong-issuer token verification; test JWT disabled, bypass enabled. G002/G013. |
| AUTH-08 | S-LINKED/S-MATCH/S-NEW; B-ME/N-ME success/failure paths. | Three resolver tests contain synthetic happy-path assertions, not executed. Numeric-subject G019, claim ambiguity G020/Q012; no onboarding-required UI/response found. Existing create-or-onboard alternative preserved. |
| AUTH-09 | Matrix creation/membership/notification actor checks, plus the accepted object-authority denial boundary. | Actor resolution does not prove object authorization: G003/G009/G017/G024; profile/social policy D015 and remaining invitation/party policy Q010. |
| AUTH-10 | B1/N2/CR public issuer bootstrap and failure fallback. | Public configuration is accepted but does not authenticate a caller; deployment/profile drift remains G002/G018. |
| AUTH-11 | N-LOGIN/N-CALLBACK/N-LINK success and failure paths. | Native PKCE/user-resolution contract is accepted; nonce mismatch remains G022 and runtime execution remains G013. |
| AUTH-12 | N-RESTORE/N-REFRESH/N-API/N-LOGOUT lifecycle. | Native token-backed session contract is accepted; restoration/cleanup mismatch remains G023 and provider logout remains Q013. |

Native login/callback/storage/refresh/logout and public issuer bootstrap are accepted as AUTH-10–AUTH-12. The bounded child change and integration state are recorded in [runbook](runbook.md) and [handoff](handoff.md). Q011–Q013 remain explicitly owned policy extensions; integrating the minimum contract did not repair source mismatches or silently promote those questions to guarantees.

| Integrated coverage change | Accepted main-spec anchor / mapping |
|---|---|
| AUTH-02 / AUTH-03 | [Validated user context](../../openspec/specs/user-auth-and-identity/spec.md#requirement-backend-business-actions-use-validated-keycloak-user-context) and [current Keycloak behavior](../../openspec/specs/user-auth-and-identity/spec.md#requirement-keycloak-provides-browser-login-and-protected-backend-authentication); name-only renames with old bodies and scenarios retained. |
| AUTH-09 | [Shared acting-user and domain authorization](../../openspec/specs/user-auth-and-identity/spec.md#requirement-protected-apis-use-authenticated-acting-user-identity); three existing scenarios retained and one object-authority scenario added. |
| AUTH-10 | [Public configuration](../../openspec/specs/user-auth-and-identity/spec.md#requirement-clients-obtain-authentication-configuration-before-sign-in), 2 scenarios; B1/N2/CR evidence. |
| AUTH-11 | [Native login](../../openspec/specs/user-auth-and-identity/spec.md#requirement-ios-login-uses-keycloak-authorization-code-with-pkce), 7 scenarios; N1-N3/S1 evidence, G022. |
| AUTH-12 | [Native session](../../openspec/specs/user-auth-and-identity/spec.md#requirement-ios-manages-a-token-backed-local-session), 6 scenarios; N1-N3 evidence, G023. |

The child change passes strict validation and is integrated into the main identity spec. At the Step 2 checkpoint, authentication contained 12 requirements/43 scenarios and the full main baseline contained 40/122.

## Step 3 profiles and social review

Reviewed 2026-09-23 and integrated 2026-09-25 from the unchanged application-source snapshot. [Profiles and social evidence](profiles-and-social.md) maps profile fields, client scope, profile-party visibility and the complete directed follow transition table. The bounded child [proposal](../../openspec/changes/document-profiles-and-social-relationships/proposal.md), [design](../../openspec/changes/document-profiles-and-social-relationships/design.md), [delta](../../openspec/changes/document-profiles-and-social-relationships/specs/social-and-notifications/spec.md) and [tasks](../../openspec/changes/document-profiles-and-social-relationships/tasks.md) define and verify the integrated scope.

The child delta is synced into the main spec. The accepted baseline is now **42 requirements/145 scenarios**, with `social-and-notifications` at **6/35**.

| Stable mapping | Accepted coverage after integration | Disposition |
|---|---:|---|
| SOC-01 follow-request model | 12 scenarios | Full modified block preserves the original 3 scenarios and adds self, duplicate, actor, cancellation, rejection and removal transitions. Accepted. |
| SOC-02 mutual-contact invitation eligibility | 2 scenarios | Unchanged and omitted from the delta. Existing accepted coverage remains authoritative. |
| SOC-03 notification center | 4 scenarios | Unchanged and omitted from the delta. Step 8 still owns event/delivery detail. |
| SOC-04 profile discovery and party context | 6 scenarios | Full modified block preserves the original 3 scenarios and adds own-party context, anonymous denial and client-scope behavior. Accepted. |
| SOC-05 bounded profile/social projections | 6 scenarios | New requirement covers authenticated reads, cross-user/self fields, internal-field exclusion, private pending inbox and caller-relative status. Accepted. |
| SOC-06 authenticated self profile editing | 5 scenarios | New requirement covers editable fields, immutable fields, unique handles, invalid/conflicting updates and other-user denial. Accepted. |

Q009 is resolved for normative profile/social access and fields by SOC-01/SOC-04/SOC-05/SOC-06. Exact route/schema compatibility and picture serving remain assigned to Steps 11 and 7. G024 and G026–G028 preserve route, serialization, direction and client-support mismatches as implementation evidence. No application or runtime test was executed.

## Step 4 party lifecycle review

Reviewed 2026-09-25 from the unchanged application-source snapshot. [Party lifecycle evidence](party-lifecycle.md) maps CRUD actors, fields and validation, browser/iOS routes and payloads, and the inspected test assertions. The bounded child [proposal](../../openspec/changes/document-party-lifecycle/proposal.md), [design](../../openspec/changes/document-party-lifecycle/design.md), [delta](../../openspec/changes/document-party-lifecycle/specs/party-discovery-and-management/spec.md) and [tasks](../../openspec/changes/document-party-lifecycle/tasks.md) are planning-complete and pass strict validation.

The child has not been applied or synced. The accepted baseline therefore remains **42 requirements/145 scenarios**, with `party-discovery-and-management` at **11/33**. If accepted in a later apply task, the complete delta projects the party spec at **13/60** and the full baseline at **44/172**.

| Stable mapping | Proposed full coverage after integration | Disposition at this checkpoint |
|---|---:|---|
| PARTY-03 party detail context | 3 scenarios | Full modified block preserves both original scenarios and adds absent optional-field handling. Proposed only. |
| PARTY-04 private visibility | 7 scenarios | Full modified block preserves non-invited denial and adds anonymous/public, host, invitee, attendee and query-branch consistency cases. Proposed only. |
| PARTY-05 host management | 9 scenarios | Full modified block preserves the original four scenarios and adds authenticated actor, immutable host, denial and missing-party behavior. Proposed only. |
| Proposed PARTY-12 atomic lifecycle validation | 10 scenarios | New requirement covers required fields, exact bounded values, cross-field rules, visibility default/rejection, metadata scope and all-or-nothing failures. Proposed only. |
| Proposed PARTY-13 shared lifecycle client contract | 5 scenarios | New requirement covers plural CRUD routes, bearer identity, field preservation, server-consistent failure and non-parity scope. Proposed only. |

Q003, Q004, Q010 and Q014 retain invitation status, admission enforcement, supplementary exposure and exact wire-contract ownership. G003/G006/G009/G029-G030 preserve authorization, query visibility, validation, route and client-payload mismatches. No application or runtime test was executed.

## Requirement and scenario index

All entries in the index have intended status **Existing accepted main-spec requirement**. Foundation entries below remain the original evidence index; the Step 2 and Step 3 addenda record integrated coverage, while the Step 4 addendum explicitly separates proposed coverage. No entry is runtime verified. Decision and gap IDs refer to the separate registers and can evolve during later stages; requirement IDs here remain stable for handoffs.

### user-auth-and-identity

#### AUTH-01

**[Browser-based user identity is the current active authentication context](../../openspec/specs/user-auth-and-identity/spec.md#requirement-browser-based-user-identity-is-the-current-active-authentication-context)**

- Platform scope: Browser and backend; AUTH-11 and AUTH-12 define the separate iOS login/session contract.
- Runbook owner: Step 2.
- Source evidence: [E01](#e01), [E02](#e02). Browser session and backend user lookup paths exist; page-by-page enforcement remains unverified.
- Test evidence: No matching automated protected-page redirect/browser-user-resolution test identified. All execution remains unverified.
- Accepted decision references: [D001](decisions.md), [D002](decisions.md). Follow-up gaps: [G001](gaps.md), [G002](gaps.md), [G013](gaps.md).

Scenarios (2):

- [Frontend resolves the authenticated acting user](../../openspec/specs/user-auth-and-identity/spec.md#scenario-frontend-resolves-the-authenticated-acting-user)
- [Unauthenticated protected page access redirects to login](../../openspec/specs/user-auth-and-identity/spec.md#scenario-unauthenticated-protected-page-access-redirects-to-login)

#### AUTH-02

**[Backend business actions use validated Keycloak user context](../../openspec/specs/user-auth-and-identity/spec.md#requirement-backend-business-actions-use-validated-keycloak-user-context)**

- Platform scope: Backend protected APIs; browser/iOS callers.
- Runbook owner: Step 2.
- Source evidence: [E02](#e02), [E03](#e03). Caller resolution is present, but profile/deployment bypass accepts client-supplied identity when enabled.
- Test evidence: E03 contains limited missing-identity assertions; bypass fixtures do not prove rejection of legacy identity or real JWT validation. All execution remains unverified.
- Accepted decision references: [D001](decisions.md). Follow-up gaps: [G002](gaps.md), [G013](gaps.md).

Scenarios (3):

- [Protected business action receives a valid bearer token](../../openspec/specs/user-auth-and-identity/spec.md#scenario-protected-business-action-receives-a-valid-bearer-token)
- [Protected business action omits bearer token](../../openspec/specs/user-auth-and-identity/spec.md#scenario-protected-business-action-omits-bearer-token)
- [Legacy acting-user parameter is supplied](../../openspec/specs/user-auth-and-identity/spec.md#scenario-legacy-acting-user-parameter-is-supplied)

#### AUTH-03

**[Keycloak provides browser login and protected backend authentication](../../openspec/specs/user-auth-and-identity/spec.md#requirement-keycloak-provides-browser-login-and-protected-backend-authentication)**

- Platform scope: Browser and backend; AUTH-11 and AUTH-12 define the separate iOS login/session contract.
- Runbook owner: Step 2.
- Source evidence: [E01](#e01), [E02](#e02), [E11](#e11). Keycloak implementation entry points exist; the main title and Purpose now state current behavior while older narrative drift remains G001.
- Test evidence: No matching end-to-end Keycloak browser integration test identified. All execution remains unverified.
- Accepted decision references: [D001](decisions.md). Follow-up gaps: [G001](gaps.md), [G013](gaps.md).

Scenarios (2):

- [Auth work is implemented](../../openspec/specs/user-auth-and-identity/spec.md#scenario-auth-work-is-implemented)
- [Legacy user-context compatibility is considered](../../openspec/specs/user-auth-and-identity/spec.md#scenario-legacy-user-context-compatibility-is-considered)

#### AUTH-04

**[Plain JavaScript login uses Authorization Code Flow with PKCE](../../openspec/specs/user-auth-and-identity/spec.md#requirement-plain-javascript-login-uses-authorization-code-flow-with-pkce)**

- Platform scope: Browser.
- Runbook owner: Step 2.
- Source evidence: [E01](#e01), [E11](#e11). PKCE generation, state checking and code exchange are visible in source; callback/error behavior has not been executed.
- Test evidence: No matching automated PKCE, invalid-state or password-grant-exclusion scenario test identified. All execution remains unverified.
- Accepted decision references: [D002](decisions.md). Follow-up gaps: [G013](gaps.md).

Scenarios (4):

- [Login redirect is started](../../openspec/specs/user-auth-and-identity/spec.md#scenario-login-redirect-is-started)
- [Callback exchanges authorization code](../../openspec/specs/user-auth-and-identity/spec.md#scenario-callback-exchanges-authorization-code)
- [Callback state is invalid](../../openspec/specs/user-auth-and-identity/spec.md#scenario-callback-state-is-invalid)
- [Password grant is not used](../../openspec/specs/user-auth-and-identity/spec.md#scenario-password-grant-is-not-used)

#### AUTH-05

**[Frontend auth service manages the Keycloak browser session](../../openspec/specs/user-auth-and-identity/spec.md#requirement-frontend-auth-service-manages-the-keycloak-browser-session)**

- Platform scope: Browser.
- Runbook owner: Step 2.
- Source evidence: [E01](#e01). Facade methods for init, refresh, user lookup, API calls and logout are present; all page consumers remain to be audited.
- Test evidence: No matching automated facade/session scenario test identified. All execution remains unverified.
- Accepted decision references: [D002](decisions.md). Follow-up gaps: [G013](gaps.md).

Scenarios (5):

- [Auth service initializes](../../openspec/specs/user-auth-and-identity/spec.md#scenario-auth-service-initializes)
- [Authenticated API call is made](../../openspec/specs/user-auth-and-identity/spec.md#scenario-authenticated-api-call-is-made)
- [Token is near expiry](../../openspec/specs/user-auth-and-identity/spec.md#scenario-token-is-near-expiry)
- [Token refresh fails](../../openspec/specs/user-auth-and-identity/spec.md#scenario-token-refresh-fails)
- [User logs out](../../openspec/specs/user-auth-and-identity/spec.md#scenario-user-logs-out)

#### AUTH-06

**[Browser tokens are not persisted long term](../../openspec/specs/user-auth-and-identity/spec.md#requirement-browser-tokens-are-not-persisted-long-term)**

- Platform scope: Browser.
- Runbook owner: Step 2.
- Source evidence: [E01](#e01). The inspected auth service stores token session data in sessionStorage and clears auth state; legacy localStorage keys are removed.
- Test evidence: No matching automated token-storage/logout-cleanup scenario test identified. All execution remains unverified.
- Accepted decision references: [D002](decisions.md). Follow-up gaps: [G013](gaps.md).

Scenarios (2):

- [Tokens are stored for page navigation](../../openspec/specs/user-auth-and-identity/spec.md#scenario-tokens-are-stored-for-page-navigation)
- [Logout clears token state](../../openspec/specs/user-auth-and-identity/spec.md#scenario-logout-clears-token-state)

#### AUTH-07

**[Backend validates Keycloak bearer tokens](../../openspec/specs/user-auth-and-identity/spec.md#requirement-backend-validates-keycloak-bearer-tokens)**

- Platform scope: Backend and configured Keycloak environment.
- Runbook owner: Step 2; runtime reconciliation 11.
- Source evidence: [E02](#e02). Issuer, JWKS and role path are configured, with environment-dependent bypass and disabled JWT in test configuration.
- Test evidence: No actual valid/expired/wrong-issuer token or role-mapping execution evidence; synthetic identities do not cover these scenarios. All execution remains unverified.
- Accepted decision references: [D001](decisions.md). Follow-up gaps: [G002](gaps.md), [G013](gaps.md).

Scenarios (3):

- [Valid token is presented](../../openspec/specs/user-auth-and-identity/spec.md#scenario-valid-token-is-presented)
- [Invalid token is presented](../../openspec/specs/user-auth-and-identity/spec.md#scenario-invalid-token-is-presented)
- [Realm role is present](../../openspec/specs/user-auth-and-identity/spec.md#scenario-realm-role-is-present)

#### AUTH-08

**[PartyHub users link to Keycloak identities](../../openspec/specs/user-auth-and-identity/spec.md#requirement-partyhub-users-link-to-keycloak-identities)**

- Platform scope: Backend; browser/iOS identities as consumers.
- Runbook owner: Step 2.
- Source evidence: [E02](#e02), [E11](#e11). Subject link, unlinked-user match and minimal-user creation branches exist; claim ambiguity/onboarding boundaries need domain review.
- Test evidence: E02's three named resolver tests assert linkage and minimal creation using synthetic identities; claim uniqueness and real-login integration remain unverified. All execution remains unverified.
- Accepted decision references: [D003](decisions.md). Follow-up gaps: [G013](gaps.md).

Scenarios (3):

- [Linked user exists](../../openspec/specs/user-auth-and-identity/spec.md#scenario-linked-user-exists)
- [Existing user matches token claims](../../openspec/specs/user-auth-and-identity/spec.md#scenario-existing-user-matches-token-claims)
- [No matching PartyHub user exists](../../openspec/specs/user-auth-and-identity/spec.md#scenario-no-matching-partyhub-user-exists)

#### AUTH-09

**[Protected APIs use authenticated acting-user identity](../../openspec/specs/user-auth-and-identity/spec.md#requirement-protected-apis-use-authenticated-acting-user-identity)**

- Platform scope: Backend protected business actions; browser/iOS consumers.
- Runbook owner: Step 2; reuse in 4, 5 and 8.
- Source evidence: [E03](#e03), [E02](#e02). Party and notification methods resolve callers; object authorization and cross-user isolation remain owned by their domain stages.
- Test evidence: E03 test references cover limited response assertions; none proves all four scenarios with validated real bearer tokens. All execution remains unverified.
- Accepted decision references: [D001](decisions.md). Follow-up gaps: [G002](gaps.md), [G013](gaps.md).

Scenarios (4):

- [Create party uses authenticated user](../../openspec/specs/user-auth-and-identity/spec.md#scenario-create-party-uses-authenticated-user)
- [Join party uses authenticated user](../../openspec/specs/user-auth-and-identity/spec.md#scenario-join-party-uses-authenticated-user)
- [Notification access uses authenticated user](../../openspec/specs/user-auth-and-identity/spec.md#scenario-notification-access-uses-authenticated-user)
- [Authenticated identity does not grant object authority](../../openspec/specs/user-auth-and-identity/spec.md#scenario-authenticated-identity-does-not-grant-object-authority)

#### AUTH-10

**[Clients obtain authentication configuration before sign-in](../../openspec/specs/user-auth-and-identity/spec.md#requirement-clients-obtain-authentication-configuration-before-sign-in)**

- Platform scope: Browser, iOS and backend public bootstrap.
- Runbook owner: Step 2; environment reconciliation Step 11.
- Source evidence: [E01](#e01), [E02](#e02), [auth-environments](auth-environments.md). Public issuer bootstrap is visible in source/configuration; fallback behavior and deployed profile values were not executed.
- Test evidence: No signed-out browser/iOS bootstrap or configuration-failure scenario was run. All execution remains unverified.
- Accepted decision references: [D014](decisions.md). Follow-up gaps: [G002](gaps.md), [G013](gaps.md), [G018](gaps.md).

Scenarios (2):

- [Signed-out client obtains the issuer](../../openspec/specs/user-auth-and-identity/spec.md#scenario-signed-out-client-obtains-the-issuer)
- [Authentication configuration cannot be loaded](../../openspec/specs/user-auth-and-identity/spec.md#scenario-authentication-configuration-cannot-be-loaded)

#### AUTH-11

**[iOS login uses Keycloak authorization code with PKCE](../../openspec/specs/user-auth-and-identity/spec.md#requirement-ios-login-uses-keycloak-authorization-code-with-pkce)**

- Platform scope: iOS, Keycloak and backend `/api/users/me` resolution.
- Runbook owner: Step 2.
- Source evidence: [E01](#e01), [E02](#e02), [E11](#e11). Native authorization, exchange and user lookup paths exist; callback nonce binding differs from the accepted contract.
- Test evidence: No automated native authorization, callback validation or bearer-authenticated user-resolution scenario was identified or run.
- Accepted decision references: [D003](decisions.md), [D014](decisions.md). Follow-up gaps: [G013](gaps.md), [G022](gaps.md), [G025](gaps.md). Policy limits: Q011–Q012.

Scenarios (7):

- [Native login starts](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-login-starts)
- [Native callback completes its transaction](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-callback-completes-its-transaction)
- [Native callback state or code is invalid](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-callback-state-or-code-is-invalid)
- [Native callback nonce is invalid](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-callback-nonce-is-invalid)
- [Native login is cancelled or fails](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-login-is-cancelled-or-fails)
- [Native login resolves the PartyHub user](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-login-resolves-the-partyhub-user)
- [Native user resolution cannot complete](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-user-resolution-cannot-complete)

#### AUTH-12

**[iOS manages a token-backed local session](../../openspec/specs/user-auth-and-identity/spec.md#requirement-ios-manages-a-token-backed-local-session)**

- Platform scope: iOS client with shared protected backend APIs.
- Runbook owner: Step 2; persistence/quality review Step 11.
- Source evidence: [E01](#e01), [E02](#e02). Keychain, restore, refresh, bearer request and local logout paths exist; restoration and cleanup differ from parts of the accepted contract.
- Test evidence: No automated native Keychain restoration, refresh, protected-call or logout-cleanup scenario was identified or run.
- Accepted decision references: [D014](decisions.md). Follow-up gaps: [G013](gaps.md), [G023](gaps.md). Policy limit: Q013.

Scenarios (6):

- [Native credentials persist across launches](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-credentials-persist-across-launches)
- [Native session is restored](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-session-is-restored)
- [Native access token needs refresh](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-access-token-needs-refresh)
- [Native session cannot be refreshed](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-session-cannot-be-refreshed)
- [Native protected API request is sent](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-protected-api-request-is-sent)
- [Native user logs out locally](../../openspec/specs/user-auth-and-identity/spec.md#scenario-native-user-logs-out-locally)

### social-and-notifications

#### SOC-01

**[Social relationships use a follow-request model](../../openspec/specs/social-and-notifications/spec.md#requirement-social-relationships-use-a-follow-request-model)**

- Platform scope: Shared backend relationship contract. The browser supplies the observed cross-user controls; the accepted iOS minimum does not require matching social UI.
- Runbook owner: Step 3.
- Source evidence: [E04](#e04) and [profiles/social review](profiles-and-social.md). Pending and accepted directed rows exist; missing actor, duplicate and removal behavior remains recorded separately.
- Test evidence: E04's inspected follow tests provide partial request/acceptance assertions; no complete transition-table or two-direction mutual-contact suite was run.
- Accepted decision references: [D004](decisions.md), [D015](decisions.md). Follow-up gaps: [G013](gaps.md), [G024](gaps.md), [G027](gaps.md), [G028](gaps.md).

Scenarios (12):

- [User initiates a follow](../../openspec/specs/social-and-notifications/spec.md#scenario-user-initiates-a-follow)
- [Recipient accepts a follow request](../../openspec/specs/social-and-notifications/spec.md#scenario-recipient-accepts-a-follow-request)
- [Mutual contact is evaluated](../../openspec/specs/social-and-notifications/spec.md#scenario-mutual-contact-is-evaluated)
- [User attempts to follow themselves](../../openspec/specs/social-and-notifications/spec.md#scenario-user-attempts-to-follow-themselves)
- [Pending request is repeated](../../openspec/specs/social-and-notifications/spec.md#scenario-pending-request-is-repeated)
- [Accepted request is repeated](../../openspec/specs/social-and-notifications/spec.md#scenario-accepted-request-is-repeated)
- [Non-recipient attempts acceptance](../../openspec/specs/social-and-notifications/spec.md#scenario-non-recipient-attempts-acceptance)
- [Requester cancels a pending request](../../openspec/specs/social-and-notifications/spec.md#scenario-requester-cancels-a-pending-request)
- [Recipient rejects a pending request](../../openspec/specs/social-and-notifications/spec.md#scenario-recipient-rejects-a-pending-request)
- [Follower stops following](../../openspec/specs/social-and-notifications/spec.md#scenario-follower-stops-following)
- [Recipient removes a follower](../../openspec/specs/social-and-notifications/spec.md#scenario-recipient-removes-a-follower)
- [One direction is removed from a mutual contact](../../openspec/specs/social-and-notifications/spec.md#scenario-one-direction-is-removed-from-a-mutual-contact)

#### SOC-02

**[Private party invitations are limited to mutual contacts](../../openspec/specs/social-and-notifications/spec.md#requirement-private-party-invitations-are-limited-to-mutual-contacts)**

- Platform scope: Shared domain: backend with browser/iOS consumers; detailed invitation client scope remains with Step 5.
- Runbook owner: Step 5; selector/social input 3.
- Source evidence: [E04](#e04), [E05](#e05). Accepted mutual-contact restriction is preserved as intent; no mutual-follow check is visible in the inspected private invitation creation path.
- Test evidence: No matching non-mutual rejection test confirmed; existing successful-invite tests do not establish eligibility enforcement. All execution remains unverified.
- Accepted decision references: [D005](decisions.md). Follow-up gaps: [G017](gaps.md).

Scenarios (2):

- [Host selects private invitees](../../openspec/specs/social-and-notifications/spec.md#scenario-host-selects-private-invitees)
- [Backend receives private invite for non-mutual user](../../openspec/specs/social-and-notifications/spec.md#scenario-backend-receives-private-invite-for-non-mutual-user)

#### SOC-03

**[Notification center is the primary action surface for invites and follow requests](../../openspec/specs/social-and-notifications/spec.md#requirement-notification-center-is-the-primary-action-surface-for-invites-and-follow-requests)**

- Platform scope: Shared domain: backend with browser/iOS consumers; detailed event, channel and delivery scope remains with Step 8.
- Runbook owner: Step 8; event inputs 3–5.
- Source evidence: [E06](#e06), [E05](#e05). Both clients expose notification surfaces and backend read/delete/event code exists; all events/actions and delivery are unverified.
- Test evidence: E06 read-state and wrong-user assertions are partial evidence; deletion status alone does not establish persistence, and client action flows remain untested. All execution remains unverified.
- Accepted decision references: [D012](decisions.md). Follow-up gaps: [G006](gaps.md), [G013](gaps.md).

Scenarios (4):

- [User receives a party invitation](../../openspec/specs/social-and-notifications/spec.md#scenario-user-receives-a-party-invitation)
- [User receives a follow request](../../openspec/specs/social-and-notifications/spec.md#scenario-user-receives-a-follow-request)
- [User receives party change notification](../../openspec/specs/social-and-notifications/spec.md#scenario-user-receives-party-change-notification)
- [User manages notification state](../../openspec/specs/social-and-notifications/spec.md#scenario-user-manages-notification-state)

#### SOC-04

**[Profiles support social discovery and party context](../../openspec/specs/social-and-notifications/spec.md#requirement-profiles-support-social-discovery-and-party-context)**

- Platform scope: Browser search, cross-user profiles, social actions and party context; iOS authenticated self profile and accepted counts; shared backend contract.
- Runbook owner: Step 3; party-visibility dependency 4.
- Source evidence: [E04](#e04), [E07](#e07), [profiles/social review](profiles-and-social.md). Browser and iOS support differ; profile party context retains D008 without granting extra private access.
- Test evidence: UserResourceTest and api/user.http are candidate references only; no profile-created-private-party visibility or client UI flow was run.
- Accepted decision references: [D008](decisions.md), [D015](decisions.md). Follow-up gaps: [G009](gaps.md), [G013](gaps.md), [G026](gaps.md), [G028](gaps.md).

Scenarios (6):

- [User searches for another user](../../openspec/specs/social-and-notifications/spec.md#scenario-user-searches-for-another-user)
- [User views another profile](../../openspec/specs/social-and-notifications/spec.md#scenario-user-views-another-profile)
- [Profile-created parties are listed](../../openspec/specs/social-and-notifications/spec.md#scenario-profile-created-parties-are-listed)
- [User views their own created parties](../../openspec/specs/social-and-notifications/spec.md#scenario-user-views-their-own-created-parties)
- [Anonymous caller requests profile discovery](../../openspec/specs/social-and-notifications/spec.md#scenario-anonymous-caller-requests-profile-discovery)
- [iOS user opens their own profile](../../openspec/specs/social-and-notifications/spec.md#scenario-ios-user-opens-their-own-profile)

#### SOC-05

**[Profile and social reads use audience-specific projections](../../openspec/specs/social-and-notifications/spec.md#requirement-profile-and-social-reads-use-audience-specific-projections)**

- Platform scope: Shared authenticated backend contract for browser and iOS consumers; iOS is required only to consume its accepted self-profile minimum.
- Runbook owner: Step 3; profile-picture transport 7 and API schemas 11.
- Source evidence: [E04](#e04), [profiles/social review](profiles-and-social.md), [access matrix](access-matrix.md#access-matrix). Current routes are open/raw or arbitrary-pair in several cases.
- Test evidence: No response-projection, pending-inbox isolation or caller-relative status test was run.
- Accepted decision references: [D015](decisions.md). Follow-up gaps: [G013](gaps.md), [G026](gaps.md), [G027](gaps.md).

Scenarios (6):

- [Search returns a bounded profile summary](../../openspec/specs/social-and-notifications/spec.md#scenario-search-returns-a-bounded-profile-summary)
- [Cross-user profile is returned](../../openspec/specs/social-and-notifications/spec.md#scenario-cross-user-profile-is-returned)
- [Self profile is returned](../../openspec/specs/social-and-notifications/spec.md#scenario-self-profile-is-returned)
- [Accepted follow list is returned](../../openspec/specs/social-and-notifications/spec.md#scenario-accepted-follow-list-is-returned)
- [Pending follow requests are read](../../openspec/specs/social-and-notifications/spec.md#scenario-pending-follow-requests-are-read)
- [Relationship status is read](../../openspec/specs/social-and-notifications/spec.md#scenario-relationship-status-is-read)

#### SOC-06

**[Authenticated users manage only their own editable profile](../../openspec/specs/social-and-notifications/spec.md#requirement-authenticated-users-manage-only-their-own-editable-profile)**

- Platform scope: Shared backend self-update contract; browser supplies the observed text-edit surface. No iOS text-edit parity is required by this group.
- Runbook owner: Step 3; validation/status schema details 11 and picture lifecycle 7.
- Source evidence: [E04](#e04), [profiles/social review](profiles-and-social.md), [access matrix](access-matrix.md#access-matrix). Source has a self path check but broad DTO handling and no established unique-handle constraint.
- Test evidence: No other-user, internal-field, duplicate-handle or atomic validation-failure test was run.
- Accepted decision references: [D015](decisions.md). Follow-up gaps: [G013](gaps.md), [G026](gaps.md), [G028](gaps.md).

Scenarios (5):

- [User updates their editable profile fields](../../openspec/specs/social-and-notifications/spec.md#scenario-user-updates-their-editable-profile-fields)
- [User attempts to update another profile](../../openspec/specs/social-and-notifications/spec.md#scenario-user-attempts-to-update-another-profile)
- [Update includes an internal or immutable field](../../openspec/specs/social-and-notifications/spec.md#scenario-update-includes-an-internal-or-immutable-field)
- [Distinct handle conflicts with another profile](../../openspec/specs/social-and-notifications/spec.md#scenario-distinct-handle-conflicts-with-another-profile)
- [Profile update fails validation](../../openspec/specs/social-and-notifications/spec.md#scenario-profile-update-fails-validation)

### party-discovery-and-management

#### PARTY-01

**[Home map shows visible parties as the primary discovery experience](../../openspec/specs/party-discovery-and-management/spec.md#requirement-home-map-shows-visible-parties-as-the-primary-discovery-experience)**

- Platform scope: Shared domain: backend with browser/iOS consumers; detailed client scope remains to be made explicit by the owner stage.
- Runbook owner: Step 6; visibility dependency 4.
- Source evidence: [E07](#e07), [E08](#e08). Default repository query contains public/host/invited/joined visibility; map consumers and alternate filtered queries need full review.
- Test evidence: api/party.http has visible/public/private request examples; client rendering and all query-path visibility remain unverified. All execution remains unverified.
- Accepted decision references: [D007](decisions.md). Follow-up gaps: [G009](gaps.md), [G013](gaps.md).

Scenarios (2):

- [Anonymous user opens the home map](../../openspec/specs/party-discovery-and-management/spec.md#scenario-anonymous-user-opens-the-home-map)
- [Authenticated user opens the home map](../../openspec/specs/party-discovery-and-management/spec.md#scenario-authenticated-user-opens-the-home-map)

#### PARTY-02

**[Core party discovery excludes live location features](../../openspec/specs/party-discovery-and-management/spec.md#requirement-core-party-discovery-excludes-live-location-features)**

- Platform scope: Shared core discovery scope; extension classification separate.
- Runbook owner: Step 6; extensions 10.
- Source evidence: [E12](#e12). Accepted exclusion remains the core baseline; later approved iOS filters must be reconciled explicitly rather than inferred from source.
- Test evidence: Product-scope/history evidence; runtime tests not applicable to confirming the decision itself. All execution remains unverified.
- Accepted decision references: [D010](decisions.md), [D011](decisions.md). Follow-up gaps: [G010](gaps.md), [G011](gaps.md).

Scenarios (2):

- [Core discovery baseline is defined](../../openspec/specs/party-discovery-and-management/spec.md#scenario-core-discovery-baseline-is-defined)
- [Current time-window filtering is evaluated](../../openspec/specs/party-discovery-and-management/spec.md#scenario-current-time-window-filtering-is-evaluated)

#### PARTY-03

**[Party details expose the selected party context](../../openspec/specs/party-discovery-and-management/spec.md#requirement-party-details-expose-the-selected-party-context)**

- Platform scope: Shared domain: backend with browser/iOS consumers; detailed client scope remains to be made explicit by the owner stage.
- Runbook owner: Step 4; navigation reuse 6.
- Source evidence: [E07](#e07). Detail route and both clients' detail entry points exist; metadata completeness and access/error states are unverified.
- Test evidence: Party resource/repository test files are candidates; no matching map-to-detail navigation or full metadata UI test identified. All execution remains unverified.
- Accepted decision references: [D007](decisions.md). Follow-up gaps: [G009](gaps.md), [G013](gaps.md).

Scenarios (2):

- [User opens party details from the map](../../openspec/specs/party-discovery-and-management/spec.md#scenario-user-opens-party-details-from-the-map)
- [Party detail metadata is shown](../../openspec/specs/party-discovery-and-management/spec.md#scenario-party-detail-metadata-is-shown)

#### PARTY-04

**[Private party visibility is restricted](../../openspec/specs/party-discovery-and-management/spec.md#requirement-private-party-visibility-is-restricted)**

- Platform scope: Backend visibility contract shared by browser/iOS and direct API callers.
- Runbook owner: Step 4; cross-surface reuse 6, 7 and 10.
- Source evidence: [E07](#e07), [E09](#e09). Detail route calls visibility-aware lookup; media/location/filter/profile paths need separate review and cannot inherit a compliance claim.
- Test evidence: api/party.http contains private-party request examples; no evidence of executed or comprehensive cross-surface denial tests. All execution remains unverified.
- Accepted decision references: [D007](decisions.md). Follow-up gaps: [G009](gaps.md), [G013](gaps.md).

Scenarios (1):

- [Non-invited user requests a private party](../../openspec/specs/party-discovery-and-management/spec.md#scenario-non-invited-user-requests-a-private-party)

#### PARTY-05

**[Users can create and manage parties](../../openspec/specs/party-discovery-and-management/spec.md#requirement-users-can-create-and-manage-parties)**

- Platform scope: Shared domain: backend with browser/iOS consumers; detailed client scope remains to be made explicit by the owner stage.
- Runbook owner: Step 4; cancellation notification dependency 8.
- Source evidence: [E07](#e07). Create/update/delete code exists; inspected update path replaces host without first checking ownership, conflicting with accepted host-only management.
- Test evidence: E07 owner/non-owner deletion assertions are relevant only to deletion; they do not cover update ownership, every field or cancellation recipients. All execution remains unverified.
- Accepted decision references: [D007](decisions.md). Follow-up gaps: [G003](gaps.md), [G006](gaps.md), [G013](gaps.md).

Scenarios (4):

- [Host creates a party](../../openspec/specs/party-discovery-and-management/spec.md#scenario-host-creates-a-party)
- [Host submits party attributes](../../openspec/specs/party-discovery-and-management/spec.md#scenario-host-submits-party-attributes)
- [Host edits a party](../../openspec/specs/party-discovery-and-management/spec.md#scenario-host-edits-a-party)
- [Host deletes a party](../../openspec/specs/party-discovery-and-management/spec.md#scenario-host-deletes-a-party)

#### PARTY-06

**[Private party invitees are enforced as mutual contacts](../../openspec/specs/party-discovery-and-management/spec.md#requirement-private-party-invitees-are-enforced-as-mutual-contacts)**

- Platform scope: Shared domain: backend with browser/iOS consumers; detailed client scope remains to be made explicit by the owner stage.
- Runbook owner: Step 5; lifecycle input 4.
- Source evidence: [E05](#e05), [E04](#e04). Private-invite creation/renewal exists; mutual-contact enforcement is not established by the inspected path.
- Test evidence: No matching non-mutual rejection test confirmed; named success cases in PartyRepositoryTest are insufficient to claim this requirement covered. All execution remains unverified.
- Accepted decision references: [D005](decisions.md). Follow-up gaps: [G017](gaps.md).

Scenarios (2):

- [Host invites mutual contact to private party](../../openspec/specs/party-discovery-and-management/spec.md#scenario-host-invites-mutual-contact-to-private-party)
- [Host invites non-mutual user to private party](../../openspec/specs/party-discovery-and-management/spec.md#scenario-host-invites-non-mutual-user-to-private-party)

#### PARTY-07

**[Invitation acceptance happens through party attendance](../../openspec/specs/party-discovery-and-management/spec.md#requirement-invitation-acceptance-happens-through-party-attendance)**

- Platform scope: Shared domain: backend with browser/iOS consumers; detailed client scope remains to be made explicit by the owner stage.
- Runbook owner: Step 5.
- Source evidence: [E05](#e05). Join and leave change an existing invitation to ACCEPTED/DECLINED respectively; access checks, duplicate actions and UI integration remain unverified.
- Test evidence: Invitation tests are candidate references; no confirmed test for this precise attendance-linked scenario pair in the foundation review. All execution remains unverified.
- Accepted decision references: [D006](decisions.md). Follow-up gaps: [G009](gaps.md), [G013](gaps.md).

Scenarios (2):

- [Invited user joins a party](../../openspec/specs/party-discovery-and-management/spec.md#scenario-invited-user-joins-a-party)
- [Invited user leaves a previously accepted party](../../openspec/specs/party-discovery-and-management/spec.md#scenario-invited-user-leaves-a-previously-accepted-party)

#### PARTY-08

**[Home map supports client-side party filtering for visible parties](../../openspec/specs/party-discovery-and-management/spec.md#requirement-home-map-supports-client-side-party-filtering-for-visible-parties)**

- Platform scope: iOS map from archived change context; platform-neutral durable wording requires Step 6 reconciliation.
- Runbook owner: Step 6.
- Source evidence: [E08](#e08), [E07](#e07). iOS client contains local filter state/reset and direct radius controls. Backend filter examples do not establish the client requirement.
- Test evidence: No matching client-side combination/reset/radius test identified; server filter tests are not substitutes. All execution remains unverified.
- Accepted decision references: [D011](decisions.md). Follow-up gaps: [G010](gaps.md), [G011](gaps.md), [G013](gaps.md).

Scenarios (5):

- [User opens home map filters](../../openspec/specs/party-discovery-and-management/spec.md#scenario-user-opens-home-map-filters)
- [User uses in-map distance control](../../openspec/specs/party-discovery-and-management/spec.md#scenario-user-uses-in-map-distance-control)
- [User combines multiple filters](../../openspec/specs/party-discovery-and-management/spec.md#scenario-user-combines-multiple-filters)
- [User clears filters](../../openspec/specs/party-discovery-and-management/spec.md#scenario-user-clears-filters)
- [Existing filter selection changes results](../../openspec/specs/party-discovery-and-management/spec.md#scenario-existing-filter-selection-changes-results)

#### PARTY-09

**[Home map filter experience matches the attendee-map interaction style](../../openspec/specs/party-discovery-and-management/spec.md#requirement-home-map-filter-experience-matches-the-attendee-map-interaction-style)**

- Platform scope: iOS map from archived change context; platform-neutral durable wording requires Step 6 reconciliation.
- Runbook owner: Step 6.
- Source evidence: [E08](#e08). Filter toolbar, sheet, active summary and radius feedback are present in iOS source; visible-state synchronization has not been exercised.
- Test evidence: No matching automated filter-style/active-state synchronization scenario test identified. All execution remains unverified.
- Accepted decision references: [D011](decisions.md). Follow-up gaps: [G010](gaps.md), [G013](gaps.md).

Scenarios (4):

- [No filters are active](../../openspec/specs/party-discovery-and-management/spec.md#scenario-no-filters-are-active)
- [Filters are active](../../openspec/specs/party-discovery-and-management/spec.md#scenario-filters-are-active)
- [Distance filter is active](../../openspec/specs/party-discovery-and-management/spec.md#scenario-distance-filter-is-active)
- [Active filter state and map results stay in sync](../../openspec/specs/party-discovery-and-management/spec.md#scenario-active-filter-state-and-map-results-stay-in-sync)

#### PARTY-10

**[Home map time, distance, age, free, and text filters behave predictably](../../openspec/specs/party-discovery-and-management/spec.md#requirement-home-map-time-distance-age-free-and-text-filters-behave-predictably)**

- Platform scope: iOS map from archived change context; platform-neutral durable wording requires Step 6 reconciliation.
- Runbook owner: Step 6.
- Source evidence: [E08](#e08). Client predicate code uses time, distance, age, fee and text metadata; missing-location handling is visible but behavior at boundaries is unverified.
- Test evidence: No matching client-clock, absent-location, metadata fallback or filter-boundary scenario test identified. All execution remains unverified.
- Accepted decision references: [D011](decisions.md). Follow-up gaps: [G010](gaps.md), [G011](gaps.md), [G013](gaps.md).

Scenarios (7):

- [Within-two-weeks filter is active](../../openspec/specs/party-discovery-and-management/spec.md#scenario-within-two-weeks-filter-is-active)
- [Distance filter is active and user location is available](../../openspec/specs/party-discovery-and-management/spec.md#scenario-distance-filter-is-active-and-user-location-is-available)
- [Distance filter is changed from map interface](../../openspec/specs/party-discovery-and-management/spec.md#scenario-distance-filter-is-changed-from-map-interface)
- [Distance filter is active and user location is unavailable](../../openspec/specs/party-discovery-and-management/spec.md#scenario-distance-filter-is-active-and-user-location-is-unavailable)
- [Age range filter is active](../../openspec/specs/party-discovery-and-management/spec.md#scenario-age-range-filter-is-active)
- [Free parties filter is active](../../openspec/specs/party-discovery-and-management/spec.md#scenario-free-parties-filter-is-active)
- [Text search filter is active](../../openspec/specs/party-discovery-and-management/spec.md#scenario-text-search-filter-is-active)

#### PARTY-11

**[Home map theme filtering uses displayable theme metadata](../../openspec/specs/party-discovery-and-management/spec.md#requirement-home-map-theme-filtering-uses-displayable-theme-metadata)**

- Platform scope: iOS map from archived change context; platform-neutral durable wording requires Step 6 reconciliation.
- Runbook owner: Step 6.
- Source evidence: [E08](#e08). Theme choices derive from client metadata. The missing-theme scenario's alternative-filter wording conflicts with all-active-criteria wording and needs reconciliation.
- Test evidence: No matching client theme/missing-metadata test identified; no source behavior is promoted to resolve the specification ambiguity. All execution remains unverified.
- Accepted decision references: [D011](decisions.md). Follow-up gaps: [G010](gaps.md), [G011](gaps.md), [G013](gaps.md).

Scenarios (2):

- [Party has theme metadata](../../openspec/specs/party-discovery-and-management/spec.md#scenario-party-has-theme-metadata)
- [Party lacks theme metadata](../../openspec/specs/party-discovery-and-management/spec.md#scenario-party-lacks-theme-metadata)

### party-media-gallery

#### MEDIA-01

**[Party galleries support media viewing in the current brownfield system](../../openspec/specs/party-media-gallery/spec.md#requirement-party-galleries-support-media-viewing-in-the-current-brownfield-system)**

- Platform scope: Shared gallery domain; browser implementation observed, iOS support requires Step 7 classification.
- Runbook owner: Step 7.
- Source evidence: [E09](#e09). Browser loading and empty-gallery rendering exist; backend viewer access and iOS parity are not verified.
- Test evidence: E09 repository list-content/empty tests are partial data evidence, not UI or authorization coverage. All execution remains unverified.
- Accepted decision references: [D009](decisions.md). Follow-up gaps: [G009](gaps.md), [G014](gaps.md), [G013](gaps.md).

Scenarios (2):

- [User opens a party gallery](../../openspec/specs/party-media-gallery/spec.md#scenario-user-opens-a-party-gallery)
- [Party has no media](../../openspec/specs/party-media-gallery/spec.md#scenario-party-has-no-media)

#### MEDIA-02

**[Party gallery upload is target behavior for the user interface](../../openspec/specs/party-media-gallery/spec.md#requirement-party-gallery-upload-is-target-behavior-for-the-user-interface)**

- Platform scope: Target gallery UI behavior; per-client delivery status unverified.
- Runbook owner: Step 7.
- Source evidence: [E09](#e09). The accepted target remains UI upload; inspected browser flow is read-only and iOS photo surfaces are not proof of backend upload.
- Test evidence: No matching automated gallery UI upload scenario test identified. All execution remains unverified.
- Accepted decision references: [D009](decisions.md). Follow-up gaps: [G014](gaps.md), [G013](gaps.md).

Scenarios (1):

- [Gallery upload capability is described for future work](../../openspec/specs/party-media-gallery/spec.md#scenario-gallery-upload-capability-is-described-for-future-work)

#### MEDIA-03

**[Party gallery uploads are available to party viewers](../../openspec/specs/party-media-gallery/spec.md#requirement-party-gallery-uploads-are-available-to-party-viewers)**

- Platform scope: Backend gallery upload policy with browser/iOS consumers.
- Runbook owner: Step 7.
- Source evidence: [E09](#e09). Upload has no observed end-time gate, but the inspected method lacks viewer-visibility enforcement; neither fact changes accepted policy.
- Test evidence: No matching allow-viewer/deny-nonviewer upload authorization test confirmed. All execution remains unverified.
- Accepted decision references: [D009](decisions.md). Follow-up gaps: [G009](gaps.md), [G014](gaps.md), [G013](gaps.md).

Scenarios (2):

- [Party viewer uploads a photo](../../openspec/specs/party-media-gallery/spec.md#scenario-party-viewer-uploads-a-photo)
- [User without party access uploads a photo](../../openspec/specs/party-media-gallery/spec.md#scenario-user-without-party-access-uploads-a-photo)

### map-radius-control

#### RADIUS-01

**[Map exposes an in-context distance radius control](../../openspec/specs/map-radius-control/spec.md#requirement-map-exposes-an-in-context-distance-radius-control)**

- Platform scope: iOS map; explicit SwiftUI companion requirements and archive context.
- Runbook owner: Step 6.
- Source evidence: [E08](#e08). The source contains an in-map radius slider and immediate binding to filter state; runtime/UI behavior remains unverified.
- Test evidence: No matching radius-slider interaction scenario test identified. All execution remains unverified.
- Accepted decision references: [D011](decisions.md). Follow-up gaps: [G010](gaps.md), [G012](gaps.md), [G013](gaps.md).

Scenarios (2):

- [User opens the home map with location available](../../openspec/specs/map-radius-control/spec.md#scenario-user-opens-the-home-map-with-location-available)
- [User adjusts the map distance slider](../../openspec/specs/map-radius-control/spec.md#scenario-user-adjusts-the-map-distance-slider)

#### RADIUS-02

**[Map distance slider is vertically oriented](../../openspec/specs/map-radius-control/spec.md#requirement-map-distance-slider-is-vertically-oriented)**

- Platform scope: iOS SwiftUI only.
- Runbook owner: Step 6.
- Source evidence: [E08](#e08). Slider source uses rotationEffect and right-side overlay layout; visual correctness was not tested.
- Test evidence: No matching vertical-layout scenario test identified. All execution remains unverified.
- Accepted decision references: [D011](decisions.md). Follow-up gaps: [G012](gaps.md), [G013](gaps.md).

Scenarios (1):

- [Slider is displayed on the map](../../openspec/specs/map-radius-control/spec.md#scenario-slider-is-displayed-on-the-map)

#### RADIUS-03

**[Map displays selected radius as a geographic circle](../../openspec/specs/map-radius-control/spec.md#requirement-map-displays-selected-radius-as-a-geographic-circle)**

- Platform scope: iOS SwiftUI MapCircle.
- Runbook owner: Step 6.
- Source evidence: [E08](#e08). MapCircle, finite-radius/location guards and camera-focus methods exist; geographic fit and transitions were not exercised.
- Test evidence: No matching finite/change/camera/unavailable-location scenario test identified. All execution remains unverified.
- Accepted decision references: [D011](decisions.md). Follow-up gaps: [G012](gaps.md), [G013](gaps.md).

Scenarios (4):

- [Finite radius is selected](../../openspec/specs/map-radius-control/spec.md#scenario-finite-radius-is-selected)
- [Radius selection changes](../../openspec/specs/map-radius-control/spec.md#scenario-radius-selection-changes)
- [Finite radius becomes active](../../openspec/specs/map-radius-control/spec.md#scenario-finite-radius-becomes-active)
- [Location is unavailable](../../openspec/specs/map-radius-control/spec.md#scenario-location-is-unavailable)

### local-keycloak-environment

#### ENV-01

**[Docker Compose provides local Keycloak](../../openspec/specs/local-keycloak-environment/spec.md#requirement-docker-compose-provides-local-keycloak)**

- Platform scope: Local development Compose environment.
- Runbook owner: Step 11.
- Source evidence: [E10](#e10). Compose builds Keycloak from Dockerfile.keycloak, whose base is the official image, and declares port/network. Running service availability is unverified.
- Test evidence: No matching startup/network runtime test identified. All execution remains unverified.
- Accepted decision references: [D013](decisions.md). Follow-up gaps: [G013](gaps.md).

Scenarios (2):

- [Keycloak starts locally](../../openspec/specs/local-keycloak-environment/spec.md#scenario-keycloak-starts-locally)
- [Keycloak uses the project network](../../openspec/specs/local-keycloak-environment/spec.md#scenario-keycloak-uses-the-project-network)

#### ENV-02

**[Keycloak uses a dedicated database in the existing Postgres service](../../openspec/specs/local-keycloak-environment/spec.md#requirement-keycloak-uses-a-dedicated-database-in-the-existing-postgres-service)**

- Platform scope: Local development Postgres/Keycloak environment.
- Runbook owner: Step 11.
- Source evidence: [E10](#e10). One Postgres service, dedicated keycloak database setting and one 5432 mapping are declared.
- Test evidence: No runtime connection/isolation/port test identified. All execution remains unverified.
- Accepted decision references: [D013](decisions.md). Follow-up gaps: [G013](gaps.md).

Scenarios (3):

- [Only one Postgres service is used](../../openspec/specs/local-keycloak-environment/spec.md#scenario-only-one-postgres-service-is-used)
- [Keycloak data is isolated](../../openspec/specs/local-keycloak-environment/spec.md#scenario-keycloak-data-is-isolated)
- [Only one Postgres port is exposed](../../openspec/specs/local-keycloak-environment/spec.md#scenario-only-one-postgres-port-is-exposed)

#### ENV-03

**[Compose bootstraps the Keycloak database](../../openspec/specs/local-keycloak-environment/spec.md#requirement-compose-bootstraps-the-keycloak-database)**

- Platform scope: Local development database initialization and operator documentation.
- Runbook owner: Step 11.
- Source evidence: [E10](#e10). Initialization SQL creates keycloak; fresh versus existing volume behavior and exact remediation documentation need reconciliation.
- Test evidence: No fresh-volume or existing-volume remediation execution evidence. All execution remains unverified.
- Accepted decision references: [D013](decisions.md). Follow-up gaps: [G013](gaps.md).

Scenarios (2):

- [Fresh Postgres volume initializes Keycloak database](../../openspec/specs/local-keycloak-environment/spec.md#scenario-fresh-postgres-volume-initializes-keycloak-database)
- [Existing Postgres volume needs manual remediation](../../openspec/specs/local-keycloak-environment/spec.md#scenario-existing-postgres-volume-needs-manual-remediation)

#### ENV-04

**[Realm import provisions PartyHub realm](../../openspec/specs/local-keycloak-environment/spec.md#requirement-realm-import-provisions-partyhub-realm)**

- Platform scope: Local development Keycloak realm import.
- Runbook owner: Step 11.
- Source evidence: [E11](#e11), [E10](#e10). Mounted dev file declares partyhub; image also includes staging import and README names an obsolete export. Effective import has not been observed.
- Test evidence: No actual imported-realm test identified or run. All execution remains unverified.
- Accepted decision references: [D013](decisions.md). Follow-up gaps: [G005](gaps.md), [G018](gaps.md), [G013](gaps.md).

Scenarios (1):

- [Realm is imported on startup](../../openspec/specs/local-keycloak-environment/spec.md#scenario-realm-is-imported-on-startup)

#### ENV-05

**[Realm import provisions frontend client](../../openspec/specs/local-keycloak-environment/spec.md#requirement-realm-import-provisions-frontend-client)**

- Platform scope: Local development Keycloak frontend client for browser.
- Runbook owner: Step 11; auth dependency 2.
- Source evidence: [E11](#e11). Dev realm declares public client, standard flow, disabled direct grants, local redirect/origin and S256. This is declarative source evidence only.
- Test evidence: No real-client login/PKCE acceptance test identified; successful server import and flow execution unverified. All execution remains unverified.
- Accepted decision references: [D002](decisions.md), [D013](decisions.md). Follow-up gaps: [G005](gaps.md), [G018](gaps.md), [G013](gaps.md).

Scenarios (7):

- [Frontend client exists](../../openspec/specs/local-keycloak-environment/spec.md#scenario-frontend-client-exists)
- [Frontend client has no secret](../../openspec/specs/local-keycloak-environment/spec.md#scenario-frontend-client-has-no-secret)
- [Frontend client supports standard flow](../../openspec/specs/local-keycloak-environment/spec.md#scenario-frontend-client-supports-standard-flow)
- [Frontend client disables direct access grants](../../openspec/specs/local-keycloak-environment/spec.md#scenario-frontend-client-disables-direct-access-grants)
- [Frontend redirect URI matches PartyHub app origin](../../openspec/specs/local-keycloak-environment/spec.md#scenario-frontend-redirect-uri-matches-partyhub-app-origin)
- [Frontend web origin matches PartyHub app origin](../../openspec/specs/local-keycloak-environment/spec.md#scenario-frontend-web-origin-matches-partyhub-app-origin)
- [Frontend client accepts PKCE](../../openspec/specs/local-keycloak-environment/spec.md#scenario-frontend-client-accepts-pkce)

#### ENV-06

**[Realm import provisions admin role and user](../../openspec/specs/local-keycloak-environment/spec.md#requirement-realm-import-provisions-admin-role-and-user)**

- Platform scope: Local development partyhub realm bootstrap account.
- Runbook owner: Step 11.
- Source evidence: [E11](#e11). Dev realm declares enabled admin user, realm role and role assignment; realm account differs from management bootstrap configuration.
- Test evidence: No admin-role login/runtime test identified. All execution remains unverified.
- Accepted decision references: [D013](decisions.md). Follow-up gaps: [G013](gaps.md).

Scenarios (4):

- [Admin role exists](../../openspec/specs/local-keycloak-environment/spec.md#scenario-admin-role-exists)
- [Admin user exists](../../openspec/specs/local-keycloak-environment/spec.md#scenario-admin-user-exists)
- [Admin user can authenticate](../../openspec/specs/local-keycloak-environment/spec.md#scenario-admin-user-can-authenticate)
- [Admin user has admin role](../../openspec/specs/local-keycloak-environment/spec.md#scenario-admin-user-has-admin-role)

#### ENV-07

**[Realm import provisions local PartyHub demo users](../../openspec/specs/local-keycloak-environment/spec.md#requirement-realm-import-provisions-local-partyhub-demo-users)**

- Platform scope: Local development realm users, backend seed linkage and browser login.
- Runbook owner: Step 11; identity dependency 2.
- Source evidence: [E11](#e11), [E02](#e02). Dev realm declares seeded demo users; README demo password differs from mounted realm. Actual import/login/linking is not verified.
- Test evidence: Synthetic resolver linkage tests are partial evidence; no real demo-user browser-to-backend test identified. All execution remains unverified.
- Accepted decision references: [D003](decisions.md), [D013](decisions.md). Follow-up gaps: [G005](gaps.md), [G018](gaps.md), [G013](gaps.md).

Scenarios (3):

- [Demo user exists](../../openspec/specs/local-keycloak-environment/spec.md#scenario-demo-user-exists)
- [Demo user can authenticate](../../openspec/specs/local-keycloak-environment/spec.md#scenario-demo-user-can-authenticate)
- [Demo user can link to PartyHub user](../../openspec/specs/local-keycloak-environment/spec.md#scenario-demo-user-can-link-to-partyhub-user)

## Coverage outside the existing baseline

The 40 requirements do not by themselves specify every discovered surface. Profile editing/pictures, notification settings and delivery, QR login, extended location/calendar features, API validation/error contracts, storage and deployment details remain assigned in [inventory.md](inventory.md) and [runbook.md](runbook.md), with scope/contract gaps in [gaps.md](gaps.md). They have **no implied normative coverage** from a similarly named requirement. Steps 3–11 add or reconcile coverage through bounded domain changes; Step 12 checks complete inventory-to-requirement-to-scenario traceability.

Future domain updates should retain these identifiers or record a clear replacement mapping, add accepted requirement/scenario links after integration, state the exact observed implementation status, and identify the assertions and execution results supporting each coverage claim. Do not mark a domain complete solely because a proposal or test file exists.
