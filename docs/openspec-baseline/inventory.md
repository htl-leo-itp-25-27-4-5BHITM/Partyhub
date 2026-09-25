# Foundation capability and surface inventory

Snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, 2026-09-21. This is a source inventory, not an endpoint authorization contract or runtime verification. The foundation assigns ownership; detailed domain contracts belong to Steps 2-11.

Foundation enumeration check: all 60 tracked main Java files, 28 Java test/support files, 18 browser HTML pages, 20 JavaScript modules, 49 actual Swift sources and 9 HTTPYac files appear below with owner steps. There are 58 HTTP method annotations across 7 REST resource classes and 58 endpoint rows, plus 12 JPA entities. Framework-managed Swagger/OpenAPI surfaces and static support assets belong to CAP-OPS/Step 11 and are separate from those 58 custom endpoints. Metadata, binaries and historical project documents are classified by bounded families rather than treated as application source. Their contents are not promoted to accepted requirements.

Step 2 addendum, 2026-09-23, unchanged source revision: [authentication.md](authentication.md) traces browser/native flows, [access-matrix.md](access-matrix.md) audits all 58 endpoint identities and repository predicates, and [auth-environments.md](auth-environments.md) separates JWT and bypass declarations. Those documents supersede foundation notes that defer the access audit; endpoint IDs/ownership below are unchanged. Native LoginView has one sign-in entry (provider may offer registration); standalone browser register HTML/JS are empty, with active registration redirects in start/login pages. These refinements do not remove either surface from inventory.

Step 3 source review began 2026-09-23 and integration completed 2026-09-25, with application source still unchanged: [profiles-and-social.md](profiles-and-social.md) maps profile fields/audiences, browser/iOS support, access rows 36-54/57 and the directed follow lifecycle. The bounded `document-profiles-and-social-relationships` child is integrated into the main social spec; implementation mismatches remain G024/G026-G028.

Step 4 source review and integration completed 2026-09-25 with application source still unchanged: [party-lifecycle.md](party-lifecycle.md) maps CRUD actors, lifecycle fields/validation, client routes/payloads and test evidence. The bounded `document-party-lifecycle` child is integrated into the main party spec; G003/G006/G009 and G029-G030 retain implementation discrepancies.

Step 5 source review and integration completed 2026-09-25 with application source still unchanged: [invitations-and-attendance.md](invitations-and-attendance.md) maps invitation selection/management, attendance transitions, projection audiences, events and tests. The bounded `document-invitations-and-attendance` child is integrated into the main party spec; G009/G017/G031-G033 retain source and client discrepancies.

## Capability register and platform scope

| Inventory ID | Existing capability or review area | Platforms / environments | Owner steps | Baseline disposition |
|---|---|---|---|---|
| CAP-AUTH | `user-auth-and-identity`; browser/native identity and public bootstrap | Backend, browser, iOS, Keycloak | 2 | AUTH-01-AUTH-12 accepted; bypass and native source mismatches remain G002/G019-G023. |
| CAP-SOCIAL | `social-and-notifications`; profile editing/discovery | Backend, browser, iOS | 3 | SOC-01-SOC-06 accepted; bounded field/audience and directed follow lifecycle integrated, with G024/G026-G028 retained. |
| CAP-PARTY | `party-discovery-and-management`; host lifecycle | Backend, browser, iOS | 4 | PARTY-03-PARTY-05/PARTY-12-PARTY-13 accepted and integrated; G003/G006/G009/G029-G030 retained. |
| CAP-ATTENDANCE | Invitation and attendance rules within party/social capabilities | Backend, browser, iOS | 5 | PARTY-06/PARTY-07/PARTY-14/PARTY-15 accepted and integrated; G009/G017/G031-G033 retain implementation/client gaps. |
| CAP-DISCOVERY | `party-discovery-and-management`; queries and map filters | Backend, browser, iOS | 6 | Shared visibility; later filter requirements have iOS provenance. |
| CAP-RADIUS | `map-radius-control` | iOS | 6 | Existing requirements; Purpose placeholder tracked separately for Step 12. |
| CAP-MEDIA | `party-media-gallery`; profile-picture and storage lifecycle | Backend, browser, iOS, filesystem | 7 | Existing gallery intent; platform support and profile-picture contract partial. |
| CAP-NOTIFY | `social-and-notifications`; notification settings/delivery | Backend, browser, iOS, email/push adapters | 8 | Existing notification center intent; channel/preferences contracts incomplete. |
| CAP-QR | QR/mobile login | Backend and potential deep-link consumers | 9 | Observed surface; no dedicated main spec and retained target unresolved (Q001). |
| CAP-EXT | User/attendee locations, visits/time tracking, calendar | Backend, browser, iOS / device permissions | 10 | Observed extensions; excluded from core discovery only, not globally removed (D010, Q002). |
| CAP-OPS | `local-keycloak-environment`; API, storage, validation and runtime contracts | Local Compose, Kubernetes declarations, test/CI, Keycloak theme | 11 | Existing local requirements; broader runtime contracts partial. |
| CAP-DOCS | Cross-domain documentation and acceptance | Repository docs/specs | 12 | Editorial drift and final acceptance; no application capability introduced. |

CAP IDs are inventory labels, not new OpenSpec capability names. Every endpoint/screen/service below uses one of these owners. Listing a capability for review does not approve every observed behavior or require another client to implement it.

## Glossary

| Term | Meaning / authority |
|---|---|
| Party | A hosted social event with visibility, metadata, location, attendees and invitations. |
| Host | The PartyHub user that owns a party; accepted management authority comes from D007. |
| Acting user | PartyHub user resolved from validated identity; numeric headers alone are not the accepted protected-action contract (D001). |
| Keycloak subject | External identity linked through the PartyHub user's Keycloak ID (D003). |
| Follow request | A directed request that becomes an accepted one-way follow (D004). |
| Mutual contact | Two users with accepted follows in both directions (D004-D005). |
| Invitee | A party invitation recipient; D017/PARTY-14 make pending invitations current visibility grants, while declined/withdrawn invitations do not qualify without another role. |
| Attendee / joined user | A user linked to party membership; joining/attendance accepts an invitation when applicable (D006). |
| Visible party | Public party, or a private party available under host/invitee/joined-user rules (D007); profile lists have D008 wording. |
| Gallery viewer | User with party access; upload target is D009, with anonymous/public-viewer identity unresolved in Q005. |
| Notification | Persisted in-app event record; delivery channels and preference guarantees need Step 8 review. |
| Location | Party venue/address coordinates; distinct from a user's current/live location. |
| Radius / distance filter | Client discovery constraint with explicit iOS control requirements; it is not automatic authorization to expose live attendee positions. |
| Observed | Found in source/configuration at the snapshot revision, without asserting runtime success or product acceptance. |
| Accepted | Present in a current main spec or a still-applicable approved decision; see the separate implementation-evidence status in coverage. |
| Legacy / demo | Source appears old, standalone, commented or sample-oriented; this is not a decision to delete or exclude it. |

## Backend endpoints, entities, services and tests

### Summary counts

- Backend REST resource classes discovered: 7
- Source-observed backend endpoints discovered: 58
- JPA entity classes discovered: 12
- Backend test/helper classes discovered: 28 Java test-side classes, 252 static `@Test` annotations plus support classes. These are not executed-test or passing-test counts.

Resource classes:

| Resource class | Base path | Endpoint count | Owner step |
|---|---:|---:|---|
| `at.htl.config.PublicConfigResource` | `/api/config/public` | 1 | 2 auth/config, 11 runtime |
| `at.htl.invitation.InvitationResource` | `/api/invitations` | 6 | 5 invitations/attendance |
| `at.htl.notification.NotificationResource` | `/api/notifications` | 4 | 8 notifications |
| `at.htl.notificationsettings.UserNotificationSettingsResource` | `/api/users/{id}/notification-settings` | 2 | 8 notifications/preferences |
| `at.htl.party.PartyResource` | `/api/parties` | 16 | 4 parties, 5 attendance, 6 discovery, 7 media, 10 location, 11 runtime |
| `at.htl.qr.QrResource` | `/api/qr` | 6 | 9 QR |
| `at.htl.user.UserResource` | `/api/users` | 23 | 2 auth, 3 profiles/social, 7 media/profile photos, 8 device token, 10 location |

