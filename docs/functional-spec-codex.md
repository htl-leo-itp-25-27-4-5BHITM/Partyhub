# PartyHub Functional Specification for Codex

## Purpose

This document describes:

1. The verified current brownfield behavior implemented in the repository.
2. The intended target behavior derived from [intent.md](/Users/carla/Documents/Partyhub/docs/intent.md).
3. The gap between current and target behavior.
4. Open questions that remain unresolved and must not be assumed by Codex.

This specification is intended as a safe working document for Codex when analyzing, planning, or implementing changes in this repository.

## Scope

Application scope covered by this specification:

- User registration and login
- Home map and party discovery
- Party details
- Social graph and profiles
- Notifications and invitations
- Party creation, editing, deletion, and invitation management
- Party gallery

Technology context:

- Backend: Quarkus / Java
- Frontend: browser-based JavaScript/TypeScript-adjacent static web app under `src/main/resources/META-INF/resources/`
- Current authentication approach in browser: stored user ID
- Planned future authentication direction: Keycloak

## Source Basis

This specification is based on:

- Intent narrative: [intent.md](/Users/carla/Documents/Partyhub/docs/intent.md)
- Quarkus backend resources and repositories under `/Users/carla/Documents/Partyhub/src/main/java`
- Frontend pages and scripts under `/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources`

## Functional Areas

### 1. Registration and Login

#### Current Brownfield Behavior

- The frontend currently uses a browser-based login model, not a real Keycloak browser flow.
- The active auth service stores a user ID and user info in `localStorage`.
- Frontend API calls typically identify the acting user via `X-User-Id` header and sometimes `user` query parameter.
- Auto-login can occur when a `userId` query parameter is present in the URL.
- Backend endpoints are effectively designed to work with explicit user IDs rather than session-based identity.
- There is QR login support in the backend, but that is a separate capability and not the primary browser login model.

Relevant implementation:

- [auth-service.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/auth-service.js:1)
- [UserResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/user/UserResource.java:31)
- [QrResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/qr/QrResource.java:26)

#### Gap / Target Behavior

- `docs/intent.md` assumes a normal user registration and login experience.
- Planned future direction is Keycloak-based authentication and identity handling.
- The functional target is:
  - users register and log in through a proper authentication flow,
  - authenticated identity is not represented only by a browser-stored numeric user ID,
  - user context should come from the authentication system rather than being manually provided by the client.

#### Codex Guidance

- Treat browser-stored user ID login as the current source of truth for implemented behavior.
- Treat Keycloak as planned future behavior, not current behavior.

### 2. Home Map and Party Discovery

#### Current Brownfield Behavior

- The home page displays visible parties on a map.
- Party visibility is enforced by backend rules:
  - anonymous or unknown users see public parties,
  - authenticated users additionally see parties they host,
  - authenticated users additionally see parties they are invited to,
  - authenticated users additionally see parties they already joined.
- The main map loads party data from the backend and renders markers for upcoming visible parties.
- The current implementation filters displayed map parties to those in the next 14 days.
- A party dropdown and attendee location display also exist.
- Live/current user location and attendee location logic exist as extended behavior.
- Fake geolocation logic is present in the current frontend and must be considered non-production-oriented behavior unless explicitly retained.

Relevant implementation:

- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:59)
- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:441)
- [index.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/index.js:344)
- [index.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/index.js:395)
- [PartyResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyResource.java:261)

#### Gap / Target Behavior

- The target home map should show visible parties as the primary feature.
- Nearby filtering is not the core current requirement and should be treated as optional or extended behavior.
- Live attendee locations and current-user live location are extended or optional behavior, not the core party discovery requirement.
- The target UX from `intent.md` emphasizes:
  - immediate landing on a party map after login,
  - clear overview of discoverable parties,
  - direct access from the map to party details.

#### Codex Guidance

- Treat visible-party discovery as the baseline requirement.
- Treat nearby filtering and live attendee/user locations as secondary/extended features.

### 3. Party Detail View

#### Current Brownfield Behavior

- The party detail page loads a party by ID.
- Private party access is restricted to:
  - the host,
  - invited users,
  - already joined users.
