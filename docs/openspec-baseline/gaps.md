# Initial implementation and documentation gaps

Foundation snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, 2026-09-21; Step 2 refinement on 2026-09-23, Steps 3-6 integration on 2026-09-25, Group 7 integration on 2026-09-28, Groups 8-9 integration on 2026-09-29, Group 10 integration on 2026-09-30 Group 11 runtime/quality review and Group 12 acceptance on 2026-09-30 with application source unchanged. Every open gap is assigned to a bounded item in [backlog.md](backlog.md); closed and deferred gaps are listed there too. These are source/configuration observations and specification/documentation conflicts. None is a runtime reproduction. Priorities are initial triage for later work: high = access/identity/privacy boundary, medium = behavior/compatibility, low = editorial/evidence hygiene. This register is not a complete security audit or a finding about a live deployment.

Java paths below start at `src/main/java/at/htl/`; browser paths at `src/main/resources/META-INF/resources/`; Swift paths at `PartyHubiOS/PartyHubiOS/`. Complete surface ownership is in [inventory.md](inventory.md); requirement anchors are in [coverage.md](coverage.md).

## G001 Stale authentication historical narrative

- **Expected:** D001-D003 describe Keycloak-backed identity as the current accepted contract.
- **Observed:** `docs/functional-spec-codex.md:26` still describes stored numeric user identity and future Keycloak. Step 2 corrected the main identity spec's Purpose and headings and added explicit browser/iOS/backend scope; browser `auth-service.js` and Swift `KeycloakAuthService.swift` remain source evidence rather than proof of conformance.
- **Disposition:** Main-spec wording corrected; older narrative drift remains. **Priority:** medium. **Owner:** documentation reconciliation Step 12.
- **Next action:** Reconcile the historical narrative against the accepted identity spec without reintroducing legacy identity requirements.
- **Group 12 update:** **Closed (documentation).** `docs/functional-spec-codex.md` now has a historical banner correcting the authentication narrative, and its local links are repaired.

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
- **Group 12 update:** **Closed (documentation).** README API, feature and structure sections now match the source and link to the API matrix.

## G005 README Keycloak import filename differs from Compose

- **Expected:** Local setup instructions identify the mounted realm import.
- **Observed:** README names `keycloak/realm-export.json`; `docker-compose.yaml:28` mounts `keycloak/realm-dev.json`.
- **Disposition:** Documentation/configuration drift. **Priority:** low. **Owner:** Step 11, then 12.
- **Next action:** Establish per-environment realm-file roles before updating setup documentation; do not equate different files with a runtime failure.
- **Group 11 update:** ENV-09 (D023) makes `keycloak/realm-dev.json` the local source of truth; [runtime-environments.md](runtime-environments.md) records the per-environment realm-file roles. README correction remains Step 12.
- **Group 12 update:** **Closed (documentation).** README names `realm-dev.json` and the deployment realm file.

## G006 Client party routes and methods disagree with backend

- **Expected:** Browser/iOS operations use the backend's documented method/path contract.
- **Observed:** Browser `backend-functions.js:76` filters via POST while the list/filter resource uses GET; `backend-functions.js:110` uses POST on `/api/party/{id}` while updates use PUT `/api/parties/{id}`. Swift `Partynotificationsystem.swift:390` and `:419` contain singular polling paths. `PartyView/PartyDetailView.swift:339` is a debug simulation path; regular editing at `:472` already uses PUT on the plural route. iOS calls to `/api/users/{id}/device-token` also differ from both backend `/api/users/device-token` and `/api/parties/device-token` routes.
- **Disposition:** Observed call-site compatibility gap against accepted D016/PARTY-13; reachability/user impact remains unverified. The accepted contract does not select a redirect/removal migration. **Priority:** medium. **Owner:** later implementation; notifications Step 8, API matrix/Q014 Step 11.
- **Next action:** Trace active callers, then replace or explicitly migrate each wrong method/path without assuming every legacy helper is reachable.

## G007 QR generation and exchange describe different payload flows

- **Expected:** D021 defers QR login and preserves Keycloak as the only accepted sign-in/session mechanism; any future retained QR design needs one coherent generation/consumption/identity contract.
- **Observed:** `qr/QrResource.java:42` emits a user-ID login deep link and user image path; `:115` exchanges a token via `QrService.findValidByToken`. The generation endpoint does not call or return the stored-token generation path.
- **Disposition:** Product scope is resolved as deferred/unsupported; the exposed inconsistency remains implementation debt detailed by G046/G049. **Priority:** high while exposed. **Owner:** bounded retirement/containment work or a future QR proposal; API Step 11.
- **Next action:** Do not treat either path as authentication. Retire or disable unsupported routes/clients, or design and approve one replacement flow before implementation.

## G008 QR verification embeds signing material

- **Expected:** D001/D014/D021 reject the custom QR/mobile token as an accepted PartyHub identity mechanism; no accepted requirement endorses embedded signing material.
- **Observed:** `qr/QrResource.java:137` and `QrService` contain matching hardcoded HMAC material. Its value is intentionally not duplicated here.
- **Disposition:** Product scope is resolved as deferred/unsupported, while the exposed verifier remains a security-sensitive implementation observation expanded in G048. **Priority:** high while exposed. **Owner:** bounded retirement/containment work; identity/API Step 11.
- **Next action:** Remove exposure of the unsupported verifier or replace it only through a separately accepted identity design; never promote the embedded value to configuration as sufficient proof of a secure flow.

## G009 Private access checks are missing on several source paths