Observed frontend references to `/api/media/{id}` exist in `src/main/resources/META-INF/resources/gallery/gallery.js` and `script.js`, but no Java REST resource class with `@Path("/api/media")` was found at this revision. `MediaRepository` contains helper methods for serving media, but it is not annotated as a REST resource.

### Endpoint inventory

Owner step key: 2 auth/identity, 3 profiles/social, 4 party lifecycle, 5 invitations/attendance, 6 discovery/maps, 7 media/profile photos, 8 notifications/preferences, 9 QR, 10 extended location, 11 runtime/API/validation.

| # | Method | Full path | Source class/method | Line | Annotation auth | Observed role | Owner |
|---:|---|---|---|---:|---|---|---|
| 1 | GET | `/api/config/public` | `PublicConfigResource.getConfig` | `src/main/java/at/htl/config/PublicConfigResource.java:20` | none | Returns public Keycloak issuer config. | 2, 11 |
| 2 | POST | `/api/invitations` | `InvitationResource.createInvitation` | `src/main/java/at/htl/invitation/InvitationResource.java:21` | `@Authenticated` | Creates invitation via `InvitationDto`. | 5 |
| 3 | GET | `/api/invitations` | `InvitationResource.getInvitations` | `src/main/java/at/htl/invitation/InvitationResource.java:31` | `@Authenticated` | Lists received by default or sent with `direction=sent`. | 5 |
| 4 | DELETE | `/api/invitations/{id}` | `InvitationResource.deleteInvitation` | `src/main/java/at/htl/invitation/InvitationResource.java:48` | `@Authenticated` | Deletes or declines invitation through repository behavior. | 5 |
| 5 | GET | `/api/invitations/{id}/details` | `InvitationResource.getInvitationDetails` | `src/main/java/at/htl/invitation/InvitationResource.java:58` | `@Authenticated` | Returns invitation detail DTO for authorized participant. | 5 |
| 6 | POST | `/api/invitations/{id}/accept` | `InvitationResource.acceptInvitation` | `src/main/java/at/htl/invitation/InvitationResource.java:67` | `@Authenticated` | Accepts invitation and updates attendance downstream. | 5 |
| 7 | POST | `/api/invitations/{id}/decline` | `InvitationResource.declineInvitation` | `src/main/java/at/htl/invitation/InvitationResource.java:77` | `@Authenticated` | Declines invitation and updates attendance downstream. | 5 |
| 8 | GET | `/api/notifications` | `NotificationResource.getNotifications` | `src/main/java/at/htl/notification/NotificationResource.java:28` | `@Authenticated` | Lists notifications with optional `partyId`, `type`, `search`. | 8 |
| 9 | GET | `/api/notifications/unread` | `NotificationResource.getUnreadNotifications` | `src/main/java/at/htl/notification/NotificationResource.java:46` | `@Authenticated` | Lists unread notifications for current user. | 8 |
| 10 | POST | `/api/notifications/{id}/read` | `NotificationResource.markAsRead` | `src/main/java/at/htl/notification/NotificationResource.java:60` | `@Authenticated` | Marks current user's notification read. | 8 |
| 11 | DELETE | `/api/notifications/{id}` | `NotificationResource.deleteNotification` | `src/main/java/at/htl/notification/NotificationResource.java:70` | `@Authenticated` | Deletes current user's notification subject to repository rules. | 8 |
| 12 | GET | `/api/users/{id}/notification-settings` | `UserNotificationSettingsResource.getSettings` | `src/main/java/at/htl/notificationsettings/UserNotificationSettingsResource.java:22` | `@Authenticated` | Reads same-user notification settings. | 8 |
| 13 | PUT | `/api/users/{id}/notification-settings` | `UserNotificationSettingsResource.updateSettings` | `src/main/java/at/htl/notificationsettings/UserNotificationSettingsResource.java:36` | `@Authenticated` | Updates same-user notification settings. | 8 |
| 14 | GET | `/api/parties` | `PartyResource.getParties` | `src/main/java/at/htl/party/PartyResource.java:47` | none | Lists parties; supports query/search/filter/sort params. | 4, 6 |
| 15 | POST | `/api/parties` | `PartyResource.createParty` | `src/main/java/at/htl/party/PartyResource.java:122` | `@Authenticated` | Creates party from `PartyCreateDto`. | 4 |
| 16 | GET | `/api/parties/{id}` | `PartyResource.getParty` | `src/main/java/at/htl/party/PartyResource.java:133` | none | Reads party if visible to optional current user. | 4 |
| 17 | DELETE | `/api/parties/{id}` | `PartyResource.removeParty` | `src/main/java/at/htl/party/PartyResource.java:148` | `@Authenticated` | Removes party through repository. | 4 |
| 18 | PUT | `/api/parties/{id}` | `PartyResource.updatePartyPut` | `src/main/java/at/htl/party/PartyResource.java:158` | `@Authenticated` | Updates party from `PartyCreateDto`. | 4 |
| 19 | PUT | `/api/parties/device-token` | `PartyResource.updateToken` | `src/main/java/at/htl/party/PartyResource.java:176` | `@Authenticated` | Updates current user's device token via users table. | 8, 11 |
| 20 | POST | `/api/parties/{id}/join` | `PartyResource.joinParty` | `src/main/java/at/htl/party/PartyResource.java:194` | `@Authenticated` | Joins/attends party. | 5 |
| 21 | DELETE | `/api/parties/{id}/join` | `PartyResource.leaveParty` | `src/main/java/at/htl/party/PartyResource.java:203` | `@Authenticated` | Leaves party. | 5 |
| 22 | GET | `/api/parties/{id}/join/status` | `PartyResource.joinStatus` | `src/main/java/at/htl/party/PartyResource.java:213` | `@Authenticated` | Returns attendance status/count. | 5 |
| 23 | GET | `/api/parties/{id}/invited-members` | `PartyResource.invitedMembers` | `src/main/java/at/htl/party/PartyResource.java:222` | `@Authenticated` | Lists invited members/status display. | 5 |
| 24 | GET | `/api/parties/{id}/joined-members` | `PartyResource.joinedMembers` | `src/main/java/at/htl/party/PartyResource.java:231` | `@Authenticated` | Lists joined/attending members. | 5 |
| 25 | GET | `/api/parties/{id}/invitation-stats` | `PartyResource.invitationStats` | `src/main/java/at/htl/party/PartyResource.java:240` | `@Authenticated` | Returns invitation statistics. | 5 |
| 26 | POST | `/api/parties/{partyId}/media/upload` | `PartyResource.upload` | `src/main/java/at/htl/party/PartyResource.java:253` | `@Authenticated` | Uploads party media via `MediaRepository.FileUploadInput`. | 7 |
| 27 | GET | `/api/parties/{id}/can-edit` | `PartyResource.canEditParty` | `src/main/java/at/htl/party/PartyResource.java:271` | `@Authenticated` | Reports whether current user is party owner by current source check. | 4 |
| 28 | GET | `/api/parties/{id}/locations` | `PartyResource.getPartyLocations` | `src/main/java/at/htl/party/PartyResource.java:302` | none | Returns user locations for a party id. | 10 |
| 29 | GET | `/api/parties/{id}/media` | `PartyResource.getPartyMedia` | `src/main/java/at/htl/party/PartyResource.java:313` | none | Returns party media DTO list. | 7 |
| 30 | GET | `/api/qr/generate` | `QrResource.generate` | `src/main/java/at/htl/qr/QrResource.java:42` | `@Authenticated` | Returns QR payload/image URL for current user. | 9 |
| 31 | GET | `/api/qr/status/{token}` | `QrResource.status` | `src/main/java/at/htl/qr/QrResource.java:62` | none | Returns QR token used/expiry status. | 9 |
| 32 | GET | `/api/qr/image/user/{userId}` | `QrResource.imageByUserId` | `src/main/java/at/htl/qr/QrResource.java:74` | none | Returns PNG QR image for user id payload. | 9 |
| 33 | GET | `/api/qr/image/{token}` | `QrResource.image` | `src/main/java/at/htl/qr/QrResource.java:94` | none | Returns PNG QR image for stored token-derived payload. | 9 |
| 34 | POST | `/api/qr/exchange` | `QrResource.exchange` | `src/main/java/at/htl/qr/QrResource.java:115` | none | Exchanges QR token for mobile token. | 9 |
| 35 | POST | `/api/qr/mobile/me` | `QrResource.mobileMe` | `src/main/java/at/htl/qr/QrResource.java:130` | none | Verifies mobile token and returns user id. | 9 |
| 36 | POST | `/api/users` | `UserResource.createUser` | `src/main/java/at/htl/user/UserResource.java:62` | none | Creates local user from `UserCreateDto`. | 3 |
| 37 | GET | `/api/users` | `UserResource.getUsers` | `src/main/java/at/htl/user/UserResource.java:70` | none | Lists users or searches by `q`. | 3 |
| 38 | GET | `/api/users/{id}` | `UserResource.getUser` | `src/main/java/at/htl/user/UserResource.java:91` | none | Reads user by id. | 3 |
| 39 | GET | `/api/users/handle/{distinctName}` | `UserResource.getUserByDistinctName` | `src/main/java/at/htl/user/UserResource.java:101` | none | Reads user by distinct handle/name. | 3 |
| 40 | GET | `/api/users/username/{username}` | `UserResource.getUserByUsername` | `src/main/java/at/htl/user/UserResource.java:111` | none | Reads user by username. | 3 |
| 41 | GET | `/api/users/me` | `UserResource.getCurrentUser` | `src/main/java/at/htl/user/UserResource.java:121` | `@Authenticated` | Resolves current user through auth resolver. | 2 |
| 42 | GET | `/api/users/{id}/followers/count` | `UserResource.getFollowerCount` | `src/main/java/at/htl/user/UserResource.java:128` | none | Returns follower count. | 3 |
| 43 | GET | `/api/users/{id}/following/count` | `UserResource.getFollowingCount` | `src/main/java/at/htl/user/UserResource.java:140` | none | Returns following count. | 3 |
| 44 | PUT | `/api/users/{id}` | `UserResource.updateUser` | `src/main/java/at/htl/user/UserResource.java:152` | `@Authenticated` | Updates same current user's profile fields. | 3 |
| 45 | GET | `/api/users/{id}/profile-picture` | `UserResource.getProfilePicture` | `src/main/java/at/htl/user/UserResource.java:184` | none | Serves profile picture or default SVG. | 7 |
| 46 | GET | `/api/users/{id}/profile-picture-filename` | `UserResource.getProfilePictureFilename` | `src/main/java/at/htl/user/UserResource.java:248` | none | Returns profile picture filename. | 7 |
| 47 | POST | `/api/users/{id}/upload-profile-picture` | `UserResource.uploadProfilePicture` | `src/main/java/at/htl/user/UserResource.java:265` | `@Authenticated` | Replaces same current user's profile picture. | 7 |
| 48 | GET | `/api/users/{id}/followers` | `UserResource.getFollowers` | `src/main/java/at/htl/user/UserResource.java:315` | none | Lists followers. | 3 |
| 49 | GET | `/api/users/{id}/following` | `UserResource.getFollowing` | `src/main/java/at/htl/user/UserResource.java:323` | none | Lists followed users. | 3 |
| 50 | GET | `/api/users/{id}/follow-requests` | `UserResource.getFollowRequests` | `src/main/java/at/htl/user/UserResource.java:331` | none | Lists pending follower requests for target user id. | 3 |
| 51 | GET | `/api/users/{userId1}/followers/{userId2}/status` | `UserResource.getFollowStatus` | `src/main/java/at/htl/user/UserResource.java:339` | none | Returns following boolean. | 3 |
| 52 | POST | `/api/users/{id}/follow` | `UserResource.followUser` | `src/main/java/at/htl/user/UserResource.java:348` | `@Authenticated` | Creates follow request from current user to `targetUserId`. | 3 |
| 53 | PUT | `/api/users/{id}/followers/{followerId}` | `UserResource.acceptFollow` | `src/main/java/at/htl/user/UserResource.java:360` | `@Authenticated` | Accepts follow request for current user. | 3 |
| 54 | DELETE | `/api/users/{id}/followers/{followerId}` | `UserResource.unfollowUser` | `src/main/java/at/htl/user/UserResource.java:369` | `@Authenticated` | Removes follow relation through repository. | 3 |
| 55 | GET | `/api/users/location/{id}` | `UserResource.getUserLocation` | `src/main/java/at/htl/user/UserResource.java:378` | none | Reads a user location by id lookup in `UserLocation`. | 10 |
| 56 | PUT | `/api/users/location` | `UserResource.updateUserLocation` | `src/main/java/at/htl/user/UserResource.java:389` | `@Authenticated` | Upserts current user's location. | 10 |
| 57 | GET | `/api/users/{id}/media` | `UserResource.getUserMedia` | `src/main/java/at/htl/user/UserResource.java:423` | none | Lists media by user id. | 7 |
| 58 | PUT | `/api/users/device-token` | `UserResource.updateDeviceToken` | `src/main/java/at/htl/user/UserResource.java:437` | `@Authenticated` | Updates current user's device token via users table. | 8, 11 |