- The detail page shows party metadata and a members section.
- For public parties, joined members are displayed.
- For private parties, invited members are displayed with invitation status.
- The detail page allows a logged-in user to join or leave a party.
- A photo button navigates to the party gallery.

Relevant implementation:

- [advancedPartyInfos.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/advancedPartyInfos/advancedPartyInfos.js:94)
- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:441)
- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:470)
- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:512)

#### Gap / Target Behavior

- This area is broadly aligned with `intent.md`.
- The target detail experience should continue to emphasize:
  - location,
  - date,
  - description,
  - theme,
  - invitation or attendance context where applicable.

### 4. Invitations and Attendance

#### Current Brownfield Behavior

- Private party invitations are created when a host creates or updates a private party with selected users.
- Invitations have status values including `PENDING`, `ACCEPTED`, and `DECLINED`.
- Invitation recipients see invitation-related notifications in the notification center.
- Accepting an invitation is functionally tied to joining/attending the party.
- When a user attends a party and has an invitation, the invitation status is set to `ACCEPTED`.
- When a user leaves a party and has an invitation, the invitation status is set to `DECLINED`.
- Declining an invitation can also occur by deleting the invitation as the recipient, which sets status to `DECLINED`.

Relevant implementation:

- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:555)
- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:595)
- [InvitationRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/invitation/InvitationRepository.java:109)
- [InvitationResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/invitation/InvitationResource.java:11)

#### Gap / Target Behavior

- `docs/intent.md` describes invitation handling in the notification center with direct accept/decline decisions.
- Current implementation already supports this concept functionally, but acceptance is modeled through attendance.
- Target behavior should explicitly preserve this rule:
  - accepting an invitation happens by joining/attending the party,
  - that action sets invitation state to `ACCEPTED`.

#### Codex Guidance

- Do not introduce a separate acceptance meaning unless explicitly requested.
- Invitation acceptance and party attendance are the same business action.

### 5. Notifications

#### Current Brownfield Behavior

- The system supports in-app notifications.
- Notification center logic currently covers:
  - private party invitations,
  - follow requests,
  - follow-request acceptance notifications,
  - party update and cancellation messaging.
- Users can mark notifications as read and delete notifications.
- Notification UI merges backend notifications with frontend flow-specific rendering.

Relevant implementation:

- [NotificationResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/notification/NotificationResource.java:20)
- [notifications.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/notifications/notifications.js:1)
- [FollowRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/follow/FollowRepository.java:107)
- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:341)

#### Gap / Target Behavior

- This is largely aligned with the intent narrative.
- Target behavior should keep notifications as the main place where invitation and follow-request decisions are surfaced.

### 6. Social Graph: Search, Follow Requests, and Profiles

#### Current Brownfield Behavior

- Users can search for other users.
- Profiles can be opened by user ID or distinct handle.
- The relationship model is not direct follow; it is follow request -> acceptance -> following.
- Users can:
  - send follow requests,
  - view pending follow requests,
  - accept follow requests,
  - remove/unfollow relationships.
- Profiles show follower/following counts and support follow actions.
- A user can inspect another user’s created parties from their profile context.

Relevant implementation:

- [UserResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/user/UserResource.java:295)
- [FollowRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/follow/FollowRepository.java:16)
- [profile.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/profile/profile.js:1)

#### Gap / Target Behavior

- Although `intent.md` narratively says “I follow my friend,” the intended functional model is the implemented follow-request/accept flow.
- Target behavior should therefore explicitly define friendship-adjacent social access using accepted mutual follow relationships, not direct one-click following.

#### Codex Guidance

- Treat the follow-request/accept model as the intended business rule.

### 7. Party Creation

#### Current Brownfield Behavior

- Users can create parties using a multi-step UI.
- Party creation captures major party attributes including:
  - title,
  - description,
  - start and end time,
  - address,
  - latitude and longitude,
  - visibility,
  - optional metadata such as fee, theme, age limits, website, and capacity.
- Public and private visibility are supported.
- Private parties require selected invitees.
- In the frontend, invitees for private parties are limited to mutual contacts:
  - users who appear in both the current user’s followers list and following list.
- Address lookup and map preview are present in the party creation flow.

Relevant implementation:

