# Initial implementation and documentation gaps

Foundation snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, 2026-09-21; Step 2 refinement on 2026-09-23, Steps 3-5 integration on 2026-09-25 and Step 6 source/proposal review on 2026-09-25 with application source unchanged. These are source/configuration observations and specification/documentation conflicts. None is a runtime reproduction. Priorities are initial triage for later work: high = access/identity boundary, medium = behavior/compatibility, low = editorial/evidence hygiene. This register is not a complete security audit or a finding about a live deployment.

Java paths below start at `src/main/java/at/htl/`; browser paths at `src/main/resources/META-INF/resources/`; Swift paths at `PartyHubiOS/PartyHubiOS/`. Complete surface ownership is in [inventory.md](inventory.md); requirement anchors are in [coverage.md](coverage.md).

## G001 Stale authentication historical narrative

- **Expected:** D001-D003 describe Keycloak-backed identity as the current accepted contract.
- **Observed:** `docs/functional-spec-codex.md:26` still describes stored numeric user identity and future Keycloak. Step 2 corrected the main identity spec's Purpose and headings and added explicit browser/iOS/backend scope; browser `auth-service.js` and Swift `KeycloakAuthService.swift` remain source evidence rather than proof of conformance.
- **Disposition:** Main-spec wording corrected; older narrative drift remains. **Priority:** medium. **Owner:** documentation reconciliation Step 12.
- **Next action:** Reconcile the historical narrative against the accepted identity spec without reintroducing legacy identity requirements.

## G002 Deployment manifest enables numeric identity bypass

- **Expected:** D001 requires validated bearer identity and rejects client-supplied numeric identity alone for protected business actions.
- **Observed:** `k8s/quarkus.yaml:33` selects the production profile and sets `PARTYHUB_AUTH_BYPASS_ENABLED` true. `auth/XUserIdAuthFilter.java` supports `X-User-Id` when enabled; application profiles differ. This is manifest evidence, not a live cluster observation.
- **Disposition:** Configuration/accepted-contract conflict. **Priority:** high. **Owner:** Step 2; environment contract Step 11.
- **Next action:** Include the override in the environment/access evidence matrix and define a bounded later remediation; do not modify configuration during foundation work.

## G003 Party update does not check existing ownership in the inspected path

- **Expected:** D007 limits party management to its host.
- **Observed:** `party/PartyResource.java:158` resolves an authenticated caller; `party/PartyRepository.java:147` finds that user, changes party fields and sets `host_user` to the caller without first comparing the existing host. No runtime exploit test was run.
- **Disposition:** Observed implementation conflict against accepted D007/D016/PARTY-05. **Priority:** high. **Owner:** bounded implementation change; API verification Step 11.
- **Next action:** Implement and test non-host denial, unchanged fields and unchanged host in a separate application change.

## G004 README API and package descriptions differ from source

- **Expected:** README should describe actual supported contracts.
- **Observed:** README claims `/api/auth/*`, `/api/categories/*`, `/api/media/*` and `/api/follow/*` families and an `at/htl/partyhub` package tree. The resource inventory places identity/follows under users, media under party/user paths and has no standalone auth/categories resources; Java code is under `at/htl/` domain packages.
- **Disposition:** Documentation drift, not proof that missing claimed features should be added. **Priority:** medium. **Owner:** Step 11 contract reconciliation, Step 12 editorial correction; Step 4 for theme/category scope.
- **Next action:** Match each README claim to inventoried routes and explicitly classify unsupported claims.

## G005 README Keycloak import filename differs from Compose

- **Expected:** Local setup instructions identify the mounted realm import.
- **Observed:** README names `keycloak/realm-export.json`; `docker-compose.yaml:28` mounts `keycloak/realm-dev.json`.
- **Disposition:** Documentation/configuration drift. **Priority:** low. **Owner:** Step 11, then 12.
- **Next action:** Establish per-environment realm-file roles before updating setup documentation; do not equate different files with a runtime failure.

## G006 Client party routes and methods disagree with backend