### JPA entity and relationship inventory

| Entity | Table | Source | Relationships observed | Owner |
|---|---|---|---|---|
| `User` | `users` | `src/main/java/at/htl/user/User.java:10` | One-to-one `ProfilePicture` mapped by `user`; many-to-many parties mapped by `Party.users`; stores `device_token`, username, keycloak id, display/distinct names, email, phone, biography. | 2, 3, 8 |
| `Party` | `party` | `src/main/java/at/htl/party/Party.java:17` | Many-to-one host `User`; one-to-many `Media`; many-to-many attendee `User` through `party_user`; one-to-many `Invitation`; many-to-one `Location`; `visibility`. | 4, 5, 6, 7, 10 |
| `Invitation` | `invitation` | `src/main/java/at/htl/invitation/Invitation.java:9` | Many-to-one sender `User`, recipient `User`, and `Party`; status defaults to `PENDING`; exposes JSON id helpers. | 5, 8 |
| `Notification` | `notification` | `src/main/java/at/htl/notification/Notification.java:10` | Many-to-one recipient `User`, sender `User`, optional `Party`; status defaults `UNREAD`; creation timestamp and message. | 8 |
| `Media` | `media` | `src/main/java/at/htl/media/Media.java:7` | Many-to-one `Party`; many-to-one `User`; file path/url. | 7 |
| `ProfilePicture` | `profile_picture` | `src/main/java/at/htl/profile_picture/ProfilePicture.java:6` | One-to-one `User` via unique `user_id`; stores `picture_name`. | 7 |
| `UserLocation` | `user_location` | `src/main/java/at/htl/user_location/UserLocation.java:7` | One-to-one `User`; stores latitude/longitude; entity id is JSON-ignored. | 10 |
| `Location` | `location` | `src/main/java/at/htl/location/Location.java:6` | Referenced by `Party.location`; stores latitude/longitude/address; id JSON-ignored. | 4, 6, 10 |
| `Follow` | `follow` | `src/main/java/at/htl/follow/Follow.java:6` | Composite ids `user1_id`, `user2_id`; many-to-one `FollowStatus`; no entity relationship fields to `User`. | 3 |
| `FollowStatus` | `follow_status` | `src/main/java/at/htl/follow/FollowStatus.java:5` | Status id/name; referenced by `Follow`. | 3 |
| `UserNotificationSettings` | `user_notification_settings` | `src/main/java/at/htl/notificationsettings/UserNotificationSettings.java:6` | One-to-one `User` with `@MapsId`; channel and event booleans. | 8 |
| `QrLogin` | `qr_login` | `src/main/java/at/htl/qr/QrLogin.java:11` | Stores token, userId scalar, expiry, used flag, mobile token and mobile-token expiry. No JPA `User` relationship. | 9 |