- **Expected:** D007/D017 and PARTY-14 establish private-party access and invitation/attendance viewer boundaries: pending invitations and current joined membership qualify, while declined/withdrawn invitations do not. D008 has profile-specific wording and D009 establishes gallery-viewer boundaries.
- **Observed:** Step 2 traced [access rows 14,20-29,55-57](access-matrix.md#access-matrix). Legacy title/theme/date filters and sorting (`PartyRepository:411-445`) omit the visibility predicate used by default/new-filter paths. `attendParty:566` and `attendStatus:643` do not check visibility. Party media/location and user-media reads have no caller-based predicates. User-location update looks up an independently generated location entity ID using the caller user ID without checking its linked user (`UserResource:406`, `UserLocation`), so same-user ownership cannot be assumed from caller resolution alone.
- **Disposition:** Missing checks confirmed in inspected source paths; runtime responses, data population and exploitability not exercised. D016/PARTY-04 require branch-consistent party list/detail visibility, D017/PARTY-07/PARTY-14 require private join/status/projection checks, and D022/PARTY-17 exclude shared user/attendee location. **Priority:** high. **Owner:** bounded list/detail, invitation/attendance, media and unsupported-location containment implementations; exact route behavior Step 11/Q014.
- **Next action:** Implement pending-invitation private join and actor-scoped projection checks in a separate application change. Preserve D007/D009/D016/D017/D022 while containing unsupported location reads and deferring any shared-location consent model to a separate proposal.

## G010 Map requirements have implicit platform scope

- **Expected:** D011's archived changes target the SwiftUI iOS map; shared discovery remains platform-neutral where appropriate.
- **Observed:** Durable discovery/filter wording can read as universal, while radius requirements explicitly name SwiftUI rotation and MapCircle. Archived change Impact sections name iOS files.
- **Disposition:** Resolved specification ambiguity. D018 and the synced PARTY-08-PARTY-11/RADIUS-01-RADIUS-03 wording name iOS scope while PARTY-16 keeps shared queries platform-neutral. **Priority:** resolved. **Owner:** completed Step 6.
- **Next action:** None at the specification layer; implementation differences remain under their own gap IDs.

## G011 Theme fallback conflicts with filter combination wording

- **Expected:** Enabled map filters are combined with AND according to the existing combination scenario.
- **Observed:** The final missing-theme scenario in `party-discovery-and-management` says to exclude a party from theme matches unless another non-theme filter includes it; that exception is ambiguous alongside the AND rule.
- **Disposition:** Resolved specification ambiguity. D018, resolved Q008 and synced PARTY-08/PARTY-11 require strict AND behavior, excluding missing or non-matching theme whenever theme is active. **Priority:** resolved. **Owner:** completed Step 6.
- **Next action:** None at the specification layer; any source mismatch remains an implementation concern.

## G012 Radius Purpose placeholder

- **Expected:** Every main capability has a meaningful Purpose and passes strict validation.
- **Observed:** `openspec/specs/map-radius-control/spec.md:4` contains the archive-generated placeholder. Initial strict validation passes 5 of 6 specs and fails this one with an overview warning.
- **Disposition:** Known baseline documentation defect. **Priority:** low. **Owner:** Step 12, explicitly authorized direct Purpose correction.
- **Next action:** Replace only the Purpose with the already accepted capability intent during consolidation; leave requirements unchanged unless a separate domain delta changes them.
- **Group 12 update:** **Closed.** The Purpose was replaced directly in the main spec; strict validation passes with CLI 1.13.2.

## G013 Test presence and source inspection do not establish runtime coverage

- **Expected:** Evidence reports distinguish source observations, test presence and actual execution.
- **Observed:** JUnit/RestAssured and HTTPYac suites exist; the foundation stage has not run them, started services or exercised browser/iOS flows. Test configuration enables auth bypass. Historical HTTPYac README pass claims are not a current test result.
- **Disposition:** Evidence limitation, not a test failure. **Priority:** low; revisit for access-test relevance. **Owner:** Each domain; consolidated evidence Step 11.
- **Next action:** Map assertions when needed and record any later executed test command/environment/result precisely. Do not claim that bypass-enabled tests verify real Keycloak authentication.
- **Group 11 update:** [quality-evidence.md](quality-evidence.md) consolidates the JUnit/HTTPYac/CI map. ENV-11 makes bypass-only results non-authoritative. No test was executed in Group 11; the missing real-JWT job is G061.

## G014 Gallery target and per-client support need reconciliation

- **Expected:** D009 permits party viewers to upload at any time and distinguishes accepted upload target from historical browser read-only behavior.
- **Observed:** Backend uploads exist. The inspected browser `gallery/gallery.html` and `gallery.js` provide a grid/modal view without upload controls, and reference `/api/media/{id}` images without a matching Java REST resource in the inventory. Swift `Photo/PartyBilderView.swift` stores images in local documents; backend-gallery parity is not established. Media upload identity/access, profile upload constraints and URL serving need exact domain review. See `media/MediaRepository.java:112` and `user/UserResource.java:265`.
- **Disposition:** Resolved specification ambiguity. Group 7 integrated server-backed shared state, authenticated Viewer upload and honest local-only client state through D019/MEDIA-01-MEDIA-03/SOC-07. G036-G039 retain the concrete implementation gaps. **Priority:** resolved. **Owner:** completed Step 7.
- **Next action:** Address G036-G039 in bounded implementation changes without inventing UI parity or retention policy.

## G015 README setup command points to a missing script

- **Expected:** Local setup commands reference tracked executable scripts.
- **Observed:** README recommends `./deploy.sh`; tracked setup scripts include `deploy-local.sh`, `sync-import.sh` and `run-http-tests.sh`, while `deploy.sh` is absent from the inspected repository.
- **Disposition:** Setup documentation drift. **Priority:** medium. **Owner:** Step 11, correction Step 12.
- **Next action:** Read the scripts to establish their actual side effects and supported local workflow; do not execute deployment or seed synchronization to document it.
- **Group 11 update:** `deploy-local.sh` removes Compose volumes, rebuilds (running JUnit) and starts dev mode; `sync-import.sh` truncates local and Kubernetes data by default. See [runtime-environments.md](runtime-environments.md) and G060. README correction remains Step 12.
- **Group 12 update:** **Closed (documentation).** README uses `deploy-local.sh` and describes its destructive effects.

## G016 Discovered capabilities lack complete durable contracts

- **Expected:** Every retained product surface is eventually specified or explicitly excluded with a reason.
- **Observed:** AUTH-10-AUTH-12, SOC-01-SOC-11, PARTY-01-PARTY-19, MEDIA-01-MEDIA-03 and RADIUS-01-RADIUS-03 now cover the bounded identity, profile/social, party, media, map, notification and extended-client contracts. D021 explicitly defers QR login and D022/PARTY-17 defer shared location rather than leaving either silently uncovered. Durable coverage remains incomplete for exact API/runtime behavior and physical storage/notification/legacy-QR retention and retry operations. Inventory ownership does not prove requirement completeness.
- **Disposition:** Remaining specification coverage gaps have assigned steps and do not authorize feature implementation. **Priority:** medium. **Owner:** Step 11 as assigned in inventory.
- **Next action:** Complete the remaining bounded runtime/API review and deltas; use Q006/Q011-Q014 where target behavior is not already decided.
- **Group 12 update:** **Closed.** All discovered surfaces are covered or explicitly excluded (see [acceptance.md](acceptance.md)); runtime contracts were added in Groups 11-12.

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
- **Group 11 update:** ENV-09 now defines the target: only `realm-dev.json` is imported locally. The image-baked `realm-staging.json` in the same import directory remains the observed conflict. Bounded remediation: stop copying the staging realm into the image used by Compose (for example with a separate build target or a deployment-only copy) and document existing-realm recreation.
- **Group 12 update:** Backlog B17.

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
- **Group 12 update:** Now conflicts with the modified AUTH-08 (D028): ambiguous matches must create a new linked user. Backlog B04.

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

- **Expected:** PARTY-04/PARTY-16 require one visibility-first candidate set, AND-composed supported predicates, deterministic post-filter sorting and pagination, and complete time/location inputs.
- **Observed:** `PartyResource.getParties:80-119` chooses new-filter, legacy-filter, sort, or default paths. Legacy text/theme/date selection uses `else if`, bypasses visibility and ignores other supplied criteria. Sort bypasses visibility and does not compose. Only `findWithFilters:814-885` honors limit/offset; it always adds a next-14-days predicate and pages after optional in-memory distance filtering. Equal-time order has no stable identifier tie-break.
- **Disposition:** Source mismatch against accepted PARTY-04/PARTY-16 and D018. No endpoint was executed. **Priority:** high. **Owner:** bounded discovery backend implementation; exact wire/status/default limits Step 11/Q014.
- **Next action:** Consolidate party queries behind the viewer predicate and add anonymous/authenticated combination, boundary and stable-page tests without changing browser/iOS UI parity.

## G035 The smallest finite iOS radius has no circle or radius camera response

- **Expected:** RADIUS-03 and D018 require every finite radius with location to render a matching geographic circle and adjust the camera, with explicit finite/unlimited transitions.
- **Observed:** `MapView.shouldShowSearchRadiusCircle` and `shouldAutoFocusForDistanceFilter` exclude both unlimited and the 5 km finite option. Filtering still applies 5 km, but the circle and radius-focused camera do not. Other finite values render/focus; unavailable location resets to unlimited and disables the slider.
- **Disposition:** iOS source mismatch against accepted finite-radius visualization; source inspection only, no SwiftUI flow or build executed. **Priority:** medium. **Owner:** bounded iOS map implementation.
- **Next action:** Make every finite selection drive the same filter/circle/camera state contract and add tests or UI verification for 5 km, another finite value, unlimited, reset and location loss.

## G036 Party media serving and projections bypass or lack the Viewer boundary

- **Expected:** D007/D009/D017/D019 and MEDIA-01 require private party content to remain within the host, pending-invitee and joined-attendee Viewer boundary for gallery lists, individual bytes and user-media projections while retaining anonymous public-party viewing.
- **Observed:** Party gallery list and user-media routes are open and repository queries apply no caller/party visibility predicate. Media byte helpers also contain no caller check, and no inventoried Java REST resource exposes the browser's `/api/media/{id}` URL.
- **Disposition:** Source access/serving mismatch and missing surface against accepted MEDIA-01, not a runtime exploit reproduction. **Priority:** high. **Owner:** bounded media backend/API implementation; exact route/status/envelope Step 11/Q014.
- **Next action:** Implement one Viewer check for list/item/user projections and an authorized item-serving surface, then test anonymous public, each private Viewer role, unrelated caller, missing record and missing file with normal bearer identity.

## G037 Gallery upload validation and persistence are not one consistent operation

- **Expected:** D001/D009/D019 and MEDIA-03 require authenticated Viewer upload at any party time, non-empty JPEG/PNG/GIF/WebP up to 5 MiB, a server-owned safe reference and no usable record whose accepted backing file was not stored.
- **Observed:** The route is authenticated and derives the caller but does not check Viewer eligibility. Repository validation uses declared media type and size, sanitizes the client filename, persists metadata before moving the file, and exposes no reviewed compensation for a move failure. No delete endpoint or accepted physical cleanup policy was found.
- **Disposition:** Authorization, content-validation and logical consistency mismatch against accepted MEDIA-03; no failed move or malicious upload was executed. Physical retention remains Q006 rather than an implied immediate-delete rule. **Priority:** high. **Owner:** bounded media upload implementation; storage lifecycle Step 11.
- **Next action:** Enforce Viewer eligibility and server-side content validation before side effects, make file/metadata publication failure-consistent, and test anonymous/non-Viewer/invalid/oversize/unsafe-name/storage-failure cases without adding unapproved deletion semantics.

## G038 Browser and iOS party-photo state represent different stores

- **Expected:** D019/MEDIA-02 distinguish the shared server gallery from device-local photos. Clients may expose different controls, but local files cannot be presented as uploaded PartyHub media.
- **Observed:** Browser gallery reads backend media into a grid/modal and has no inspected upload control. iOS `PartyBilderView` and related party-detail photo code copy/remove local document files and do not use the backend gallery; another photo screen uses fixed demo content.
- **Disposition:** Client support/state mismatch against accepted MEDIA-02, not proof that platform UI parity is required. **Priority:** medium. **Owner:** bounded browser/iOS media work.
- **Next action:** Keep local iOS state explicitly local, add server synchronization only through an approved client change, and verify shared refresh/empty/error states separately on each supported client.

## G039 Profile-picture reads, validation and replacement conflict with the profile contract

- **Expected:** D001/D015/D019 and SOC-05-SOC-07 place picture content under authenticated profile viewing, permit only Self replacement, validate non-empty JPEG/PNG/GIF/WebP up to 5 MiB, provide a stable placeholder/reference and preserve the current usable picture on replacement failure.
- **Observed:** Profile-picture and filename reads are open. Browser and iOS perform direct image calls; iOS can reject the server SVG placeholder as undecodable image content. Upload is self-authenticated, but the backend lacks a common type/size/content boundary, deletes the old metadata row before the new file move succeeds, and does not establish physical old-file cleanup. Browser client checks broad `image/*`/5 MiB while iOS sends JPEG.
- **Disposition:** Access, validation, fallback, cache and failure-consistency mismatch against accepted SOC-07; source inspection only. Physical retention stays Q006. **Priority:** high. **Owner:** bounded profile/media backend and client work; lifecycle/API Step 11.
- **Next action:** Require authenticated reads, implement a client-compatible placeholder and refresh reference, validate on the server, preserve the prior logical picture on failure, and test Self/other/anonymous/invalid/storage-failure/cache-refresh cases.

## G040 Notification records lack typed identity, stable ordering and cancellation snapshots

- **Expected:** D020/SOC-08 require explicit event type, event-recipient identity, actor, bounded content, deterministic newest-first ordering, optional party reference or durable cancellation snapshot, and message-independent action policy.
- **Observed:** `notification/Notification.java` stores recipient, sender, optional party, status, message and timestamp, while `NotificationDto` exposes no event type or stable event identity. Type filtering and protected-deletion rules use English message matching, equal timestamps have no identifier tie-break, and party-bound cleanup cannot preserve a bounded cancellation snapshot independently of the deleted party.
- **Disposition:** Storage/query mismatch against the accepted typed center contract; migration and runtime data were not exercised. **Priority:** high. **Owner:** bounded notification backend/data change; persistence and migration Step 11.
- **Next action:** Add typed event and idempotency/snapshot fields with a migration, replace message parsing with stored policy, define stable ordering and test retry, filter, deletion and post-cancellation reads.

## G041 Event producers conflict with accepted recipients and no-op suppression

- **Expected:** D020/SOC-03 and PARTY-15 require one event per intended recipient for each committed transition, no self-duplicates, and no event for denied, failed or repeated no-op actions.
- **Observed:** Follow acceptance creates messages for both users, invitation withdrawal has no accepted-equivalent event path, attendance outcomes vary between invitation and party repositories, public join and some leave paths omit or disagree on host notification, and party-update/cancellation recipient/cleanup behavior is tied to current repository branches. Tests assert only partial counts/messages and do not prove the complete matrix.
- **Disposition:** Cross-producer behavior mismatch against the accepted event-recipient matrix; no transition was run. **Priority:** high. **Owner:** bounded follow/invitation/party event implementation.
- **Next action:** Emit one shared typed event input after each committed transition, deduplicate party audiences, suppress actor/self and same-transaction duplicates, and test every matrix row plus denial/failure/no-op cases.

## G042 Preference defaults and delivery gates are coupled or incomplete

- **Expected:** D020/SOC-09 require one same-user effective settings state, enabled in-app/email and category defaults, disabled unsupported push/SMS defaults, atomic replacement, independent channel/category evaluation, and pending actions that remain available when informational delivery is disabled.
- **Observed:** `UserNotificationSettings` initializes every boolean true, including push/SMS. Missing settings return not-found instead of effective defaults. `NotificationRepository.createNotification` checks the in-app setting before persistence and out-of-app dispatch, so disabling in-app also suppresses eligible email; category booleans are not generally applied outside the digest path. No inspected browser or iOS settings consumer exists.
- **Disposition:** Defaults, gate independence and client-support mismatch against accepted SOC-09. **Priority:** high. **Owner:** bounded settings/delivery backend change; optional client surfaces separately scoped.
- **Next action:** Materialize documented defaults, validate complete replacement atomically, evaluate channels/categories independently from authoritative actions, and add missing-row plus cross-gate tests.

## G043 Welcome and digest email boundaries differ from the accepted contract

- **Expected:** D020/SOC-11 require one best-effort welcome attempt after durable profile creation and a preference-aware weekly digest whose party content is filtered per recipient through the shared Viewer predicate; neither flow creates center state or controls domain success.
- **Observed:** Welcome is invoked after user/settings creation and catches failure, but it does not apply the global mail-availability boundary or establish exact duplicate prevention. The digest selects upcoming parties globally, including private party details unrelated to a recipient, then checks only email and `partyUpdates`; it catches per-user failures but does not reuse party visibility.
- **Disposition:** Recipient-visibility and delivery-boundary mismatch; scheduler, SMTP and duplicate behavior were not run. **Priority:** high for private digest disclosure, medium otherwise. **Owner:** bounded email implementation; scheduler/provider quality Step 11.
- **Next action:** Build each digest from the recipient's Viewer-eligible parties, make welcome attempt identity explicit, retain per-recipient failure isolation and add private-content, disabled, duplicate and failure tests.

## G044 Push and device-token behavior is not an integrated supported channel

- **Expected:** D020/SOC-10 classify push as unsupported until a configured adapter and client contract exist; any later registration derives ownership only from the authenticated caller and push failure does not affect in-app/email/domain state.
- **Observed:** `PushNotificationService` is not referenced by production event producers and sends raw HTTP/2 requests to the APNs sandbox with only a topic header, attendee-token query and no preference/category/event identity or accepted authentication/result handling. Backend duplicates authenticated PUT/query token routes at `/api/parties/device-token` and `/api/users/device-token`, while both iOS implementations POST JSON to `/api/users/{userId}/device-token` and include a user identifier. SMS has no adapter.
- **Disposition:** Honest capability classification and cross-client API mismatch; no APNs request or device registration was run. **Priority:** medium while unsupported, high before activation. **Owner:** separate push integration decision/change; exact route/schema Step 11/Q014.
- **Next action:** Keep push/SMS effectively disabled, choose one caller-derived registration contract before activation, add provider credentials/result handling and event/preference integration, then verify permission/token/failure paths without weakening other channels.

## G045 Browser and iOS notification surfaces diverge from shared center/settings semantics

- **Expected:** D020/SOC-03/SOC-08-SOC-10 permit different UI controls but require any exposed center/action/settings behavior to use typed recipient state, authoritative pending actions and shared preference/channel rules.
- **Observed:** The browser notification page merges invitations, follow inbox and backend notifications, infers types/protection from messages, does not call mark-read and has no settings UI. iOS requests OS permission, keeps local badge/update polling and remote deep links, but no complete backend notification-center/settings client was found; polling uses stale singular party routes and token registration conflicts with the backend. Domain action dismissal and informational deletion are not consistently separated across clients.
- **Disposition:** Client support/compatibility mismatch without a parity requirement; neither client was executed. **Priority:** medium. **Owner:** bounded browser/iOS notification work after shared backend/API contracts.
- **Next action:** Replace message heuristics with typed data, keep actions backed by current domain state, add read/settings support only where product scope selects it, and verify browser/iOS refresh, stale-action and unavailable-permission behavior separately.

## G046 QR generation never creates the token consumed by status and exchange

- **Expected:** D021 classifies QR login as unsupported; an exposed prototype must not be mistaken for a coherent credential flow. Any future retained flow needs one transaction-linked handoff value from generation through status, scan and exchange.
- **Observed:** Authenticated `/api/qr/generate` returns a numeric-user deep link and image URL without calling `QrService.generateForUser`, persisting `QrLogin`, or returning a token/expiry. The browser page nevertheless reads absent `data.token` and polls `/api/qr/status/undefined`. Token-based image and exchange paths can operate only on separately seeded or otherwise manually created rows.
- **Disposition:** Broken cross-path implementation and documentation mismatch under the explicit defer decision. **Priority:** high while the page/routes remain exposed. **Owner:** bounded QR retirement/containment or future approved redesign; API Step 11.
- **Next action:** Remove or disable the unsupported generation/poll/exchange journey, or replace it only after a proposal defines one securely linked flow and tests its complete lifecycle.

## G047 Public QR status and image endpoints expose identifier and token-derived state

- **Expected:** D001/D021 provide no accepted public QR identity API. Numeric IDs and path tokens do not authenticate a user, and unsupported surfaces should disclose no more identity/state than an explicitly accepted design requires.
- **Observed:** `/api/qr/image/user/{userId}` publicly confirms existing user IDs and encodes them in a login deep link. `/api/qr/status/{token}` and `/api/qr/image/{token}` are public bearer-like paths; status reports raw used/expiry data and token images accept used/expired rows. Neither path is bound to the authenticated generator or intended scanner.
- **Disposition:** Access/disclosure gap on deferred endpoints; no requests were executed. **Priority:** high. **Owner:** bounded QR endpoint containment; exact retirement/status behavior Step 11/Q014.
- **Next action:** Prevent the unsupported endpoints from serving as public identity/status oracles. A future proposal must define possession, audience and disclosure rules before reopening them.

## G048 Custom mobile token cannot establish the accepted PartyHub identity boundary

- **Expected:** D001/D014/D021 require the normal Keycloak issuer and validated bearer-session path for browser/iOS identity; a deferred QR token cannot select a local user or authorize protected APIs.
- **Observed:** Exchange issues a custom HS256 JWT using embedded signing material, no issuer/audience/provider trust and a scalar local user ID. `/mobile/me` verifies that separate value, does not consult stored JTI/revocation state, and returns only `userId`; it encodes `sub` as a JSON string but casts the decoded value to `Integer`. The custom token is not accepted by the normal backend bearer mechanism.
- **Disposition:** Identity/security and functional mismatch against the accepted authentication contract; no successful endpoint flow was run. **Priority:** high. **Owner:** remove/contain unsupported credential paths or replace through a separate identity proposal; environment/API verification Step 11.
- **Next action:** Do not wire the custom token into protected APIs. Retire the verifier/issuer or design a provider-integrated handoff with explicit trust, proof, audience and revocation rules.

## G049 Browser, iOS and welcome-link QR consumers are inactive or incompatible

- **Expected:** D021 marks QR login unsupported and keeps Keycloak as the active sign-in path. Legacy UI/deep links must not imply successful QR authentication.
- **Observed:** The browser QR page polls an absent token; the profile helper targets missing DOM elements and renders a disabled logged-out button. iOS never sets its scanner presentation state in the inspected view, discards any scanned code, and labels the path legacy. The app posts `.legacyQRLogin` for numeric deep links but has no observer. Welcome templates still emit that numeric login link. No client calls exchange/mobile identity or stores a custom token.
- **Disposition:** Reachability, UX and cross-client mismatch on deferred surfaces; no UI was run. **Priority:** medium, high where users are presented with a login claim. **Owner:** bounded browser/iOS/email cleanup or future approved QR client implementation; documentation reconciliation Step 12.
- **Next action:** Stop presenting unsupported QR login affordances/links in a bounded implementation change, or implement clients only after an accepted replacement contract exists.

## G050 QR token lifecycle, concurrency and tests do not establish single-use credentials

- **Expected:** The defer record makes no QR reliability guarantee. Any future retained handoff needs explicit expiry, one-time atomic exchange, cleanup/revocation/account lifecycle and tests that prove the accepted identity result.
- **Observed:** `QrLogin` stores scalar user ID, token, expiry, used flag, JTI and mobile expiry with no user relationship or reviewed cleanup. Validity read and used update are not visibly one locked transaction around exchange. Status/image paths ignore validity. Tests cover helper/repository happy paths and basic resource errors, but no successful end-to-end generation/exchange/mobile identity, concurrency, replay, cleanup, revocation or protected-API authentication.
- **Disposition:** Data-lifecycle and evidence gap for a deferred feature; no runtime test was run. **Priority:** medium while contained, high before any future activation. **Owner:** Step 11 persistence/quality plus any future QR proposal.
- **Next action:** Keep the feature unsupported. A future proposal must define lifecycle and acceptance cases before implementation; removal work should also address stored rows and seed/docs without inventing retention policy.

## G051 Shared user and attendee locations are publicly readable without a Viewer boundary

- **Expected:** D007/D017 protect private-party context, and D022/PARTY-17 defer shared current/attendee locations entirely. Neither joined attendance nor a numeric path value grants consent to publish current coordinates.
- **Observed:** `GET /api/users/location/{id}` is open and loads a `UserLocation` entity directly. `GET /api/parties/{id}/locations` is open, checks only party existence and returns stored positions for joined users without caller, Viewer, private-party, per-user sharing or consent checks.
- **Disposition:** Access/privacy mismatch on unsupported endpoints; no route was executed. **Priority:** high. **Owner:** bounded endpoint containment/removal; exact status/migration Step 11/Q014.
- **Next action:** Prevent unsupported location reads from exposing coordinates or private-party context, preserve the routes in inventory until compatibility is decided, and test anonymous/authenticated/private-party denial during the later implementation change.

## G052 User-location identity and storage keys are inconsistent

- **Expected:** D001 requires caller-derived identity for protected actions, while D022/PARTY-17 accept no server location-sharing mutation. Any future same-user location storage would need an unambiguous caller-owned row.
- **Observed:** Authenticated `PUT /api/users/location` resolves the caller but uses `em.find(UserLocation.class, userId)`, treating the user ID as the independently generated location entity ID. An existing row is mutated without checking `existingLocation.user.id`; otherwise another row is inserted. Public `GET /api/users/location/{id}` uses the same primary-key meaning despite its user-oriented path name.
- **Disposition:** Ownership and identifier mismatch on a deferred surface; database constraints and runtime effects were not exercised. **Priority:** high. **Owner:** endpoint containment or future approved location redesign; persistence/API Step 11.
- **Next action:** Do not infer safe same-user behavior from authentication. Remove/disable the unsupported mutation or use an explicitly designed unique caller-owned mapping only after shared location is approved.

## G053 iOS attendee-location clients use stale identity and unauthenticated projections

- **Expected:** D001/D014 require the bearer-backed PartyHub user, D007/D017 protect private-party and host-only projections, and D022/PARTY-17 make attendee location unsupported.
- **Observed:** `PartyAttendeeMapView` and `UserLocationListView` use hard-coded current user ID `1` in self/filter branches, perform raw unauthenticated location, following and invited-member requests, and synthesize a current-user marker. Location upload is attempted only when a legacy `UserDefaults.currentUserId` exists, even though the method's `userId` argument is unused and the request itself uses a bearer token. Accepted/pending filter cases return empty arrays.
- **Disposition:** Client identity/access/behavior mismatch on a deferred feature; no iOS flow was run. **Priority:** high. **Owner:** bounded removal/containment or a future shared-location client proposal.
- **Next action:** Remove or disable unsupported attendee-location affordances without weakening accepted party details, or replace every identity/projection path only after an approved consent and Viewer contract exists.

## G054 Shared location data has no consent, freshness, revocation or retention state

- **Expected:** D022/PARTY-17 require a separate future proposal before shared location can be retained; it must define consent, audience, precision, freshness, revocation, deletion/retention and private-party behavior.
- **Observed:** `UserLocation` stores latitude, longitude and a user relationship only. There is no sharing state, observed/update time, precision, expiry, revocation, purpose, cleanup or account/party lifecycle policy. Repository tests assert persistence and joined-party selection but not those boundaries.
- **Disposition:** Data-model/lifecycle gap for an excluded/deferred feature. **Priority:** high before any activation. **Owner:** future product proposal plus Step 11 persistence/privacy review.
- **Next action:** Keep server location sharing unsupported and contain current routes/data. Do not add lifecycle fields or retention assumptions until a separately approved design defines the feature.

## G055 iOS visit tracking starts broadly and lacks accepted permission/failure transitions

- **Expected:** D022/PARTY-18 make tracking optional, explicitly enabled, permission-gated, device-local, idempotent and separate from attendance; denial/failure stops new records without fabricated visits.
- **Observed:** App setup requests always-location permission and registers geofences for every fetched local party without a separate tracking opt-in or attendance eligibility. Region entry/exit writes SwiftData visits, save failures are ignored, monitoring failures are printed only, and local party deletion cascades visit records. Permission changes, duplicate/out-of-order events, region limits, background delivery and persistence have no identified automated tests.
- **Disposition:** Source/permission/lifecycle mismatch against an accepted requirement. **Priority:** high for consent, medium for behavior. **Owner:** bounded iOS implementation; platform/runtime verification Step 11.
- **Next action:** Add explicit enable/disable and permission transitions, restrict eligible monitoring, make interval transitions coherent, surface failures and test local deletion without sending attendance or location to the backend.

## G056 Calendar export feedback and snapshot lifecycle are incomplete

- **Expected:** D022/PARTY-19 define a user-initiated local snapshot, contextual permission, no duplicate associated event, safe removal/stale-association recovery and failure isolation from PartyHub state.
- **Observed:** Party details expose add/remove and `CalendarService` stores event IDs locally, but denied/save/remove failures mostly reset or leave UI state without actionable feedback. A missing party start is replaced with the current time, stale mappings are not proactively cleared by `hasEvent`, and party edit/cancellation does not update the event. No EventKit or device test was identified.
- **Disposition:** Client feedback/data-mapping mismatch against an accepted requirement; automatic synchronization is intentionally not promised. **Priority:** medium. **Owner:** bounded iOS implementation/testing.
- **Next action:** Use valid stored party fields, report permission/save/remove failures, prevent duplicate mappings, clear stale associations safely and label export as a snapshot requiring explicit remove-and-export after changes.

## G057 Every deployment resets application and Keycloak data

- **Expected:** Deployment behaviour and data durability follow an explicit decision (Q015). Keycloak data is not destroyed as a side effect of resetting application data.
- **Observed:** `.github/workflows/deploy.yml` runs `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` on the `demo` database for every deploy and replays `import.sql`. `k8s/keycloak.yaml` points Keycloak at the same `demo` database, so realm state and registrations are dropped too; the step comment says only the Keycloak schema is dropped. Profile-picture files on the PVC survive and become orphans. This is workflow/manifest evidence, not an observed run.
- **Disposition:** Deployment/data-lifecycle conflict pending Q015. **Priority:** high. **Owner:** Step 11 evidence; bounded deployment change after Q015.
- **Next action:** Decide Q015. If data must persist, give Keycloak its own database/schema, remove the unconditional drop and make seeding explicit; if reset is intended, document it as a demonstration-environment property and still separate the Keycloak database.
- **Group 12 update:** Now conflicts with the accepted DEPLOY-01/DEPLOY-02 (D030): the school cloud is persistent. Backlog B01, top priority.
- **B01 update:** **Closed by B01** (change `persistent-school-cloud-deployment`). `deploy.yml` applies the manifests in place and rolls out pinned image tags; it no longer deletes Deployments, drops the schema or replays seed data. Keycloak uses its own `keycloak` database (created by an initContainer) and realm import keeps an existing realm (`IGNORE_EXISTING`, verified locally). The fix takes effect on the school cloud after the one-time cut-over in [`../deployment-cutover.md`](../deployment-cutover.md). Scheduled backups are still missing (G067).

## G058 Party gallery files are stored outside persistent storage and served from the classpath

- **Expected:** D019/MEDIA-03 require a stored gallery reference to stay usable after a successful upload.
- **Observed:** `media/MediaRepository.upload` writes to `src/main/resources/uploads/party{id}/` relative to the working directory. In the container that is `/app/src/...`, outside the `/app/uploads` PVC, so files are lost on pod replacement. `getMediaById` reads a classpath resource, which only finds files packaged at build time, and no REST route exposes it (G036).
- **Disposition:** Storage/serving mismatch against an accepted requirement. **Priority:** high for gallery use. **Owner:** bounded media implementation change.
- **Next action:** Store gallery files under a configurable persistent upload directory (like profile pictures), serve them through a Viewer-checked route, and add persistence/serving tests.

## G059 Schema evolution has no migration record

- **Expected:** Schema changes that preserve accepted persisted state (SOC-08, PARTY-14) are applied predictably in every environment.
- **Observed:** No Flyway/Liquibase. Production uses Hibernate `update`; dev and tests use drop-and-create. `notification/NotificationSchemaCompatibility` applies hand-written DDL/backfill at startup on PostgreSQL and ignores failures. Root `create-tables.sql`/`test-data.sql` are unreferenced manual fixtures with users absent from the realm files.
- **Disposition:** Persistence-process gap; no accepted migration policy. **Priority:** medium (low while G057 resets every deploy). **Owner:** Step 11 evidence; bounded runtime change after Q015.
- **Next action:** Introduce versioned migrations when data must persist, move the startup DDL into them, and retire or label the unreferenced root SQL files.
- **Group 12 update:** Required by DEPLOY-02 *Schema changes keep existing rows*. Backlog B01.
- **B01 update:** **Closed by B01.** Flyway owns the schema: `db/migration/V1__baseline.sql` (generated from the entities) and `V2__…` (the former `NotificationSchemaCompatibility` DDL, class removed). All profiles use Hibernate `validate`; existing databases are baselined at version 1. Dev seeds through the `db/dev-seed/afterMigrate.sql` callback, so HTTPYac in CI runs the migrations on PostgreSQL. A local upgrade rehearsal from the `update`-built schema found only differently named unique constraints (`uk…` vs `…_key`), with no semantic drift. New migrations must not rely on those constraint names. The root `create-tables.sql`/`test-data.sql` are unchanged (B19).

## G060 Seed and reset scripts are destructive and under-documented

- **Expected:** Setup documentation identifies commands that delete local or shared data.
- **Observed:** `deploy-local.sh` runs `docker-compose down -v`. `sync-import.sh` applies `import.sql`, which begins with `TRUNCATE ... RESTART IDENTITY CASCADE`, to both local and Kubernetes Postgres unless restricted by flags. README presents both as ordinary setup/sync steps (and names a missing `deploy.sh`, G015).
- **Disposition:** Documentation/operational-safety gap. **Priority:** medium. **Owner:** Step 12 README reconciliation; optional script-safety change.
- **Next action:** Document the destructive effects and the `--local-only` flag in README; consider making the Kubernetes target opt-in.
- **Group 12 update:** README now documents the destructive effects; the optional script change is B19.

## G061 CI does not gate deployment on success or exercise real bearer authentication

- **Expected:** Quality evidence for AUTH comes from real-token checks (ENV-11), and deployment follows successful build/test runs.
- **Observed:** `deploy.yml` triggers on Build and Push `completed` without checking the conclusion. JUnit disables SmallRye JWT and enables the bypass. HTTPYac runs against `quarkus:dev` with the bypass. No workflow runs on pull requests. No browser/iOS tests exist.
- **Disposition:** Test/pipeline evidence gap. **Priority:** medium (high for the G002 regression risk). **Owner:** bounded CI/test change.
- **Next action:** Add `if: github.event.workflow_run.conclusion == 'success'` to deploy. Add a bypass-disabled integration job that obtains local realm tokens and asserts accepted AUTH scenarios, including numeric-only rejection.
- **Group 12 update:** DEPLOY-02 *Failed pipeline does not deploy* makes gating a requirement. Backlog B01 (gating) and B03 (real-token tests).
- **B01 update:** **Gating half closed by B01.** Deploy is a reusable workflow called by a `deploy` job in `push.yaml` with `needs: build-and-push`, so a failed or skipped build deploys nothing, and it deploys the image built from `workflow_run.head_sha`. The real-token half remains open (B03).

## G062 API error bodies and status usage are inconsistent

- **Expected:** Clients can handle rejection/denial/not-found consistently. The exact envelope is Q014; accepted specs are wire-agnostic.
- **Observed:** Errors appear as concatenated JSON strings `{"error": "..."}` (unescaped messages), JSON maps, plain text, empty bodies and framework violation reports. Some branches return 400 for a missing caller after `@Authenticated`. Party update has no 403 path (G003). Counts are hand-built JSON strings. See [api-contract-matrix.md](api-contract-matrix.md).
- **Disposition:** Compatibility/API-hygiene gap. **Priority:** medium. **Owner:** bounded API change after Q014.
- **Next action:** Choose one error envelope and status taxonomy (Q014), then apply it with an exception mapper and serializer-built bodies.

## G063 Static OpenAPI document is stale and not served

- **Expected:** API documentation reflects the exposed endpoints.
- **Observed:** Root `openapi.yaml` lists 48 operations. It omits 12 endpoints (rows 1, 5-7, 12, 13, 19, 23-26, 58) and lists two non-existent operations (`GET /api/media/{id}`, `POST /api/parties/{id}/media`). It sits outside `META-INF`, so Quarkus serves the annotation-generated document instead.
- **Disposition:** Documentation drift. **Priority:** low. **Owner:** Step 12.
- **Next action:** Delete the file or regenerate it from `/q/openapi`, and point README to the served document.
- **Group 12 update:** Backlog B19.

## G064 Repository guidance claims validation and encoding controls that are not applied

- **Expected:** Contributor guidance (`AGENTS.md`) matches the controls the source actually applies.
- **Observed:** `@SafeText`/`@NoHtml` are not applied to any DTO. `OnCreate`/`OnUpdate` groups are never activated. `UserCreateDto` (rows 36/44) and `NotificationSettingsDto` have no constraints. The OWASP encoder is declared but unused. CI has no SQL inspector. See [quality-evidence.md](quality-evidence.md).
- **Disposition:** Documentation/implementation mismatch; accepted validation rules remain those in PARTY-12/13, MEDIA-03 and SOC-06/07. **Priority:** medium. **Owner:** Step 12 documentation; bounded validation change with G029.
- **Next action:** Either apply the documented constraints where accepted requirements need them or correct `AGENTS.md` to describe the real controls.
- **Group 12 update:** Backlog B05 (validation) and B19 (guidance).

## G065 No cleanup exists for uploaded files or aged records

- **Expected:** Deletion and retention follow an explicit decision (Q016). Accepted flows that remove logical records do not leave unusable references.
- **Observed:** No main-source code deletes any file. Party deletion cascades media rows and deletes party notifications but leaves gallery files. Profile-picture replacement writes a new file without removing the old one. There is no scheduled cleanup (the only scheduled job is the weekly digest), no user-deletion path, and no expiry cleanup for QR (G050) or location rows (G054).
- **Disposition:** Data-lifecycle gap pending Q016. **Priority:** medium (privacy-relevant). **Owner:** bounded lifecycle change after Q016.
- **Next action:** Decide Q016, then implement file/row cleanup for the accepted deletions with tests.
- **Group 12 update:** **Deferred by D031** (retention/cleanup out of scope). Observation retained.

## G066 Installed OpenSpec CLI validates the documentation-only umbrella differently

- **Expected:** The design's final commands (`openspec validate complete-partyhub-specification --type change --strict --no-interactive` and `openspec validate --specs --strict --no-interactive`) give reproducible results across devices.
- **Observed:** On this device OpenSpec CLI `1.3.1` rejects the umbrella with "Change must have at least one delta" despite `skip_specs: true` (the CLI only uses `skipSpecs` at archive time). The same CLI passes strict validation for all six main specs, including `map-radius-control`, whose Purpose is still the placeholder (G012). The Group 10 handoff recorded the opposite on the original device: umbrella pass and radius failure.
- **Disposition:** Tooling-version difference, not a specification defect. **Priority:** medium for final acceptance. **Owner:** Step 12.4.
- **Next action:** In Step 12, record the CLI version with each validation result, repair G012 regardless, and choose an explicit way to satisfy the umbrella gate (for example, run it with the CLI version that honours `skip_specs`, or record the tool limitation as an accepted exception). Do not add artificial product deltas to the umbrella.
- **Group 12 update:** **Closed (W022).** OpenSpec CLI 1.13.2 is installed. With it the umbrella passes via `skip_specs` and all specs pass after the G012 repair.

## G067 The persistent school-cloud database has no scheduled backups

- **Expected:** Since D030 the school cloud keeps data that exists nowhere else, so it can be restored after a bad migration, operator error or volume loss.
- **Observed:** Postgres runs as a single replica on the 1Gi `postgres-pvc` (`k8s/postgres.yaml`), and nothing backs it up on a schedule. B01 takes one manual `pg_dump` at cut-over ([`../deployment-cutover.md`](../deployment-cutover.md)), and Flyway migrations are forward-only.
- **Disposition:** Operational follow-up recorded by B01 (a non-goal there). **Priority:** medium. **Owner:** bounded operations change.
- **Next action:** Add a scheduled `pg_dump` of `demo` and `keycloak` (for example a Kubernetes CronJob) to storage outside the Postgres volume, with retention and a documented, tested restore. Backlog B21.