- **Expected:** Browser/iOS operations use the backend's documented method/path contract.
- **Observed:** Browser `backend-functions.js:76` filters via POST while the list/filter resource uses GET; `backend-functions.js:110` uses POST on `/api/party/{id}` while updates use PUT `/api/parties/{id}`. Swift `Partynotificationsystem.swift:390` and `:419` contain singular polling paths. `PartyView/PartyDetailView.swift:339` is a debug simulation path; regular editing at `:472` already uses PUT on the plural route. iOS calls to `/api/users/{id}/device-token` also differ from both backend `/api/users/device-token` and `/api/parties/device-token` routes.
- **Disposition:** Observed call-site compatibility gap against accepted D016/PARTY-13; reachability/user impact remains unverified. The accepted contract does not select a redirect/removal migration. **Priority:** medium. **Owner:** later implementation; notifications Step 8, API matrix/Q014 Step 11.
- **Next action:** Trace active callers, then replace or explicitly migrate each wrong method/path without assuming every legacy helper is reachable.

## G007 QR generation and exchange describe different payload flows

- **Expected:** A retained login flow needs a coherent generation/consumption/identity contract; target scope is Q001.
- **Observed:** `qr/QrResource.java:42` emits a user-ID login deep link and user image path; `:115` exchanges a token via `QrService.findValidByToken`. The generation endpoint does not visibly call that stored-token generation path.
- **Disposition:** Observed flow inconsistency, product target unresolved. **Priority:** high. **Owner:** Step 9.
- **Next action:** Trace consumers and tests, then specify the retained flow without legitimizing numeric-ID authentication by default.

## G008 QR verification embeds signing material

- **Expected:** The supported QR/mobile identity design must establish trustworthy identity; no accepted requirement endorses embedded signing material.
- **Observed:** `qr/QrResource.java:137` contains a hardcoded HMAC verification secret. Its value is intentionally not duplicated here. `QrService` and QR tests are the follow-up evidence.
- **Disposition:** Security-sensitive implementation observation for the retained-flow review. **Priority:** high. **Owner:** Step 9, identity coordination Step 2.
- **Next action:** Record a bounded credential/verification remediation once Q001 determines the supported flow; do not treat existing code as approved policy.

## G009 Private access checks are missing on several source paths