### Backend source inventory outside REST resources

| File | Kind | Source-observed role | Owner |
|---|---|---|---|
| `src/main/java/at/htl/auth/CurrentUserResolver.java:17` | auth service | Resolves current user from JWT/security identity, numeric bypass subject, Keycloak id, or creates/links local user and settings. | 2 |
| `src/main/java/at/htl/auth/WelcomeEmailService.java:14` | email service | Sends Qute welcome email when a resolved Keycloak user is created. | 2, 8 |
| `src/main/java/at/htl/auth/XUserIdAuthFilter.java:21` | auth mechanism | Quarkus HTTP auth mechanism for `X-User-Id` when bypass config is enabled. | 2, 11 |
| `src/main/java/at/htl/DataSeeder.java:17` | startup seeder | Observes startup and seeds base data/statuses if needed. | 11 |
| `src/main/java/at/htl/FilterDto.java:3` | DTO | Legacy filter record. | 6, 11 |
| `src/main/java/at/htl/PushNotificationService.java:13` | push service | Reads attendee device tokens and sends Apple APNs HTTP/2 request asynchronously. | 8, 11 |
| `src/main/java/at/htl/follow/FollowRepository.java:15` | repository/service | Follower/following counts, lists, pending requests, request creation, acceptance, removal, notifications. | 3, 8 |
| `src/main/java/at/htl/follow/Follow.java:6` | entity | Follow relationship state. | 3 |
| `src/main/java/at/htl/follow/FollowStatus.java:5` | entity | Follow status lookup. | 3 |
| `src/main/java/at/htl/invitation/InvitationRepository.java:19` | repository/service | Invite creation/listing/deletion/details/accept/decline and invitation notification side effects. | 5, 8 |
| `src/main/java/at/htl/invitation/Invitation.java:9` | entity | Invitation state. | 5 |
| `src/main/java/at/htl/invitation/InvitationDto.java:5` | DTO | Invitation create payload. | 5 |
| `src/main/java/at/htl/invitation/InvitationListDto.java:3` | DTO | Invitation list projection. | 5 |
| `src/main/java/at/htl/invitation/InvitationDetailsDto.java:9` | DTO | Invitation detail projection. | 5 |
| `src/main/java/at/htl/location/LocationRepository.java:11` | repository/service | Location persistence and find-by-lat/long. | 4, 6, 10 |
| `src/main/java/at/htl/location/Location.java:6` | entity | Party location metadata. | 4, 6, 10 |
| `src/main/java/at/htl/media/MediaRepository.java:25` | repository/service | Media listing/serving helpers and party media upload validation/storage. Not a REST resource. | 7 |
| `src/main/java/at/htl/media/Media.java:7` | entity | Party/user media record. | 7 |
| `src/main/java/at/htl/media/MediaDto.java:3` | DTO | Media list projection. | 7 |
| `src/main/java/at/htl/notification/NotificationRepository.java:15` | repository/service | Notification query/filter/read/delete/create/cleanup and out-of-app dispatch. | 8 |
| `src/main/java/at/htl/notification/OutOfAppNotificationService.java:15` | notification service | Sends notification email when global/recipient settings permit. | 8, 11 |
| `src/main/java/at/htl/notification/PartyEmailDigestService.java:20` | scheduled service | Weekly digest scheduled by cron, selects upcoming public parties and users. | 8, 11 |
| `src/main/java/at/htl/notification/NotificationSchemaCompatibility.java:13` | startup compatibility service | Runs startup DDL/native SQL for notification/invitation schema compatibility. | 8, 11 |
| `src/main/java/at/htl/notification/Notification.java:10` | entity | Notification state. | 8 |
| `src/main/java/at/htl/notification/NotificationDto.java:5` | DTO | Notification projection. | 8 |
| `src/main/java/at/htl/notification/NotificationType.java:3` | enum | Notification type enum. | 8 |
| `src/main/java/at/htl/notificationsettings/UserNotificationSettingsRepository.java:12` | repository/service | Find/persist/save user notification settings. | 8 |
| `src/main/java/at/htl/notificationsettings/UserNotificationSettings.java:6` | entity | Notification settings state. | 8 |
| `src/main/java/at/htl/notificationsettings/NotificationSettingsDto.java:3` | DTO | Notification settings projection/update payload. | 8 |
| `src/main/java/at/htl/party/PartyRepository.java:33` | repository/service | Party CRUD, filtering, visibility, invite/member/stat transitions, notification side effects. | 4, 5, 6, 8 |
| `src/main/java/at/htl/party/Party.java:17` | entity | Party aggregate. | 4, 5, 6, 7, 10 |
| `src/main/java/at/htl/party/PartyCreateDto.java:11` | DTO/validation target | Party create/update payload with validation annotations. | 4, 11 |
| `src/main/java/at/htl/party/FilterParams.java:6` | DTO/helper | Party filter inputs and helper methods. | 6 |
| `src/main/java/at/htl/party/InvitationStatsDto.java:3` | DTO | Invitation stats projection. | 5 |
| `src/main/java/at/htl/party/InvitedMemberDto.java:3` | DTO | Member projection for invited/joined views. | 5 |
| `src/main/java/at/htl/profile_picture/ProfilePicture.java:6` | entity | Profile picture record. | 7 |
| `src/main/java/at/htl/qr/QrService.java:16` | service | QR token generation, lookup, mobile token issuing. | 9 |
| `src/main/java/at/htl/qr/QrLoginRepository.java:10` | repository/service | QR token/mobile token lookup and persist. | 9 |
| `src/main/java/at/htl/qr/QrLogin.java:11` | entity | QR login token state. | 9 |
| `src/main/java/at/htl/user/UserRepository.java:14` | repository/service | User lookup/search, Keycloak linking, persistence, local create/update helpers. | 2, 3 |
| `src/main/java/at/htl/user/User.java:10` | entity | User/profile/auth identity state. | 2, 3, 8 |
| `src/main/java/at/htl/user/UserCreateDto.java:3` | DTO | User create/update payload. | 3 |
| `src/main/java/at/htl/user_location/UserLocationRepository.java:10` | repository/service | User location list/find/save and locations-by-party query. | 10 |
| `src/main/java/at/htl/user_location/UserLocation.java:7` | entity | Current user location state. | 10 |
| `src/main/java/at/htl/user_location/UserLocationUpdateDto.java:6` | DTO | User location update payload. | 10 |
| `src/main/java/at/htl/validation/NoHtml.java:11` | validation annotation | Custom no-HTML constraint. | 11 |
| `src/main/java/at/htl/validation/NoHtmlValidator.java:7` | validator | Validates no HTML tags. | 11 |
| `src/main/java/at/htl/validation/SafeText.java:11` | validation annotation | Custom safe-text constraint. | 11 |
| `src/main/java/at/htl/validation/SafeTextValidator.java:7` | validator | Validates text against SQL/script/control patterns. | 11 |
| `src/main/java/at/htl/validation/ValidPartyName.java:11` | validation annotation | Custom party-name constraint. | 4, 11 |
| `src/main/java/at/htl/validation/ValidPartyNameValidator.java:7` | validator | Validates party name length/characters. | 4, 11 |
| `src/main/java/at/htl/validation/OnCreate.java:3` | validation group marker | Create validation group marker. | 11 |
| `src/main/java/at/htl/validation/OnUpdate.java:3` | validation group marker | Update validation group marker. | 11 |

### Backend test inventory

Tests were inventoried only; no test command was run. Counts below are static `@Test` annotation counts.

