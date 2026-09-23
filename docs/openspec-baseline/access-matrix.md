# Endpoint identity and access matrix

Step 2.2, inspected 2026-09-23 at `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. All **58 custom endpoints** from the [foundation inventory](inventory.md#endpoint-inventory) appear exactly once, preserving its numeric IDs. This is a source-level audit, not an assertion of running-server access. Framework/static surfaces remain Step 11 inventory items.

## Reading the matrix

- `Open`: no route authentication annotation/caller requirement and no global policy found in the inspected sources; a credential-free anonymous request can reach the listed application checks. A signed-in caller, same user or host receives no additional authority unless the row says so. Invalid credentials may still be rejected by the framework.
- `Auth`: method has `@Authenticated` and calls `CurrentUserResolver.requireCurrentUser[Id]`. Anonymous access is denied by the intended normal bearer path. [Bypass configuration](auth-environments.md) can satisfy authentication through an untrusted header; every Auth row inherits G002/G019 and is not a proven JWT boundary.
- `Optional`: anonymous or resolved caller; repository selects visible data. A valid token does not bypass object checks.
- `Self`: token-resolved user owns the requested user-scoped data. `Host`: token-resolved user is the stored party host, not merely someone with a realm role. `Viewer`: public party or private host/invitee/joined user under D007; declined/revoked-invitation edges remain Q003. Host status does not grant access to another user's settings or notifications.
- **Intended** identifies accepted D/AUTH rules or explicit Q IDs where the main specs do not yet determine anonymous/authenticated/self/host policy. An unresolved row is not permission to retain source behavior. Non-authentication validation/status details are only noted where relevant; this is not Step 11's complete API schema matrix.

## Source key

Line numbers below refer to the unchanged inspected revision; names identify the predicate even if later edits move lines.

| Key | Resource, caller and repository evidence |
|---|---|
| CR | [PublicConfigResource](../../src/main/java/at/htl/config/PublicConfigResource.java):20, issuer-only map. |
| IR / IP | [InvitationResource](../../src/main/java/at/htl/invitation/InvitationResource.java), [InvitationRepository](../../src/main/java/at/htl/invitation/InvitationRepository.java). All six methods authenticate and resolve the actor. |
| NR / NP | [NotificationResource](../../src/main/java/at/htl/notification/NotificationResource.java), [NotificationRepository](../../src/main/java/at/htl/notification/NotificationRepository.java). Caller-scoped recipient queries/checks. |
| NS | [UserNotificationSettingsResource](../../src/main/java/at/htl/notificationsettings/UserNotificationSettingsResource.java):22–65 and [settings repository](../../src/main/java/at/htl/notificationsettings/UserNotificationSettingsRepository.java). Resource checks path user equals caller before repository read/save. |
| PR / PP | [PartyResource](../../src/main/java/at/htl/party/PartyResource.java), [PartyRepository](../../src/main/java/at/htl/party/PartyRepository.java). Distinct list/filter, visibility, ownership and membership paths audited individually. |
| QR / QS | [QrResource](../../src/main/java/at/htl/qr/QrResource.java), [QrService](../../src/main/java/at/htl/qr/QrService.java), [QR repository](../../src/main/java/at/htl/qr/QrLoginRepository.java). Body-token validation is separate from Keycloak HTTP authentication. |
| UR / UP | [UserResource](../../src/main/java/at/htl/user/UserResource.java), [UserRepository](../../src/main/java/at/htl/user/UserRepository.java), [CurrentUserResolver](../../src/main/java/at/htl/auth/CurrentUserResolver.java). |
| FP | [FollowRepository](../../src/main/java/at/htl/follow/FollowRepository.java):23–73 read queries,75 creation,106 recipient acceptance,161 removal. |
| MP / LP | [MediaRepository](../../src/main/java/at/htl/media/MediaRepository.java):94–172 and [UserLocationRepository](../../src/main/java/at/htl/user_location/UserLocationRepository.java):34 onward. Neither exposed read helper filters by requesting user; media `getImages` with a fixed user is not the method called by these REST list routes. |

## Access matrix

| ID | Method and full path | Observed gate / caller | Observed object checks and access | Intended access / decision / gap |
|---:|---|---|---|---|
| 1 | GET `/api/config/public` | Open; CR:20 | No user/host check; returns issuer only. | AUTH-10 accepted public authentication bootstrap; no self/host distinction and no live configuration guarantee. |
| 2 | POST `/api/invitations` | Auth; IR:21, IP:35 | Actor becomes sender; finds party/recipient, duplicate/declined checks. No host, visibility or mutual-follow check. | D001 caller; D005 private mutual eligibility. Host authority for direct invite and public invites needs Q010; G017 records missing private eligibility/host checks. |
| 3 | GET `/api/invitations` | Auth; IR:31, IP:92/113 | Received filters recipient=caller; `direction=sent` filters sender=caller. Any host sees only own sent/received rows. | D001 caller; own invitation context under D006/D012. Exact sent-list exposure policy Q010. |
| 4 | DELETE `/api/invitations/{id}` | Auth; IR:48, IP:134 | Sender or recipient only, otherwise 403; recipient declines/removes own attendance, sender deletes. Host alone insufficient unless sender/recipient. | D001; revocation/decline and sender versus host authority Q003/Q010. No accepted cross-user deletion privilege inferred. |
| 5 | GET `/api/invitations/{id}/details` | Auth; IR:58, IP:176 | Sender or recipient only; 403 other actor, 404 missing. | D001; sender/recipient/host detail policy Q010. D007 remains private-party visibility floor. |
| 6 | POST `/api/invitations/{id}/accept` | Auth; IR:67, IP:200 | Recipient only; 403 others, accepted repeated call 204. Host/sender does not act for recipient. | D001/D006 recipient's own attendance; repeated/revoked cases Q003. |
| 7 | POST `/api/invitations/{id}/decline` | Auth; IR:77, IP:245 | Recipient only; 403 others, declined repeated call 204. | D001/D006 own invitation/attendance; decline/reinvite semantics Q003. |
| 8 | GET `/api/notifications` | Auth; NR:28, NP:30 | Query always recipient=caller, including party/type/search filters. | AUTH-09/D012 caller's notifications only; no host override. |
| 9 | GET `/api/notifications/unread` | Auth; NR:46, NP:76 | Caller-recipient unread rows only. | AUTH-09/D012 same recipient scope. |
| 10 | POST `/api/notifications/{id}/read` | Auth; NR:60, NP:92 | Recipient=caller or 403; missing 404. | D001/D012 own notification state. |
| 11 | DELETE `/api/notifications/{id}` | Auth; NR:70, NP:111 | Recipient=caller or 403; source also forbids deletion of certain follow-message texts. | D001/D012 own state; protected-message exception conflicts with unqualified delete wording and needs Q007 in Step 8. |
| 12 | GET `/api/users/{id}/notification-settings` | Auth; NS:22 | Self path match or 403, then settings lookup. Host/other user denied. | D001 identity; detailed self-only settings policy Q007 (observed candidate, not yet a main-spec guarantee). |
| 13 | PUT `/api/users/{id}/notification-settings` | Auth; NS:36 | Same Self check before save. | D001; settings ownership/default semantics Q007. |
| 14 | GET `/api/parties` | Optional; PR:47 | PP:59 default and814 new filters use public/host/invitee/joined predicate. PR:99 legacy text/theme/date calls PP:411–438 without visibility; sort PP:441 also unfiltered. | D007: anonymous public only, authenticated Viewer only on **every** branch. G009 confirms missing predicates on legacy/sort paths. Q003 governs invitation-state details. |
| 15 | POST `/api/parties` | Auth; PR:122, PP:89 | Creates host=caller. Resolves selected private invitees without mutual eligibility check. | AUTH-09/D007 new party hosted by caller; D005 private mutual invitees. G017. |
| 16 | GET `/api/parties/{id}` | Optional; PR:133, PP:452 | Public for anyone; private host/invitation recipient/joined caller. No invitation-status filter. Inaccessible/missing yields404. | D007 Viewer; Q003 revoked/declined edges. No additional self-user privilege unless qualifying Viewer. |
| 17 | DELETE `/api/parties/{id}` | Auth; PR:148, PP:120 | Stored Host only; 403 unrelated actor, 404 missing. | D007 Host only; authenticated non-host denied. |
| 18 | PUT `/api/parties/{id}` | Auth; PR:158, PP:147 | Checks party/caller existence, then sets host to caller; no existing-host comparison. | D007 Host only; unrelated authenticated user cannot take ownership. G003 remains confirmed source mismatch. |
| 19 | PUT `/api/parties/device-token` | Auth; PR:176 | SQL updates caller's device token; no target-user path. | D001 actor; self device registration policy/details Q007. Duplicated route and clients tracked G006/Step 8–11. |
| 20 | POST `/api/parties/{id}/join` | Auth; PR:194, PP:566 | Any resolved caller with existing party can join; no private eligibility check. Existing invitation, if any, becomes accepted. | AUTH-09 own membership; D007 private access and D006 invitation transition must hold. G009; precise admission/rejoin policy Q003/Q004. |
| 21 | DELETE `/api/parties/{id}/join` | Auth; PR:203, PP:606 | Only caller membership removed; absent member/party404; no visibility check. Returns party entity on successful removal. | AUTH-09/D006 own attendance; returned private data after decline/revocation needs Q003 and D007 review. |
| 22 | GET `/api/parties/{id}/join/status` | Auth; PR:213, PP:643 | Any resolved existing caller/party; returns caller attendance plus total count without visibility check. | D001 own status; D007 private boundary and Q010 count disclosure; G009. |
| 23 | GET `/api/parties/{id}/invited-members` | Auth; PR:222, PP:481 | Authenticated Viewer via `getPartyByIdIfVisible`; all matching invitees/statuses, not host-only. | D007 visibility floor; anonymous versus authenticated/host-only roster policy Q010. |
| 24 | GET `/api/parties/{id}/joined-members` | Auth; PR:231, PP:523 | Authenticated Viewer; member query after visibility check. | D007 visibility floor; roster policy Q010. |
| 25 | GET `/api/parties/{id}/invitation-stats` | Auth; PR:240, PP:671 | Authenticated Viewer; denied/missing404; no host-only rule. | D007 visibility floor; stats policy Q010. |
| 26 | POST `/api/parties/{partyId}/media/upload` | Auth; PR:253, MP:112 | Caller becomes uploader; only party existence/file validation, no Viewer predicate. | D009 Viewer uploads at any time; deny non-viewers. Anonymous public-viewer question Q005; G009/G014 record missing authenticated viewer checks. |
| 27 | GET `/api/parties/{id}/can-edit` | Auth; PR:271 | Any authenticated caller receives result; true iff stored Host. No private visibility check before returning party/user IDs and flag. | D007 Host-only edit authority; exposure of this metadata to non-viewers Q010. The flag does not secure PUT (G003). |
| 28 | GET `/api/parties/{id}/locations` | Open; PR:302, LP:34 | Party existence then locations for its joined users; no caller/visibility/consent check. | Q002/Q006 Step10 retained location/privacy policy; private context must reconcile D007. G009 source absence of checks. |
| 29 | GET `/api/parties/{id}/media` | Open; PR:313, MP:103 | Party existence then all media DTOs; no Viewer check. | D007/D009 only party viewers; public anonymous viewing versus private qualifying caller. G009. |
| 30 | GET `/api/qr/generate` | Auth; QR:42 | Uses resolved current user; emits numeric-user deep link, not stored token creation. | D001 identity remains; retained generation and host/self semantics Q001. G007/G008; no QR credential exception approved. |
| 31 | GET `/api/qr/status/{token}` | Open; QR:62, QS:`findByToken` | Token existence only; returns used/expiry metadata even for used/expired row. No user/host check. | Q001: public possession versus authenticated ownership and retained-flow scope. |
| 32 | GET `/api/qr/image/user/{userId}` | Open; QR:74, UP:`findById` | Any existing user ID produces QR image; no caller equality. | Q001; numeric user payload is not accepted authentication, G007. |
| 33 | GET `/api/qr/image/{token}` | Open; QR:94, QS:`findByToken` | Stored token existence, not validity/ownership; encodes user ID. | Q001; expiry/reuse/public-image policy unapproved, G007. |
| 34 | POST `/api/qr/exchange` | Open HTTP; QR:115, QS:`findValidByToken`/`issueMobileToken` | Body token must exist, be unused and unexpired; issues separate mobile token and marks used. No Keycloak caller/self/host check. | Q001 determines retained credential exchange; cannot substitute for accepted Keycloak protected API identity. G007/G008. |
| 35 | POST `/api/qr/mobile/me` | Open HTTP; QR:130 | Checks body mobile token signature/expiry using embedded HMAC material; no Keycloak resolver. Numeric subject cast differs from issuer's string subject. | Q001; separate verification path is not a normal `/api/users/me` equivalent, G008/G007. No secrets reproduced. |
| 36 | POST `/api/users` | Open; UR:62, UP:`createUser` | Persists unlinked local profile from DTO, no Keycloak registration/caller check. | Q011: retain/restrict/retire local creation and claim-link interaction. D001/D003: local row creation must not itself log in. |
| 37 | GET `/api/users` | Open; UR:70, UP:`getUsers`/search | Lists/searches users, no caller-based field filtering. | D008 supports discovery; anonymous/authenticated visibility and fields Q009. |
| 38 | GET `/api/users/{id}` | Open; UR:91, UP:`getUser` | User existence; returns user entity, no self check. | D008 profiles; public versus signed-in/self field visibility Q009. |
| 39 | GET `/api/users/handle/{distinctName}` | Open; UR:101, UP:`findByDistinctName` | Handle lookup, no caller filtering. | D008 identifier discovery; Q009 access/fields. |
| 40 | GET `/api/users/username/{username}` | Open; UR:111, UP:`findByUsername` | Username lookup, no caller filtering. | D008 identifier discovery; Q009 access/fields. |
| 41 | GET `/api/users/me` | Auth; UR:121, resolver | Returns linked/created caller; no target-user parameter. | AUTH-01/08 token-linked Self; numeric fallback/ambiguous linkage G019/G020. |
| 42 | GET `/api/users/{id}/followers/count` | Open; UR:128, FP:23 | User existence then accepted incoming count; no requesting-user check. | D004/D008 social context; anonymous versus authenticated Q009. |
| 43 | GET `/api/users/{id}/following/count` | Open; UR:140, FP:31 | User existence then accepted outgoing count. | D004/D008; Q009 audience. |
| 44 | PUT `/api/users/{id}` | Auth; UR:152 | Self path match or403 before profile write. | D001 actor; self-only editing scope and fields to formalize under Q009/Step3. No host authority over others. |
| 45 | GET `/api/users/{id}/profile-picture` | Open; UR:184 | User existence; serves file or default; no caller check. | Q009 profile audience, Step7 media serving policy; no implied host privilege. |
| 46 | GET `/api/users/{id}/profile-picture-filename` | Open; UR:248 | User existence then filename/null; no caller check. | Q009 profile metadata audience, Step7. |
| 47 | POST `/api/users/{id}/upload-profile-picture` | Auth; UR:265 | Self path match or403 before replacement. | D001 actor; Q009 same-user profile change, Step7 upload contract. |
| 48 | GET `/api/users/{id}/followers` | Open; UR:315, FP:39 | Accepted incoming users, no caller check. | D004/D008; Q009 audience/fields. |
| 49 | GET `/api/users/{id}/following` | Open; UR:323, FP:48 | Accepted outgoing users, no caller check. | D004/D008; Q009 audience/fields. |
| 50 | GET `/api/users/{id}/follow-requests` | Open; UR:331, FP:57 | Pending incoming users for any path ID; no self check. | Q009 must decide private Self inbox versus other audience; D004 alone does not authorize public pending-request disclosure. |
| 51 | GET `/api/users/{userId1}/followers/{userId2}/status` | Open; UR:339, FP:65 | Accepted directional relationship bool for supplied pair; no caller check. | D004 relation semantics; Q009 audience. |
| 52 | POST `/api/users/{id}/follow` | Auth; UR:348, FP:75 | Path `id` ignored; creates caller→`targetUserId`. Duplicate/conflict checks, no path equality. | D001 actor/D004 request model. Q009 path mismatch rejection versus ignored alias; G024 contract discrepancy. |
| 53 | PUT `/api/users/{id}/followers/{followerId}` | Auth; UR:360, FP:106 | Path `id` ignored; accepts `followerId`→caller pending relation. Others' inbox not selected by path. | D004 recipient accepts own incoming request; D001 actor. Q009 path contract/G024. |
| 54 | DELETE `/api/users/{id}/followers/{followerId}` | Auth; UR:369, FP:161 | Removes caller→path `id`; `followerId` ignored. No other caller identity derived from path. | D001 actor preserved; direction/removal contract Q009/G024, to reconcile in Step3. |
| 55 | GET `/api/users/location/{id}` | Open; UR:378 | Entity primary-key lookup using supplied ID; no caller/user-match/consent check. | Q002/Q006 retained scope and anonymous/authenticated/self audience; G009. Entity ID vs user ID also needs Step10 review. |
| 56 | PUT `/api/users/location` | Auth; UR:389 | Caller user resolved; location entity looked up by caller numeric ID and upserted. No check that found entity's user equals caller. | D001 actor; Q002/Q006 retained same-user location contract. G009 records ownership inference risk due to ID mapping. |
| 57 | GET `/api/users/{id}/media` | Open; UR:423, MP:94 | All media by target user, no party visibility predicate. | D007/D009 party access must survive user-media projection; Q009 profile audience. G009. |
| 58 | PUT `/api/users/device-token` | Auth; UR:437 | SQL updates caller's device token, no target-user path. | D001 actor; device/preferences policy Q007. G006 duplicate-route/client mismatch handled Steps8/11. |

## Review outcomes and verification scenarios

The intended column is complete as an **access review**: every row states a supported rule or named unresolved decision, including host/self distinctions through the predicates above. It is not a claim that all 58 routes already have accepted normative policy. Q001–Q013 are in [decisions.md](decisions.md); policy ownership remains with later stages except Q012/Q013 auth follow-up. No Step 3 profile/state-machine task was executed.

Normal-JWT acceptance review should cover anonymous/missing/expired/wrong-issuer tokens on each Auth route, valid caller plus forged numeric/path identities, and correct versus unrelated object owner/recipient/host. Domain follow-up should compare default, legacy-filter, new-filter and sort party reads; private detail versus media/user-media/location/member-count access; non-viewer join/upload; invitation recipient/sender/host differences; and profile pending-request audience. These are concrete future verification cases, not test results.

Existing [resolver tests](../../src/test/java/at/htl/auth/CurrentUserResolverTest.java) use synthetic principals; [resource suites](inventory.md#backend-test-inventory) mostly use bypass or test security. The foundation's deletion/non-owner and notification wrong-user assertion evidence remains limited to those operations. No test suite, HTTP client, browser, simulator or deployment was run for this matrix.