- **Expected:** D007/D017 and PARTY-14 establish private-party access and invitation/attendance viewer boundaries: pending invitations and current joined membership qualify, while declined/withdrawn invitations do not. D008 has profile-specific wording and D009 establishes gallery-viewer boundaries.
- **Observed:** Step 2 traced [access rows 14,20-29,55-57](access-matrix.md#access-matrix). Legacy title/theme/date filters and sorting (`PartyRepository:411-445`) omit the visibility predicate used by default/new-filter paths. `attendParty:566` and `attendStatus:643` do not check visibility. Party media/location and user-media reads have no caller-based predicates. User-location update looks up an independently generated location entity ID using the caller user ID without checking its linked user (`UserResource:406`, `UserLocation`), so same-user ownership cannot be assumed from caller resolution alone.
- **Disposition:** Missing checks confirmed in inspected source paths; runtime responses, data population and exploitability not exercised. D016/PARTY-04 require branch-consistent party list/detail visibility, and D017/PARTY-07/PARTY-14 now require private join/status/projection checks. Media and location remain later owners. Location retained/privacy policy still Q002/Q006. **Priority:** high. **Owner:** bounded list/detail and invitation/attendance implementation, then Steps 6-7 and 10 owners.
- **Next action:** Implement pending-invitation private join and actor-scoped projection checks in a separate application change. Preserve D007/D009/D016/D017 while later groups specify admission, viewer uploads and location consent.

## G010 Map requirements have implicit platform scope

- **Expected:** D011's archived changes target the SwiftUI iOS map; shared discovery remains platform-neutral where appropriate.
- **Observed:** Durable discovery/filter wording can read as universal, while radius requirements explicitly name SwiftUI rotation and MapCircle. Archived change Impact sections name iOS files.
- **Disposition:** Specification scope ambiguity. The unapplied `document-discovery-and-maps` delta names iOS scope throughout PARTY-08-PARTY-11 and RADIUS-01-RADIUS-03 while keeping shared queries platform-neutral. **Priority:** medium. **Owner:** Step 6 apply.
- **Next action:** Review, apply and sync the child; close this specification gap only after the main specs carry the explicit scope.

## G011 Theme fallback conflicts with filter combination wording

- **Expected:** Enabled map filters are combined with AND according to the existing combination scenario.
- **Observed:** The final missing-theme scenario in `party-discovery-and-management` says to exclude a party from theme matches unless another non-theme filter includes it; that exception is ambiguous alongside the AND rule.
- **Disposition:** Specification ambiguity; Q008 remains unresolved in accepted coverage. The unapplied child proposes strict AND behavior, excluding missing or non-matching theme whenever theme is active. **Priority:** medium. **Owner:** Step 6 apply.
- **Next action:** Review, apply and sync the proposed wording, then resolve Q008 in the accepted decision record.

## G012 Radius Purpose placeholder

- **Expected:** Every main capability has a meaningful Purpose and passes strict validation.
- **Observed:** `openspec/specs/map-radius-control/spec.md:4` contains the archive-generated placeholder. Initial strict validation passes 5 of 6 specs and fails this one with an overview warning.
- **Disposition:** Known baseline documentation defect. **Priority:** low. **Owner:** Step 12, explicitly authorized direct Purpose correction.
- **Next action:** Replace only the Purpose with the already accepted capability intent during consolidation; leave requirements unchanged unless a separate domain delta changes them.

## G013 Test presence and source inspection do not establish runtime coverage

- **Expected:** Evidence reports distinguish source observations, test presence and actual execution.
- **Observed:** JUnit/RestAssured and HTTPYac suites exist; the foundation stage has not run them, started services or exercised browser/iOS flows. Test configuration enables auth bypass. Historical HTTPYac README pass claims are not a current test result.
- **Disposition:** Evidence limitation, not a test failure. **Priority:** low; revisit for access-test relevance. **Owner:** Each domain; consolidated evidence Step 11.
- **Next action:** Map assertions when needed and record any later executed test command/environment/result precisely. Do not claim that bypass-enabled tests verify real Keycloak authentication.

## G014 Gallery target and per-client support need reconciliation

- **Expected:** D009 permits party viewers to upload at any time and distinguishes accepted upload target from historical browser read-only behavior.
- **Observed:** Backend uploads exist. The inspected browser `gallery/gallery.html` and `gallery.js` provide a grid/modal view without upload controls, and reference `/api/media/{id}` images without a matching Java REST resource in the inventory. Swift `Photo/PartyBilderView.swift` stores images in local documents; backend-gallery parity is not established. Media upload identity/access, profile upload constraints and URL serving need exact domain review. See `media/MediaRepository.java:112` and `user/UserResource.java:265`.
- **Disposition:** Platform support/access/validation gap candidate; Q005 covers public-viewer identity ambiguity. **Priority:** medium. **Owner:** Step 7.
- **Next action:** Record actual active UI support, upload validation and viewer identity for each client before changing any normative requirement.

## G015 README setup command points to a missing script

- **Expected:** Local setup commands reference tracked executable scripts.
- **Observed:** README recommends `./deploy.sh`; tracked setup scripts include `deploy-local.sh`, `sync-import.sh` and `run-http-tests.sh`, while `deploy.sh` is absent from the inspected repository.
- **Disposition:** Setup documentation drift. **Priority:** medium. **Owner:** Step 11, correction Step 12.
- **Next action:** Read the scripts to establish their actual side effects and supported local workflow; do not execute deployment or seed synchronization to document it.

## G016 Discovered capabilities lack complete durable contracts

- **Expected:** Every retained product surface is eventually specified or explicitly excluded with a reason.
- **Observed:** AUTH-10-AUTH-12 now cover the bounded native authentication minimum. Existing specs remain partial for full profile editing, notification settings/delivery, QR login, profile-picture/storage lifecycle, extended locations/calendar/time tracking and API/runtime quality contracts. Inventory ownership does not prove requirement completeness.
- **Disposition:** Remaining specification coverage gaps have assigned steps and do not authorize feature implementation. **Priority:** medium. **Owner:** Steps 3-11 as assigned in inventory.
- **Next action:** Complete the relevant bounded domain review and delta; use Q001-Q007 where target behavior is not already decided.

## G017 Mutual-contact enforcement is not evident in private-party invite creation

- **Expected:** D005/D017 and PARTY-06 require stored-host authority and current mutual-contact eligibility for private issue/renew through every invitation path.
- **Observed:** `party/PartyRepository.java:204` creates/renews selected private invitations without accepted mutual-follow checks. `InvitationRepository.invite:35-90` checks party/recipient existence and duplicate status, but not stored-host identity, party visibility or mutual contact. Caller-as-sender is not proof of host authority. Browser selection computes a mutual-contact intersection, while iOS loads only following users.
- **Disposition:** Missing mutual/host checks and inconsistent client eligibility confirmed against accepted D017/PARTY-06; not a runtime reproduction. **Priority:** high. **Owner:** bounded invitation implementation, with Step 3 relationship definitions.
- **Next action:** Enforce stored-host and current mutual-contact checks for both party-selected and direct invitations, with non-mutual, self and unauthorized rejection tests.

## G018 Local realm bootstrap and documented demo credentials diverge

- **Expected:** Setup documentation and the actual local import sources describe a consistent realm and demo-account setup.
- **Observed:** `Dockerfile.keycloak` copies `realm-staging.json` while Compose additionally mounts `realm-dev.json`; both declare the same realm name. The README's demo credential differs from the mounted development realm. Credential values are not duplicated here; import precedence and actual persisted realm state were not exercised.
- **Disposition:** Configuration/documentation inconsistency needing environment review, not a claim that login currently fails. **Priority:** medium. **Owner:** Step 11, with Step 2 identity setup.
- **Next action:** Establish the intended fresh-volume/existing-volume import behavior and documentation source of truth, then propose bounded configuration/documentation remediation.

## G019 Numeric token subject precedes Keycloak identity linkage

- **Expected:** AUTH-02/08/09 resolve a validated subject through its Keycloak link; token identity is not a local numeric-ID selector.
- **Observed:** `CurrentUserResolver.requireCurrentUser` and `currentUserIfAuthenticated` call `tryFindByNumericId` before `findByKeycloakId`, without checking bypass configuration or mechanism origin. A numeric authenticated subject matching a local row can select it before its Keycloak link is considered.
- **Disposition:** Source identity-binding conflict; numeric-subject reachability not exercised. **Priority:** high. **Owner:** Step 2 remediation.
- **Next action:** Isolate any explicitly approved test identity path from normal subject resolution; verify a numeric subject linked to another local ID resolves by subject and cannot impersonate a numeric row. No resolver edits in this task.

## G020 Unlinked-user matching does not establish unique trusted match

- **Expected:** AUTH-08's existing-user scenario describes one unlinked username/email match. Ambiguous claim policy is Q012, not permission to select an arbitrary user.
- **Observed:** `UserRepository.findUnlinkedByUsernameOrEmail` also considers distinctName and calls `setMaxResults(1)` without detecting competing matches. Resolver does not examine `email_verified`. Existing tests supply synthetic principals, not competing real claim sets.
- **Disposition:** Policy/evidence gap and unsafe-to-assume matching completeness; source observation, no account takeover reproduction. **Priority:** high. **Owner:** Step 2, profile/uniqueness inputs Step 3.
- **Next action:** Resolve Q012 before extending normative linking edge cases; then define collision, claim-trust and concurrent-link acceptance cases for a separate fix. Do not silently replace the accepted unique-match/minimal-create alternatives.

## G021 Browser authentication failure cleanup is incomplete

- **Expected:** AUTH-05/06 clear invalid sessions; AUTH-01 resolves acting user through authenticated backend lookup.
- **Observed:** `auth-service.js:332-344` clears non-OK refresh responses but transport/JSON errors propagate without cleanup. `/me` non-401/403 failures return null and callback still redirects; `isLoggedIn` tests access-token time only, not successful user resolution.
- **Disposition:** Source failure-recovery gap; network availability and impact not exercised. **Priority:** medium. **Owner:** Step 2; status/error wording Step 11.
- **Next action:** Specify and later verify invalid-session versus temporary-service failure recovery, with no cached-ID authentication fallback. Preserve failure cases B-INVALID-REFRESH/B-ME-FAIL in the contract review.

## G022 Callback nonce binding is incomplete across clients

- **Expected:** Accepted AUTH-11 binds the native authorization response to the initiating transaction; browser AUTH-04 explicitly requires generation of state/nonce/PKCE and state rejection. It does not by itself document full ID-token validation.
- **Observed:** Native login generates a nonce but callback never receives the expected nonce and the ID-token claims model omits it. Browser compares nonce only when a decoded ID-token nonce exists; payload decoding is not signature validation.
- **Disposition:** Native source mismatch against accepted AUTH-11 and a browser hardening/coverage lead; no runtime failure was reproduced. **Priority:** high. **Owner:** later identity implementation; verification coordination Step 11.
- **Next action:** Implement and verify matching/missing/wrong nonce cases in a separate application change. Keep backend JWT validation independent.

## G023 Native restoration and durable cleanup need verification/remediation

- **Expected:** Accepted AUTH-12 establishes usable token-backed sessions, clears invalid credentials, and removes local identity on logout. Provider logout/revocation remains Q013.
- **Observed:** `KeycloakAuthService.bootstrap:44-58` can establish UI state from token+ID when access is expired and no refresh exists; expiry calculation with absent issuedAt uses now. Keychain writes are sequential, and deletion errors in `clearLocalSession:323` are suppressed. `validAccessToken` does clear on absent/failed refresh before protected calls.
- **Disposition:** Source mismatch/recovery cases against accepted AUTH-12, not proven runtime failure. **Priority:** medium. **Owner:** later identity implementation; persistence/quality Step 11.
- **Next action:** Verify expired/missing-refresh restoration, partial writes and deletion failure recovery in later implementation work; do not infer remote session termination or deletion of all application data.

## G024 Follow mutation path parameters have inconsistent meanings

- **Expected:** D001/D015 use the authenticated actor; D004/SOC-01 preserve request/recipient direction. Step 11 owns exact route/schema compatibility.
- **Observed:** `UserResource:348-375` ignores path id for create/accept, but DELETE ignores followerId and removes caller→path id. Actor still comes from resolver. This is an API meaning discrepancy, not evidence that those parameters authenticate another user.
- **Disposition:** Source/API compatibility gap against accepted D015/SOC-01. **Priority:** medium. **Owner:** later implementation, API reconciliation Step 11.
- **Next action:** Reconcile route shapes and callers in a bounded implementation/API change without retaining ignored actor-like path values as authority.

## G025 Browser registration flags are not provider success evidence

- **Expected:** Authentication/onboarding descriptions distinguish actual provider account state from UI messages; D003 requires token-backed user resolution.
- **Observed:** `auth-service.js:211` sets post-registration flag before registration completes; invalid/missing callback transaction sets post-verify flag. Login page displays success from these flags and starts a fresh login; it does not exchange a registration-return code. Standalone register HTML is empty and its JS file is empty; active entry is the start/login page's Keycloak redirect.
- **Disposition:** Source/UX evidence limitation; no registration or verification failure reproduced. **Priority:** medium. **Owner:** Step 2, realm setup Step 11.
- **Next action:** Reconcile registration/cancellation/email-verification returns and error messages with provider evidence in a later client fix. Do not specify the flags as proof of account creation or email verification.

## G026 Profile reads expose raw contact, identity-link and delivery fields

- **Expected:** Cross-user profile/search/social reads expose only fields needed for social discovery; self reads may include private contact fields; Keycloak subject and device token are internal.
- **Observed:** `UserResource` rows 37-40/42-50 return `User` entities or lists directly. `User` can serialize username, Keycloak ID, email, phone number and device token alongside profile fields. Reads are open, and server-side distinct-handle uniqueness/validation is not established even though handle lookup assumes one row.
- **Disposition:** Data-minimization/access and identifier-integrity mismatch against accepted D015/SOC-04-SOC-06; no live response was captured. **Priority:** high. **Owner:** later implementation; API/privacy Step 11, picture serving Step 7.
- **Next action:** Audit existing handle collisions, then implement explicit response DTOs/auth gates and server validation in separate changes.

## G027 Pending requests and relationship status are publicly selectable

- **Expected:** Pending follow requests belong to the authenticated recipient; relationship status is caller-relative; follow mutations derive the actor from validated identity.
- **Observed:** Rows 50-51 are open and accept arbitrary user IDs. The browser reads another user's pending inbox to infer whether its own outgoing request is pending. Incoming-request dismissal sends the same DELETE shape as unfollow, but backend DELETE removes caller-to-path-`id`, so dismissing A's request to B can target B-to-B instead of A-to-B. No recipient rejection/removal repository method is distinct from follower-initiated removal.
- **Disposition:** Access/transition and client compatibility gap against accepted D015/SOC-01/SOC-05; no browser flow was executed. **Priority:** high. **Owner:** later implementation; API Step 11.
- **Next action:** Implement and test send/accept/reject/cancel/unfollow/remove-follower directions with forged path IDs and reverse-direction preservation.

## G028 Browser and iOS profile/social support differ

- **Expected:** Platform scope is explicit; browser behavior does not silently create iOS parity requirements.
- **Observed:** Browser profile code supports search, other-user profiles, follow request/unfollow controls, lists and hosted-party context. iOS `ProfileView` loads only the authenticated self profile/counts and uploads a picture; its Follow and Message buttons have empty actions, and no iOS other-user profile/search/request inbox was found.
- **Disposition:** Platform-support difference and inert-control gap under accepted client scope, which does not require parity. **Priority:** medium. **Owner:** later product/client work if iOS expansion is desired.
- **Next action:** Preserve the bounded iOS self-profile minimum and browser social scope. Treat inert controls as source debt; remove or implement them only through a separate approved change.

## G029 Party lifecycle validation is incomplete and inconsistently activated

- **Expected:** D016/PARTY-12 validate required fields, individual bounds and cross-field invariants before any create/update side effect; unsupported visibility does not silently change meaning.
- **Observed:** `PartyCreateDto:11-59` declares several size/range rules, but title/start required annotations use `OnCreate`/`OnUpdate` groups while `PartyResource:128/165` applies plain `@Valid`. No DTO constraint enforces end after start, min age at most max age, coordinate pairing/ranges or a `PUBLIC`/`PRIVATE` enum. `PartyRepository.normalizeVisibility` maps blank and every unknown value except case-insensitive private to public; nullable coordinate values are passed into primitive setters. Browser validation covers only a subset and iOS substitutes defaults.
- **Disposition:** Source validation/atomicity mismatch against accepted D016/PARTY-12; not a runtime reproduction. **Priority:** high. **Owner:** bounded backend/client implementation; exact error schema Step 11/Q014.
- **Next action:** Implement server-side grouped and cross-field validation with atomic rejection and targeted create/update tests; keep client checks supplemental.

## G030 Party clients can omit identity or overwrite lifecycle fields

- **Expected:** D016/PARTY-13 require viewer-dependent reads to carry bearer identity and supported-subset edits to preserve other valid stored fields.
- **Observed:** Browser `index.js`, `backend-functions.js:getAllParties`, `listPartys.js:102-107` and `addParty.js:518-526` request party lists/details as public or with `authRequired: false`, so authenticated private visibility is not reliably represented; the add/edit payload at `addParty.js:1185-1206` also omits capacity. iOS `PartyView.swift:166-210` lists through unauthenticated `URLSession` and removes local rows absent from that response. iOS create/update paths hard-code public visibility, `Standard` theme and empty selected users; update also substitutes times/ages for missing values (`PartyFormView:266-315`, `PartyDetailView:413-505`). Active create/update routes themselves are plural and bearer-authenticated. See [discovery-and-maps.md](discovery-and-maps.md).
- **Disposition:** Viewer-context and destructive-default compatibility mismatch against accepted D016/PARTY-13; client reachability was source-inspected but not executed. **Priority:** high. **Owner:** bounded browser/iOS changes; discovery list behavior Step 6, invitation semantics Step 5, API wire contract Step 11/Q014.
- **Next action:** Preserve unsupported fields or adopt agreed partial-update semantics, attach bearer identity to viewer-dependent reads, and test that editing one field does not expose, hide, or erase unrelated party state.

## G031 Invitation and attendance paths disagree on authority, state and retry behavior

- **Expected:** D005-D007/D017 and PARTY-06/PARTY-07/PARTY-15 require one stored-host-managed invitation per party/recipient and one atomic attendance transition, with current-state retries as no-ops and denied transitions leaving all state/events unchanged.
- **Observed:** Direct invitations accept any authenticated sender; `selectedUsers` creates/renews without removing deselected rows; invitation accept/decline and party join/leave use separate repository paths; private join accepts any authenticated user; sender deletion removes the invitation while recipient deletion declines it; repeated join is a no-op but repeated leave reports missing state. Event creation and deduplication differ by entry path.
- **Disposition:** Cross-path state/authorization mismatch against accepted Group 5 requirements; no runtime transition was exercised. **Priority:** high. **Owner:** bounded invitation/attendance backend change; exact route/status behavior Step 11/Q014.
- **Next action:** Implement one transactional invitation/attendance state machine and test host/recipient authority, selection removal, renewal, accept/join equivalence, decline/leave, retries and event deduplication.

## G032 Invitation and attendance projections are too broad or internally inconsistent

- **Expected:** D017/PARTY-14 require self-scoped invitation lists/details, host-only invited identities/statuses/statistics, and bounded joined/own-status projections for authenticated party viewers.
- **Observed:** Join status checks party existence but not private visibility. Invited members and invitation statistics are exposed to every authenticated party viewer. Statistics add the host to the accepted count despite no host invitation. Joined-member projection uses the general viewer predicate but response minimization was not runtime verified.
- **Disposition:** Projection authorization/counting mismatch against the accepted contract. **Priority:** high. **Owner:** bounded invitation/attendance backend/API work.
- **Next action:** Enforce actor-specific projection checks and derive statistics only from logical invitation rows, with host/viewer/unrelated-user response tests.

## G033 Browser and iOS invitation payloads and state models disagree with the backend

- **Expected:** Supported clients represent the same server-owned invitation/attendance state; platform-specific controls may differ, while exact wire migration remains Q014.
- **Observed:** iOS invitation list decoding expects nested snake-case data while the backend list DTO is flat/camel-case; the invite sheet posts `party_id` where the backend DTO expects `partyId`, loads following rather than mutual contacts, and updates invited state locally. Browser selection uses plain fetch and retains old invitees. An iOS notification helper still references singular party/attendee routes.
- **Disposition:** Cross-client schema, eligibility and synchronization mismatch; active runtime reachability and failures were not exercised. **Priority:** medium. **Owner:** bounded invitation client reconciliation with Step 11/Q014 wire decisions; singular routes also G006.
- **Next action:** After the domain contract is accepted and Q014 selects wire compatibility, align client DTOs/actions with the shared server state and add decode/request/refresh tests without requiring UI parity.

## G034 Party query branches do not share composition or pagination semantics

- **Expected:** PARTY-04 already requires the viewer predicate on every list branch. The unapplied Group 6 child additionally proposes one visibility-first candidate set, AND-composed supported predicates, deterministic post-filter sorting and pagination, and complete time/location inputs.
- **Observed:** `PartyResource.getParties:80-119` chooses new-filter, legacy-filter, sort, or default paths. Legacy text/theme/date selection uses `else if`, bypasses visibility and ignores other supplied criteria. Sort bypasses visibility and does not compose. Only `findWithFilters:814-885` honors limit/offset; it always adds a next-14-days predicate and pages after optional in-memory distance filtering. Equal-time order has no stable identifier tie-break.
- **Disposition:** Source mismatch against accepted PARTY-04 plus proposed Group 6 query behavior; the new composition/pagination portion is not accepted until apply. No endpoint was executed. **Priority:** high. **Owner:** bounded discovery backend implementation after Step 6 apply; exact wire/status/default limits Step 11/Q014.
- **Next action:** After the child is accepted, consolidate party queries behind the viewer predicate and add anonymous/authenticated combination, boundary and stable-page tests without changing browser/iOS UI parity.

## G035 The smallest finite iOS radius has no circle or radius camera response

- **Expected:** Current RADIUS-03 already says a finite radius with location renders a matching geographic circle and adjusts the camera; the proposed child makes finite/unlimited transitions explicit.
- **Observed:** `MapView.shouldShowSearchRadiusCircle` and `shouldAutoFocusForDistanceFilter` exclude both unlimited and the 5 km finite option. Filtering still applies 5 km, but the circle and radius-focused camera do not. Other finite values render/focus; unavailable location resets to unlimited and disables the slider.
- **Disposition:** iOS source mismatch against existing accepted finite-radius visualization; source inspection only, no SwiftUI flow or build executed. **Priority:** medium. **Owner:** bounded iOS map implementation after Step 6 apply.
- **Next action:** Make every finite selection drive the same filter/circle/camera state contract and add tests or UI verification for 5 km, another finite value, unlimited, reset and location loss.