| Test/support class | Tests | Source-observed focus | Owner |
|---|---:|---|---|
| `src/test/java/at/htl/FilterDtoTest.java` | 3 | Filter DTO behavior. | 6, 11 |
| `src/test/java/at/htl/MockPushService.java` | 0 | Test helper/mock push service. | 8 |
| `src/test/java/at/htl/PushNotificationServiceTest.java` | 3 | Push notification behavior. | 8 |
| `src/test/java/at/htl/TestBase.java` | 0 | Quarkus test base/support. | 11 |
| `src/test/java/at/htl/auth/CurrentUserResolverTest.java` | 3 | Current user resolver/linking behavior. | 2 |
| `src/test/java/at/htl/follow/FollowStatusTest.java` | 2 | Follow status entity. | 3 |
| `src/test/java/at/htl/follow/FollowTest.java` | 9 | Follow entity/relationship behavior. | 3 |
| `src/test/java/at/htl/notification/PartyEmailDigestServiceTest.java` | 2 | Weekly digest email service. | 8, 11 |
| `src/test/java/at/htl/notificationsettings/UserNotificationSettingsResourceTest.java` | 4 | Notification settings resource. | 8 |
| `src/test/java/at/htl/qr/QrServiceTest.java` | 8 | QR service token generation/exchange helpers. | 9 |
| `src/test/java/at/htl/repository/FollowRepositoryTest.java` | 12 | Follow repository transitions/queries. | 3, 8 |
| `src/test/java/at/htl/repository/InvitationRepositoryTest.java` | 6 | Invitation repository transitions/notifications. | 5, 8 |
| `src/test/java/at/htl/repository/LocationRepositoryTest.java` | 7 | Location repository. | 4, 6, 10 |
| `src/test/java/at/htl/repository/MediaRepositoryTest.java` | 7 | Media repository and upload/list behavior. | 7 |
| `src/test/java/at/htl/repository/NotificationRepositoryTest.java` | 18 | Notification repository filters/read/delete/protection. | 8 |
| `src/test/java/at/htl/repository/PartyRepositoryTest.java` | 9 | Party repository lifecycle/filter/member behavior. | 4, 5, 6, 8 |
| `src/test/java/at/htl/repository/QrLoginRepositoryTest.java` | 8 | QR login repository. | 9 |
| `src/test/java/at/htl/repository/UserLocationRepositoryTest.java` | 8 | User location repository and party-location query. | 10 |
| `src/test/java/at/htl/repository/UserRepositoryTest.java` | 22 | User lookup/link/create/update repository behavior. | 2, 3 |
| `src/test/java/at/htl/resource/InvitationResourceTest.java` | 12 | Invitation resource endpoints. | 5 |
| `src/test/java/at/htl/resource/NotificationResourceTest.java` | 11 | Notification resource endpoints. | 8 |
| `src/test/java/at/htl/resource/PartyResourceTest.java` | 30 | Party resource endpoints including filters/join/media/location. | 4, 5, 6, 7, 10 |
| `src/test/java/at/htl/resource/QrResourceTest.java` | 10 | QR resource endpoints. | 9 |
| `src/test/java/at/htl/resource/UserResourceTest.java` | 21 | User/profile/follow/location/media resource endpoints. | 2, 3, 7, 10 |
| `src/test/java/at/htl/validation/NoHtmlValidatorTest.java` | 8 | No-HTML validator. | 11 |
| `src/test/java/at/htl/validation/SafeTextValidatorTest.java` | 11 | Safe-text validator. | 11 |
| `src/test/java/at/htl/validation/ValidPartyNameValidatorTest.java` | 12 | Party-name validator. | 4, 11 |
| `src/test/java/at/htl/validation/ValidationDemoTest.java` | 6 | Integrated validation examples. | 4, 11 |

### Notes for the full Step 1 inventory

- Browser and iOS surfaces are enumerated in the next section. Numeric owners map to the capability register above.
- Endpoint auth above is only direct annotation observation. Step 2 must perform the endpoint access matrix using resolver/repository checks; this report does not claim intended access behavior.
- Repository methods returning `Response` are implementation helpers, not REST endpoints unless a resource annotation exposes them.
- Media image serving has source helper methods in `MediaRepository`, but no source-observed REST resource exposes `/api/media/{id}` at this revision.
- The duplicated device-token behavior appears as both `/api/parties/device-token` and `/api/users/device-token`; both update `users.device_token` in source and should be reconciled in Step 8/11.

## Browser, iOS, infrastructure and README claims

### Counts and ownership key

- Browser: **18 HTML pages, 20 JavaScript modules, 14 CSS files** under `src/main/resources/META-INF/resources/`. No vendored JS files are present in this enumerated tree.
- iOS: **49 actual Swift text source files**, plus **8 tracked AppleDouble `._*.swift` metadata files**. The 49 includes empty `Untitled.swift` and the fully commented-out `PartyView/PartyDetailDebugSection.swift`.
- HTTPYac: **9 `.http` files**, **97 textual HTTP request blocks** (20 are setup requests). This is an enumeration, not a claim of 97 passing tests or unique scenarios.
- CI: **3 workflow files**. Runtime shell scripts: **3** (`deploy-local.sh`, `sync-import.sh`, `run-http-tests.sh`). README's `deploy.sh` is absent.
- Existing capability labels: **Auth** = `user-auth-and-identity`; **Social** = `social-and-notifications`; **Party** = `party-discovery-and-management`; **Radius** = `map-radius-control`; **Media** = `party-media-gallery`; **Runtime** = `local-keycloak-environment` plus supporting runtime/API/quality contracts. **QR**, **Extensions**, **Profile** and **Baseline** are inventory owner labels pending domain decisions, not invented accepted OpenSpec capabilities.
- Owner step means the primary numbered runbook work package; secondary steps are dependencies/cross-checks. Every row is assigned.

### Browser page and JS inventory

All paths in this table are relative to `src/main/resources/META-INF/resources/` and have browser scope.

| Exact files | Observed surface | Capability / primary step | Cross-checks |
|---|---|---|---|
| `index.html`, `index.js` | Main party map, discovery/filter selection and detail navigation; browser geolocation | Party / **6** | Extensions 10; API/runtime 11 |
| `listPartys/listPartys.html`, `listPartys/listPartys.js` | Party list and search/filter/detail entry | Party / **6** | 4, 11 |
| `addParty/addParty.html`, `addParty/addParty.js` | Party create/edit form and invite selection | Party / **4** | 3, 5 |
| `advancedPartyInfos/advancedPartyInfos.html`, `advancedPartyInfos/advancedPartyInfos.js` | Party details, join/leave, host/member/invitation displays and gallery link | Party / **4** | 5, 7 |
| `profile/profile.html`, `profile/profile.js` | Profile, hosted/participating party views, follow controls and QR generation | Profile + Social / **3** | 4, 6, 7, QR 9 |
| `editProfile/editProfile.html`, `editProfile/editProfile.js` | Profile editing and profile-picture upload | Profile / **3** | Media 7 |
| `followerList/followerList.html`, `followerList/followerList.js` | Followers/following display and relationship controls | Social / **3** | Auth 2 |
| `gallery/gallery.html`, `gallery/gallery.js` | Party gallery load, read-only image grid and modal viewing; no upload UI found in the inspected page | Media / **7** | Party access 4/5 |
| `notifications/notifications.html`, `notifications/notifications.js` | In-app notification list and follow/invitation actions | Social / **8** | 3, 5 |
| `register_login/start.html`, `register_login/start.js` | Login/register entry | Auth / **2** | 11 |
| `register_login/login/login.html`, `register_login/login/login.js` | Browser login entry/Keycloak flow | Auth / **2** | 11 |
| `register_login/register/register.html`, `register_login/register/register.js` | Registration entry/Keycloak flow | Auth / **2** | 11 |
| `register_login/logout.html` | Logout page with inline code | Auth / **2** | 11 |
| `register_login/email-verified.html` | Email verification landing page with inline code | Auth / **2** | 11 |
| `auth/callback.html` | Browser OAuth callback | Auth / **2** | 11 |
| `register_login/qr-login.html` | QR generation and token-status polling via inline JS | QR / **9** | Auth 2 |
| `homepage/homepage.html`, `homepage/homepage.js` | Separate Leaflet map with fixed Linz start marker and click-to-add markers; observed demo/prototype surface | Party / **6** | Scope disposition 12 |
| `test.html` | Static "Test page - Output in console" with helpers; observed debug/demo surface | Runtime/API quality / **11** | Scope disposition 12 |
| `auth-service.js` | PKCE/Keycloak authentication, token/session state, authenticated request handling | Auth / **2** | 11 |
| `route-guard.js` | Auth/logout guards and shared authenticated-call wrapper | Auth / **2** | 11 |
| `user-utils.js` | Current user/session-storage compatibility helper | Auth / **2** | Profile 3 |
| `backend-functions.js` | Shared party CRUD/discovery, attendance, invitations, users/follows and media helpers | Runtime/API compatibility / **11** | Per-method domain owners 3–7; Auth 2 |
| `api.js` | Shared attendance/join/leave/status helpers | Party / **5** | Auth 2; API 11 |
| `nav.js` | Shared bottom-navigation active-state behavior | Runtime/UI quality / **11** | Cross-journey review 12 |
| `script.js` | Demo user/party/media tables, geolocation, form and attendance helpers; old-host and `/api/media/1` calls observed | Runtime/API compatibility / **11** | Domain review 3/5/6/7/10; scope disposition 12 |