- [addParty.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/addParty/addParty.js:1)
- [addParty.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/addParty/addParty.js:309)
- [addParty.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/addParty/addParty.js:442)
- [PartyResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyResource.java:80)
- [PartyCreateDto.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyCreateDto.java:1)

#### Gap / Target Behavior

- This is aligned with the clarified target behavior.
- Target behavior should explicitly state:
  - private party invitations may only be sent to mutual contacts,
  - mutual contacts means users who follow each other,
  - invited contacts must be selectable and toggleable in the UI.

### 8. Party Editing and Deletion

#### Current Brownfield Behavior

- A party host can edit a party.
- The UI supports loading a party into edit mode.
- Editing can update party content and invitation selection.
- When a private party is updated, newly invited or re-invited users may receive notifications.
- When a party changes, recipients may receive update notifications.
- A party host can delete a party.
- Deletion triggers cancellation notifications for relevant recipients.

Relevant implementation:

- [addParty.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/addParty/addParty.js:507)
- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:136)
- [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:120)
- [PartyResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyResource.java:229)

#### Gap / Target Behavior

- This is aligned with `intent.md`.
- Target behavior should retain:
  - edit anytime,
  - delete if the event should not happen,
  - invite management during editing.

### 9. Gallery and Party Media

#### Current Brownfield Behavior

- The backend supports party media upload and party media retrieval.
- The gallery page currently supports:
  - loading party media,
  - rendering the gallery,
  - modal viewing of images.
- The gallery UI currently behaves as a read-only gallery.
- I did not verify a current frontend UI control for party photo upload in the gallery page.

Relevant implementation:

- [PartyResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyResource.java:210)
- [gallery.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/gallery/gallery.js:25)
- [MediaRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/media/MediaRepository.java:111)

#### Gap / Target Behavior

- `docs/intent.md` describes users uploading photos to a party gallery after the party.
- Therefore target behavior should include UI-based photo upload for party galleries.
- This upload capability must be clearly marked as planned behavior unless a corresponding frontend upload workflow is implemented.

#### Codex Guidance

- Current verified behavior: gallery browsing/viewing.
- Planned target behavior: gallery upload from the UI after a party.

## Cross-Cutting Business Rules

### Visibility Rules

- Public parties are visible to all users.
- Private parties are visible only to:
  - the host,
  - invited users,
  - users who already joined the party.

### Invitation Rules

- Private party invitations are only applicable for private parties.
- Invitation acceptance happens through joining the party.
- Leaving a previously accepted invited party changes invitation state to `DECLINED` in current behavior.

### Contact Rules

- Private-party invite selection is limited to mutual contacts.
- Mutual contacts are users who follow each other.

### User Context Rules

- Current acting user context is client-supplied.
- Planned future acting user context should come from Keycloak-authenticated identity.

## Brownfield vs Target Summary

| Area | Current Brownfield | Target Behavior |
|---|---|---|
| Login | Browser-stored user ID | Keycloak-based authentication |
| Home map | Visible parties, next-14-days filter, optional location features | Visible parties as primary discovery feature |
| Follow model | Follow request and acceptance | Same as current |
| Invitation acceptance | Joining/attending sets invitation to `ACCEPTED` | Same as current |
| Private invites | Mutual contacts only in UI | Same as current |
| Gallery | View media only in verified UI | View plus UI upload |
| Notifications | Implemented for invites, follows, updates | Continue as primary action surface |

## Remaining Open Questions

These points are still not fully resolved by code or by `docs/intent.md` and should not be assumed silently:

1. Should gallery upload be allowed only after the party end time, or simply be intended for post-party usage without backend enforcement?
2. Should the current next-14-days filtering on the home map remain a product rule, or should it be treated as an implementation detail?
3. Should live attendee/user location features stay in scope as optional extensions, or be excluded from the core product UX in future cleanup?
4. When Keycloak is introduced, should legacy `X-User-Id` and query-param user context remain temporarily for compatibility or be removed immediately?

## Recommended Codex Usage

When Codex works from this document, it should:

- treat “Current Brownfield Behavior” as authoritative for what exists now,
- treat “Gap / Target Behavior” as the desired direction,
- avoid assuming that planned behavior is already implemented,
- flag any implementation that changes invitation acceptance semantics,
- preserve the follow-request model,
- preserve mutual-contact restrictions for private invitations unless explicitly changed.