Additional browser support files, each assigned to Runtime/UI quality **11** with domain cross-checks: `manifest.json`; `global.css`; `index.css`; `addParty/addParty.css`; `advancedPartyInfos/advancedPartyInfos.css`; `editProfile/editProfile.css`; `followerList/followerList.css`; `gallery/gallery.css`; `homepage/homepage.css`; `listPartys/listPartys.css`; `notifications/notifications.css`; `profile/profile.css`; `register_login/start.css`; `register_login/login/login.css`; `register_login/register/register.css`; `fonts/LuckiestGuy-Regular.ttf`; `fonts/Lunasima-Regular.ttf`; `icons/icon-192.png`; `icons/icon-512.png`; `icons/apple-touch-icon.png`; `images/default_profile-picture.svg`; `images/default_profile-picture.jpg`. The default images also support Media **7**. External Leaflet/OpenStreetMap/Google Fonts imports are runtime dependency evidence, not verified service availability. `manifest.json` describes standalone display and `/index.html` start; do not infer offline/PWA guarantees from it.

### iOS Swift inventory

All paths below are relative to `PartyHubiOS/PartyHubiOS/` and have iOS scope. Each of the 49 actual Swift source files occurs once in this table.

| Exact files | Observed surface | Capability / primary step | Cross-checks |
|---|---|---|---|
| `PartyHubiOSApp.swift` | App bootstrap, SwiftData container, authenticated root switching, deep links, party sync, notification/device-token startup | Auth / **2** | 6, 8, 9, 10, 11 |
| `ContentView.swift` | Five tabs: Home, Party, Map, Time Tracking, Profile; notification-driven detail sheet | Runtime/UI navigation / **11** | Journey review 12 |
| `LoginView.swift` | Native login/registration entry | Auth / **2** | 11 |
| `KeycloakAuthService.swift`, `KeycloakConfig.swift`, `KeycloakToken.swift`, `Keychain.swift` | Browser-based native OAuth, public config, token representation, storage/refresh/logout and `/api/users/me` linking | Auth / **2** | Runtime 11 |
| `APIClient.swift`, `APIError.swift` | Shared authenticated requests, error decoding, auth-type enum and user response model | Runtime/API compatibility / **11** | Auth 2; per-call domain owners |
| `ApiService.swift` | Deprecated party-update helper and profile-picture caching/loading | Runtime/API compatibility / **11** | Party 4; Media 7 |
| `Config.swift` | Backend URL choice | Runtime / **11** | Auth 2 |
| `HomeView.swift` | Nearby and upcoming party cards from local party model | Party / **6** | Location availability 10 |
| `ProfileView.swift`, `User.swift` | Profile, following/follower counts, photo upload and legacy QR scanner/deep-link code | Profile + Social / **3** | Media 7; QR 9 |
| `UserProfileImageView.swift` | Shared profile image loading/display | Media / **7** | Profile 3 |
| `PartyView/PartyView.swift` | Party list, create/edit entry, party deletion and refresh | Party / **4** | Discovery 6 |
| `PartyView/PartyFormView.swift`, `PartyView/MapLocationPickerView.swift` | Create/edit fields and location picker | Party / **4** | Invites 5; API 11 |
| `PartyView/Party.swift`, `PartyDateFormatter.swift` | Local party/response/location/host model and shared date formatting | Party / **4** | Discovery 6; calendar/location 10 |
| `PartyView/PartyDetailView.swift`, `PartyView/PartyDetailsSection.swift` | Detail and date-time display, ownership/edit actions, attendance, photos, location, calendar/share and visit integration | Party / **4** | 5, 7, 10 |
| `PartyView/AttendanceSection.swift`, `PartyView/InviteUsersView.swift` | Attendance display and invited-user selection/request helper | Party / **5** | Social 3 |
| `Map/InvitationsView.swift`, `Map/InvitationsViewModel.swift` | Received invitations and accept/decline via join/leave calls | Party / **5** | Social 8 |
| `Map/MapView.swift`, `Map/PartyMapFilter.swift`, `Map/MapClustering.swift`, `Map/ClusterPin.swift` | Party discovery map, combination/time/fee/distance filter state, clustering/badges; ClusterPin retains a deprecated old component | Party + Radius / **6** | Extensions 10; deprecated component disposition 12 |
| `PartyView/AttendeeFilter.swift`, `Map/PartyAttendeeMapView.swift`, `Map/UserLocationListView.swift`, `Map/UserLocationViewModel.swift`, `Map/LocationSection.swift` | Attendee filter/maps/lists, user location fetch/update and location presentation | Extensions / **10** | Party visibility 4/5; Auth 2 |
| `GeoTimeTracking/LocationManager.swift`, `GeoTimeTracking/LocationDisplayHelper.swift`, `GeoTimeTracking/TimeEntry.swift`, `GeoTimeTracking/TimeTrackingView.swift`, `PartyView/PastVisitsSection.swift` | CoreLocation/geofences, background current location, SwiftData visit/time records, time tracking and past visits | Extensions / **10** | Runtime/privacy decisions 11 |
| `CalendarService.swift` | EventKit permission and event create/update/delete mappings in UserDefaults; party deep link | Extensions / **10** | Party lifecycle 4; runtime/privacy 11 |
| `Photo/PartyBilderView.swift`, `Photo/PhotoView.swift`, `PartyView/PhotosSection.swift` | PhotosPicker, local document-directory gallery/share/remove UI; PhotoView uses fixed `Birthday_2026` demo navigation | Media / **7** | Scope disposition 12; backend-gallery parity not established |
| `Partynotificationsystem.swift` | AppDelegate/APNs registration, local notification manager and party update polling | Social / **8** | Party API 4; device-token API 11 |
| `PartyView/PartyDetailDebugSection.swift` | Entire file is inside a block comment; prior debug simulation controls observed, not active runtime code | Runtime/debug quality / **11** | Scope disposition 12 |
| `Extensions.swift`, `View.swift` | Notification-name/color and view utility extensions | Runtime/UI support / **11** | Cross-journey 12 |
| `Untitled.swift` | Empty file (0 bytes); no implemented behavior | Runtime/source hygiene / **11** | Scope disposition 12 |

iOS non-source support ownership:

- Runtime **11**: `Info.plist`; `PartyHubiOS.xcodeproj/project.pbxproj`; `PartyHubiOS.xcodeproj/project.xcworkspace/contents.xcworkspacedata`; `PartyHubiOS.xcodeproj/xcshareddata/xcschemes/PartyHubiOS.xcscheme`; `PartyHubiOS.xcodeproj/xcshareddata/xcschemes/xcschememanagement.plist`; all `xcuserdata` scheme/UI state and `Assets.xcassets/**` files. The runtime/privacy review must inspect declared camera/location/calendar/photo/background permissions and build settings. These files do not establish permissions actually granted on devices.
- Extensions **10**: `GeoTimeTracking/school.gpx`, `GeoTimeTracking/ffhart.gpx` are location simulation fixtures.
- Runtime **11**, observed non-source metadata: `._APIEndpoint.swift`, `._ContentView.swift`, `._HomeView.swift`, `._PartyHubiOSApp.swift`, `._UserProfileImageView.swift`, `PartyView/._Party.swift`, `PartyView/._PartyDetailView.swift`, `PartyView/._PartyView.swift` and `._Info.plist`. `file` identifies inspected `._*.swift` files as AppleDouble Macintosh metadata. There is no actual `APIEndpoint.swift` text source in this enumeration.
- Runtime **11**: `error` is a checked-in diagnostic artifact; future review should treat it as historical evidence, not current execution results.

### HTTPYac and test harness inventory

| File | Textual request blocks | Observed scope | Capability / primary step | Cross-checks |
|---|---:|---|---|---|
| `api/00-setup.http` | 20 | Creates users, one current location and parties for smoke tests | Runtime/test setup / **11** | 2, 3, 4, 10 |
| `api/user.http` | 15 | User search/profile/me, follower lists/count/status, current location, picture and media reads | Profile + Social / **3** | Auth 2; Media 7; Extensions 10 |
| `api/follow.http` | 8 | Follower counts/lists/status, pending requests and request creation | Social / **3** | Auth 2 |
| `api/party.http` | 23 | Party public/private visibility, search/filter/sort, age/fee/distance inputs | Party / **6** | Lifecycle/access 4; Radius 6 |
| `api/invitation.http` | 6 | Sent/received invitations, user requirement and delete authorization/not-found | Party / **5** | Auth 2; Social 8 |
| `api/media.http` | 3 | Party and user media retrieval, including private-party example | Media / **7** | Party access 4 |
| `api/profilePicture.http` | 6 | Picture/filename retrieval and unknown user | Media / **7** | Profile 3 |
| `api/notification.http` | 7 | List/unread, read/delete and same-user failure cases | Social / **8** | Auth 2 |
| `api/qr.http` | 9 | Generate, images, token status and exchange error cases | QR / **9** | Auth 2 |

Runtime/test quality **11** also owns `api/package.json`, `api/package-lock.json`, `api/.httpyacrc.json`, `api/README_TESTS.md`, `api/testing.jpg`, `run-http-tests.sh`, `.github/workflows/test.yml`, `src/test/resources/application.properties`, `pom.xml` test/plugin declarations, and `e2e/.gitignore`. `api/README_TESTS.md` reports historical numeric results, which are not this task's verification. HTTP tests use bypass identifiers in several files, e.g. `api/user.http:34–44` uses `X-User-Id`. Source inspection shows `src/test/resources/application.properties:14–16` disables JWT and enables bypass; this does not exercise the normal production JWT contract. JUnit class inventory is delegated separately.

### Infrastructure, CI, configuration, scripts and documentation inventory

| Exact files or bounded family | Observed scope | Capability / owner step |
|---|---|---|
| `pom.xml`, `mvnw`, `mvnw.cmd`, `.mvn/jvm.config`, `.mvn/wrapper/maven-wrapper.properties`, `wrapper/maven-wrapper.properties` | Quarkus/Maven/Java build and wrappers; Java 21 and Quarkus 3.28.2 declarations; test and coverage plugins | Runtime / **11** |
| `src/main/resources/application.properties`, `src/test/resources/application.properties` | Ports, profiles, JWT/bypass, DB/DDL/seed behavior, SMTP/digests and uploads | Runtime / **11**; Auth **2**, Social **8**, Media **7** cross-checks |
| `docker-compose.yaml`, `Dockerfile.keycloak`, `docker/postgres/init/01-create-keycloak-db.sql` | Local PostgreSQL + Keycloak, theme/realm imports and DB initialization | Runtime / **11** |
| `Dockerfile`, `k8s/postgres.yaml`, `k8s/keycloak.yaml`, `k8s/quarkus.yaml`, `k8s/ingress.yaml` | Application/Keycloak build, declared deployed services/storage/ingress and auth override | Runtime / **11**; Auth **2** |
| `.github/workflows/test.yml`, `.github/workflows/push.yaml`, `.github/workflows/deploy.yml` | JUnit/HTTPYac CI, image pushes and Kubernetes deployment/reset steps | Runtime / **11** |
| `deploy-local.sh` | Local Compose volume reset, package build, process stop/port check and dev startup | Runtime / **11** |
| `sync-import.sh` | Local/Kubernetes seed SQL synchronization with `--local-only`, `--k8s-only`, namespace options | Runtime / **11** |
| `run-http-tests.sh` | Starts dependencies/dev server, waits and runs API npm tests | Runtime / **11** |
| `src/main/resources/import.sql`, `create-tables.sql`, `test-data.sql` | Seed/schema fixtures; intended vs runtime schema consistency requires domain evidence | Runtime/data lifecycle / **11** |
| `keycloak/realm-dev.json`, `keycloak/realm-staging.json`, `keycloak/realm-export.json.archived` | Local/staging realm configuration and archived export; inspect client redirects/account policy without treating archived copy as active | Runtime / **11**; Auth **2** |
| `keycloak/themes/partyhub/login/login.ftl`, `register.ftl`, `theme.properties`, `messages/messages_en.properties`, `resources/css/styles.css` | Keycloak login/register theme | Auth / **2**; Runtime **11** |
| `keycloak/themes/partyhub/email/theme.properties`, `email/html/email-verification.ftl`, `email/html/password-reset.ftl`, `email/text/email-verification.ftl`, `email/text/password-reset.ftl` | Keycloak verification/reset email themes (paths after first entry relative to `keycloak/themes/partyhub/`) | Auth / **2**; delivery config **11** |
| `src/main/resources/templates/emails/{welcome,invitation,update,cancellation,digest}.{html,txt}` | Ten application email templates | Social / **8** |
| `src/main/resources/uploads/profiles/*`, `src/main/resources/uploads/party2/*` | Checked-in profile/gallery sample media; storage/runtime serving review | Media / **7**; Runtime **11** |
| `openapi.yaml` | Static API description, including filtering and response contracts | Runtime/API compatibility / **11**; all domain owners cross-check |
| `README.md`, `docs/intent.md`, `docs/functional-spec-codex.md` | Product/setup narratives and existing functional intent | Baseline/document reconciliation / **12**, with each claim mapped below |
| `docs/keycloak-merge-summary.md`, `continuations/add-plain-js-keycloak-auth-continuation.md` | Auth migration/history handoff | Auth / **2**, doc reconciliation **12** |
| `SWIFT_FILTER_IMPLEMENTATION.md`, `continuations/add-party-map-filters-continuation.md` | iOS map-filter historical implementation/handoff narrative | Party/Radius / **6**, doc reconciliation **12** |
| `continuations/fix-ios-party-edit-distance-datetime-continuation.md` | iOS edit/distance/date handoff | Party / **4**, Radius **6**, doc reconciliation **12** |
| `SwiftVertiefungREADME.md` | German time-tracking prototype intent; says existing implementations were incomplete when written | Extensions / **10**, doc reconciliation **12** |
| `AGENTS.md` | Repository instructions/theme and validation documentation; preserve instructions, separately reconcile claims as evidence | Runtime / **11**, doc reconciliation **12** |
| `openspec/config.yaml`, umbrella artifacts, main specs and archive artifacts | Specification workflow and accepted/history evidence; detailed inventory by root/spec reviewer | Baseline / **12** (domain owners from their capabilities) |
| `prompts/prompts.md`, `prompts/answers.md`, `.agents/**`, `.codex/**`, `.claude/**` | Local planning/workflow support; prompt files have unrelated working-tree changes and are not product authority | Baseline / **12**; preserve unrelated edits |
| `project/startADay_Anna.puml`, `project/startADay_Viktoria.puml`, `project/startTheDay_Carla.puml`, `project/startTheDay_Martin.puml`, `project/use-case DiagrammISTZustand.pdf`, `project/use-case DiagrammSOLLZustand.pdf`, `project/Poster/Partyhub_Poster.pdf`, `project/pwa/PWA Sprechtext.docx`, `project/pwa/Progressive Web Apps.pptx`, `project/pwa/~$A Sprechtext.docx`, `project/IMG_3328.jpeg`, `project/Sailboat methode.jpg` | Discovered historical project artifacts/presentation and lock-file; contents not semantically reviewed here, not established accepted requirements | Baseline/document review / **12**; extract relevant claims if needed before final acceptance |
| `LICENSE`, `logo.png`, `image.png`, `.gitignore`, IDE metadata under `.idea/` | Legal/branding/support and local tool configuration; no product requirement inferred | Runtime/support / **11**, README/doc consistency **12** |

### README claim map

Every substantive feature, stack, setup, route and workflow claim in README has a later owner. Line numbers refer to current `README.md`.

| README evidence | Claim/surface | Capability / primary owner | Foundation observation / later action |
|---|---|---|---|
| 3–7, 147–164 | Logo, deploy badge, Codex image, sprint review schedule | Baseline / **12** | Historical/supporting documentation; verify maintained links/content when reconciling docs |
| 11 | Social event platform for parties/meetups/gatherings | Party + Social / **4** | Product framing; narrow requirements through domain evidence |
| 15 | Registration | Auth / **2** | Browser and iOS Keycloak source exists |
| 15 | Profiles and biographies | Profile / **3** | Browser and iOS profiles exist |
| 15 | Profile pictures | Media / **7** | User upload/retrieval and both client helpers exist |
| 16 | Host event creation/details/locations | Party / **4** | Party form/model/resource evidence |
| 16 | Categories | Party / **4** | Source uses `theme`; no standalone category resource found; reconcile wording at **11/12** |
| 17 | Follow users | Social / **3** | Follow code under user endpoints, not `/api/follow` |
| 17 | Invitations and joining | Party / **5** | Invitation resource and party join routes |
| 18 | Upload/share event media | Media / **7** | Browser/backend gallery and iOS local photo surfaces need parity review |
| 19 | Geographic coordinates and addresses | Party / **4** | Location entity/form; discovery owner **6**; do not equate to live attendee location |
| 20 | Min/max age limits | Party / **4** | Metadata/admission enforcement distinction required; filtering owner **6** |
| 24–25 | Quarkus 3.28.2 / Java 21; PostgreSQL/Hibernate | Runtime / **11** | `pom.xml` and profile configurations corroborate declarations; H2 test profile also exists |
| 26 | JWT/SmallRye auth | Auth / **2** | Declared dependencies; bypass config means environment distinctions needed |
| 27, 74 | Swagger UI / API exploration | Runtime / **11** | OpenAPI extension declared; no live URL verification performed |
| 31–42 | Clone/cd and `./deploy.sh` local setup | Runtime / **11** | **Drift:** `deploy.sh` absent; `deploy-local.sh` exists and removes Compose volumes; correct docs in **12** after runtime review |
| 44–68 | `sync-import.sh` local/Kubernetes sync and dependencies/options | Runtime / **11** | Script exists with these modes; do not run for documentation work |
| 70–74 | Local site 8080 and Swagger URL | Runtime / **11** | App HTTP port 8080 declaration; no runtime verification |
| 76–92 | Keycloak port 8000, partyhub realm, import filename, demo-account linking and reset advice | Runtime / **11** | **Drift:** Compose mounts `realm-dev.json`, Docker image also copies staging realm; `realm-export.json` absent (only `.archived` remains). Auth linking/registration semantics owner **2**; startup advice and safety reviewed in **11/12** |
| 94–96 | Production website URL | Runtime / **11** | Matches declared ingress/backend config; no live deployment claim |
| 98–114 | `at/htl/partyhub/{model,repository,resource,dto}` tree and `deploy-local.sh` | Runtime / **11** | **Drift:** actual code organized by domain under `at/htl/` (`party`, `user`, `invitation`, etc.), not the documented nested package |
| 116–128 | `mvn clean test`, JaCoCo report | Runtime/test quality / **11** | Test/coverage plugins and test source present, not executed; report path needs reconciliation against plugin config |
| 130–134 | `mvn clean package` | Runtime/build / **11** | Maven project exists; no build executed |
| 140 | `/api/auth/*` login/register/token API | Auth / **2** | **Drift:** no auth REST resource found; Keycloak and `/api/users/me`/public config are source entry points |
| 141 | `/api/users/*` CRUD | Profile / **3** | User resource exists; exact methods/access audited by endpoint inventory and **2/11** |
| 142 | `/api/parties/*` events | Party / **4** | Party resource exists; discovery **6**, invitations/attendance **5**, media **7**, live locations **10** |
| 143 | `/api/categories/*` | Party / **4** | **Drift:** no category resource found; decide whether stale docs or intended missing capability in **4/11/12** |
| 144 | `/api/media/*` upload/retrieval | Media / **7** | **Drift:** observed party/user-scoped media routes; no standalone media resource |
| 145 | `/api/invitations/*` | Party / **5** | Invitation resource exists |
| 146 | `/api/follow/*` | Social / **3** | **Drift:** observed follow operations under user routes; no standalone follow resource |

### Evidence anchors useful for the initial gaps

- README setup/realm/package/API claims: `README.md:41`, `:78–79`, `:103–107`, `:140–146`; Compose actual realm mount `docker-compose.yaml:28`; image staging import `Dockerfile.keycloak:4`. The missing README `deploy.sh` can be established from `git ls-files '*.sh'` (only three named scripts) and the filesystem enumeration. `deploy-local.sh:5` invokes `docker-compose down -v`; do not describe it simply as a safe/default setup without review.
- Declared production bypass: `k8s/quarkus.yaml:34–39` sets prod plus `PARTYHUB_AUTH_BYPASS_ENABLED=true`; default/dev/staging/test distinctions in `src/main/resources/application.properties:7`, `:20`, `:31` and `src/test/resources/application.properties:14–16`.
- Stale browser party update call: `backend-functions.js:110–120` uses singular `/api/party/${partyId}` with POST. Backend `PartyResource.java:158–173` supplies PUT `/api/parties/{id}`. iOS `Partynotificationsystem.swift:390`, `:419` also uses singular party routes. `PartyView/PartyDetailView.swift:339` uses a singular route inside `simulatePartyUpdate` under `#if DEBUG`; its debug view invocation is commented out, while the regular edit path at `:472–477` correctly uses PUT on the plural route. Exact compatibility and reachability dispositions belong to **4/8/11**.
- iOS device-token calls: `Partynotificationsystem.swift:567` and `PartyHubiOSApp.swift:279` call `/api/users/{userId}/device-token`; observed backend routes are `PartyResource.java:176–191` `/api/parties/device-token` and `UserResource.java:437` `/api/users/device-token`, both without a user-id path segment. Owner **8/11**.
- QR client mismatch: browser `register_login/qr-login.html:115` requests generate without userId then expects token/status; `profile/profile.js:698` instead passes userId; `ProfileView.swift:343` labels scanner as legacy `partyhub://login?userId=`. Preserve for **9**, not accepted auth policy.
- Prototype/debug observations: browser `homepage/homepage.js:1–23` fixed marker click demo; `test.html:33` console test page; `script.js:3` and `:48` old remote host; iOS `Photo/PhotoView.swift:7–8` fixed demo birthday; `PartyDetailDebugSection.swift:1` opens whole-file comment; `Untitled.swift` zero bytes. Main tab includes Time Tracking in `ContentView.swift:35–40`, so extended features are actual surfaced UI, not automatically discarded.
- iOS local gallery observation: `Photo/PartyBilderView.swift:117–152` writes/deletes/lists document-directory files; full backend-gallery parity is unverified. Owner **7**.
- Historical docs: `SWIFT_FILTER_IMPLEMENTATION.md:14–22` documents an older filter enum; current `Map/PartyMapFilter.swift` defines separate time/fee/distance state. `SwiftVertiefungREADME.md:4–8` captures historical incomplete time tracking. Reconcile at **6/10/12**, preserving accepted spec authority.

No source surface in these tables is assigned an exclusion by this inventory. Debug, empty, historical and prototype labels identify observed implementation/document status; later scope decisions must be recorded explicitly.
