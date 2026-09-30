# Notifications and preferences review

Group 8 source review began from proposal checkpoint `b9a44a69c5659f2c5c066c507882bd11b9ff98eb` on 2026-09-29. Application source remains the foundation snapshot from `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. This document separates accepted SOC-03/SOC-08-SOC-11 behavior from observed notification, settings, email, push and client code. No application source, configuration, data or delivery provider was changed or exercised.

Read this with [coverage](coverage.md), [access matrix](access-matrix.md), [decisions](decisions.md), [gaps](gaps.md), the accepted [social spec](../../openspec/specs/social-and-notifications/spec.md), PARTY-15 in the accepted [party spec](../../openspec/specs/party-discovery-and-management/spec.md), [profiles/social](profiles-and-social.md) and [invitations/attendance](invitations-and-attendance.md). Exact route/status/envelope compatibility, schema migration, retention, provider configuration and operational retry policy remain Steps 11-12.

## Evidence index

| ID | Inspected evidence |
|---|---|
| N1 | [Notification.java](../../src/main/java/at/htl/notification/Notification.java), [NotificationDto.java](../../src/main/java/at/htl/notification/NotificationDto.java), [NotificationType.java](../../src/main/java/at/htl/notification/NotificationType.java), [NotificationResource.java](../../src/main/java/at/htl/notification/NotificationResource.java) and [NotificationRepository.java](../../src/main/java/at/htl/notification/NotificationRepository.java): stored center state, recipient queries, filters, read/delete, creation and cleanup. |
| N2 | [UserNotificationSettings.java](../../src/main/java/at/htl/notificationsettings/UserNotificationSettings.java), [NotificationSettingsDto.java](../../src/main/java/at/htl/notificationsettings/NotificationSettingsDto.java), [UserNotificationSettingsResource.java](../../src/main/java/at/htl/notificationsettings/UserNotificationSettingsResource.java) and [UserNotificationSettingsRepository.java](../../src/main/java/at/htl/notificationsettings/UserNotificationSettingsRepository.java): same-user settings and current defaults/update behavior. |
| N3 | [FollowRepository.java](../../src/main/java/at/htl/follow/FollowRepository.java), [InvitationRepository.java](../../src/main/java/at/htl/invitation/InvitationRepository.java) and [PartyRepository.java](../../src/main/java/at/htl/party/PartyRepository.java): follow, invitation, attendance, update and cancellation notification producers. |
| N4 | [OutOfAppNotificationService.java](../../src/main/java/at/htl/notification/OutOfAppNotificationService.java), [WelcomeEmailService.java](../../src/main/java/at/htl/auth/WelcomeEmailService.java), [PartyEmailDigestService.java](../../src/main/java/at/htl/notification/PartyEmailDigestService.java), [CurrentUserResolver.java](../../src/main/java/at/htl/auth/CurrentUserResolver.java) and email templates: generic event email, onboarding welcome and weekly digest paths. |
| N5 | [PushNotificationService.java](../../src/main/java/at/htl/PushNotificationService.java), device-token routes in [PartyResource.java](../../src/main/java/at/htl/party/PartyResource.java) and [UserResource.java](../../src/main/java/at/htl/user/UserResource.java): unreferenced APNs helper and duplicated caller-derived token storage. |
| N6 | Browser [notifications.html](../../src/main/resources/META-INF/resources/notifications/notifications.html) and [notifications.js](../../src/main/resources/META-INF/resources/notifications/notifications.js): authenticated inbox merging received invitations, pending follow requests and persisted notifications with action and deletion controls. |
| N7 | iOS [Partynotificationsystem.swift](../../PartyHubiOS/PartyHubiOS/Partynotificationsystem.swift) and [PartyHubiOSApp.swift](../../PartyHubiOS/PartyHubiOS/PartyHubiOSApp.swift): permission/APNs registration, local badges, stale party polling, remote deep links and incompatible token upload calls. |
| N8 | [NotificationRepositoryTest.java](../../src/test/java/at/htl/repository/NotificationRepositoryTest.java), [NotificationResourceTest.java](../../src/test/java/at/htl/resource/NotificationResourceTest.java), [UserNotificationSettingsResourceTest.java](../../src/test/java/at/htl/notificationsettings/UserNotificationSettingsResourceTest.java), [PartyEmailDigestServiceTest.java](../../src/test/java/at/htl/notification/PartyEmailDigestServiceTest.java), [PushNotificationServiceTest.java](../../src/test/java/at/htl/PushNotificationServiceTest.java) and [api/notification.http](../../api/notification.http): partial static test/request evidence; none was run. |

## Accepted event, recipient and channel matrix

`Actor` means the token-derived user committing the transition. `Host` means the party's stored host. One person qualifying through more than one audience role receives one event. A failed, denied, missing-state or repeated no-op transition produces no event. Pending actions remain visible from authoritative domain state even if optional informational delivery is disabled.

| Originating transition | Accepted event and recipient | Category | Center behavior | Email | Push / SMS | Observed source disposition |
|---|---|---|---|---|---|---|
| A requests to follow B | One follow-request action for B | `followEvents` | Authoritative pending action; optional typed information | Supported when eligible | Push stub; SMS unsupported | Follow row is created without a notification record; browser separately reads B's pending inbox. This action-derived model is useful, but category/channel processing is absent. |
| B accepts A's request | One follow-accepted event for A | `followEvents` | Informational | Supported when eligible | Push stub; SMS unsupported | Source creates one expected record for A and a second self-facing “follows you now” record for B. G041 retains the extra recipient. |
| Host issues or renews invitation | One invitation action for recipient | `partyInvites` | Authoritative pending action; optional typed information | Supported when eligible | Push stub; SMS unsupported | Invitation producers delete an old message-pattern row and create a new record. Host/mutual/state rules remain PARTY-06 implementation gaps. |
| Host withdraws pending invitation | One withdrawn event for former recipient; action removed | `partyInvites` | Non-actionable withdrawal information | Supported when eligible | Push stub; SMS unsupported | Source deletes the invitation/message without creating a withdrawal event. G041. |
| Recipient accepts/joins, declines, or joined non-host leaves | One transition event for stored Host | `partyInvites` | Informational; prior invite action becomes non-pending | Supported when eligible | Push stub; SMS unsupported | Invitation accept/decline and leave notify a sender/host in common paths. Public join not tied to an invitation does not notify the host. G041. |
| Host materially updates party | Current non-actor attendees and pending invitees, deduplicated | `partyUpdates` | Informational | Supported when eligible | Push stub; SMS unsupported | Source collects attendees/invitees, excludes actor and newly invited users; accepted contract keeps the same-transaction invitation as the only event for a newly invited recipient. Explicit event identity/preferences are absent. |
| Host cancels party | Current non-actor attendees and pending invitees at cancellation, deduplicated | `partyUpdates` | Bounded cancellation snapshot survives party deletion | Supported when eligible | Push stub; SMS unsupported | Source deduplicates attendees/invitees, creates a party-null message and removes party-bound notifications. Typed snapshot identity is absent. G040. |
| New PartyHub profile is created | One welcome email for the new user with usable address | Onboarding service message | None | Supported, best effort | None | Resolver persists settings then invokes welcome mail. It catches failure but does not use the global notification email switch or category settings. G043. |
| Weekly schedule runs | At most one per-user digest, containing only that user's Viewer-eligible upcoming parties | `partyUpdates` plus email | None | Supported, best effort | None | Source checks email/partyUpdates but gives every eligible user the same unfiltered upcoming-party list, exposing private-party risk. G043. |

The matrix completes PARTY-15's delivery dependency without changing its atomic state/event-input rule. Follow acceptance remains one directed A-to-B relationship under SOC-01; notifying B again cannot create a reverse relationship. Party update and cancellation audiences do not turn a pending invitee into an attendee or widen Viewer access.

## Notification-center state contract

| Concern | Accepted behavior | Current evidence and gap |
|---|---|---|
| Authentication and recipient scope | List, unread, read and delete are authenticated and always scoped to the token-derived recipient. No Host or path-ID override exists. | Resource/repository use `CurrentUserResolver` and recipient checks. Access rows 8-11 already capture this floor. Bypass/JWT limitations remain G002/G019. |
| Stored shape | Informational items carry explicit type, recipient, actor when applicable, creation time, read state, bounded content, stable event identity and party reference or cancellation snapshot. | Entity/DTO store recipient, sender, optional live party, status, time and message, but no type, event identity or snapshot. G040. |
| Ordering | Newest first with a deterministic tie-break. | Source orders only by creation timestamp. G040. |
| Type filter | Matches the explicit event type. | Source maps enum-like query values to English `LIKE` fragments in `message`; the enum is not persisted. G040. |
| Party filter | Matches the event's party association or cancellation snapshot without requiring a deleted party row. | Live-party rows can be filtered; cancellation rows use `party=null` and have no typed snapshot fields. G040. |
| Search | Searches bounded display content after recipient scope. | Source applies message search after recipient scope. Exact syntax/pagination stays Step 11. |
| Unread/read | Unread query returns persisted unread state; marking read is recipient-only and idempotently remains read. | Source supports recipient-scoped `UNREAD` and sets `READ`; tests partially assert this. |
| Delete | Recipient may delete every dismissible informational event type; deletion changes no follow, invitation, attendance or party state. | Source blocks selected follow messages using English text. Browser also hides deletion for protected strings. G040/G045. |
| Pending actions | Follow/invitation actions come from current domain state; deleting/suppressing information does not remove or complete an action. | Browser already merges domain rows with notifications, but matching/deduplication uses IDs/messages and action clients have compatibility gaps. G045. |
| Stale action | If current domain state is no longer pending, the item is non-actionable and cannot replay a transition. | Browser refreshes after actions, but no inspected end-to-end stale-action test exists. |

## Settings and preference effects

Only Self may read or replace settings. A missing legacy row resolves to effective defaults and is materialized when a write is needed; absence is not a silent opt-out or permission to return another user's settings.

| Setting | Accepted effective default | Applies to | Current observation |
|---|---:|---|---|
| `inAppEnabled` | Enabled | Optional informational center items | Source default true. `createNotification` returns before persistence **and** email dispatch when false, incorrectly coupling channels. |
| `emailEnabled` | Enabled | Generic event email and digest eligibility | Source default true and generic/digest checks exist. Welcome bypasses it by design as onboarding, but global availability handling is inconsistent. |
| `pushEnabled` | Disabled while unsupported | Push only after an accepted configured adapter exists | Stored source default true, but no integrated adapter exists. |
| `smsEnabled` | Disabled while unsupported | SMS only after an accepted adapter exists | Stored source default true; no SMS adapter or call site was found. |
| `partyInvites` | Enabled | Invitation issue/withdrawal and invitation/attendance outcome information | Stored default true but normal event delivery does not consult it. |
| `partyUpdates` | Enabled | Party update/cancellation and digest | Stored default true; digest consults it, normal update/cancellation delivery does not. |
| `followEvents` | Enabled | Follow request/acceptance information | Stored default true but follow delivery does not consult it. |

A qualifying informational channel requires both a supported enabled channel and its enabled category. Channel/category changes are independent: disabling in-app cannot suppress eligible email, and disabling email cannot remove center state. Pending invitation/follow actions remain available until the domain transition ends them. A complete valid replacement is atomic; exact partial/full wire semantics remain Step 11.

Current GET/PUT settings routes enforce Self but return not-found for a missing row. New profiles receive a settings entity, but every source boolean starts true, including unsupported push/SMS. No browser or iOS settings consumer was found. G042 records these differences.

## Delivery, failure and cleanup

- The follow/invitation/attendance/party transition and its event input form the durable domain boundary. SMTP, provider or center-processing failure never rolls back the domain transition.
- In-app processing uses an event-recipient identity so retry retains at most one informational item. Out-of-app retries reuse event-recipient-channel identity, never claim a failed attempt succeeded, and create no duplicate center item. No delivery deadline or automatic retry schedule is accepted here.
- Generic email is eligible only when delivery is available, the address is usable, the email channel is enabled and the event category is enabled. One channel's ineligibility or failure does not suppress another.
- Welcome is a one-time onboarding email after the new PartyHub profile is durable. It has no center item, is outside event categories and cannot invalidate identity linkage.
- Digest is email-only, requires enabled email plus `partyUpdates`, and is built separately from the same Viewer predicate used by party reads. One recipient's render/send failure does not block others.
- Invitation/follow actions cease to be actionable when their domain state leaves pending. Party cancellation removes stale party-bound invite/update items and retains one bounded cancellation snapshot independent of the deleted party.
- Physical retention, account deletion, provider delivery receipts, schema migration, alerting and retry timing remain Q006/Steps 11-12.

The generic source mail adapter catches runtime mail failures, but notification persistence and synchronous dispatch currently share one repository call and no stable attempt identity exists. The digest catches each user failure. Welcome catches failure after new-user/settings persistence. These observations support failure isolation but do not prove a queue, retry or provider acknowledgement.

## Channel and client support

| Surface | Accepted classification | Current evidence and disposition |
|---|---|---|
| Backend notification center | Supported contract | Recipient-scoped resource exists, but typed identity, deterministic tie-break, universal informational deletion and independent preferences require implementation (G040-G042). |
| Generic event email | Supported adapter | Global and user email checks plus caught failures exist; category checks and independent in-app gating are missing (G042). |
| Welcome email | Supported onboarding path | Invoked for newly created Keycloak-linked profile; failure is caught. Global availability and exact duplicate prevention remain implementation/runtime work (G043). |
| Weekly digest | Supported optional email path | Scheduler and two preference checks exist; per-recipient Viewer filtering is missing (G043). |
| APNs push | Stub / unsupported until integrated | Helper sends raw sandbox requests for attendee tokens, has no event/category integration or accepted authentication/result contract, and is not referenced by production producers (G044). |
| SMS | Unsupported | Preference/config labels exist, but no adapter or delivery path was found (G042/G044). |
| Browser | Current primary action surface | Requires login and merges invitation, follow-request and notification sources. It does not call mark-read, has no settings UI, infers types/protection from messages and uses domain mutation for action dismissal (G045). |
| iOS | Permission/deep-link scaffolding, not backend-center parity | Requests OS permission, keeps device-local badge/update state and handles remote party deep links. Polling uses stale singular routes; no backend center/settings client was found (G006/G045). |
| Device-token registration | Conditional push prerequisite, not a profile field | Accepted actor is always current caller. Backend has two duplicate PUT/query routes; both iOS AppDelegate variants use POST `/api/users/{id}/device-token` with JSON body. G044; exact canonical route remains Q014/Step 11. |

The accepted contract does not require identical browser/iOS UI. A client that exposes center/settings behavior must use the shared recipient and preference semantics. OS permission denial or an absent token skips push without changing independently eligible in-app/email behavior.

## Test evidence and limitations

- `NotificationRepositoryTest` asserts empty/list data, unread retrieval, successful read, missing/wrong-recipient read/delete, message-protected deletion, party cleanup and invitation-message cleanup. It does not establish typed filters, deterministic ordering, idempotent event identity, universal informational deletion or domain-state separation.
- `NotificationResourceTest` checks anonymous rejection and basic bypass-authenticated list/filter/unread/missing mutations. It does not assert recipient isolation data, filter correctness, read idempotency or normal bearer identity.
- `UserNotificationSettingsResourceTest` checks current all-true defaults, a full update, other-user denial and anonymous denial. It does not cover missing-row effective defaults, atomic failure, unsupported channel status or delivery effects.
- `PartyEmailDigestServiceTest` checks only disabled email and disabled `partyUpdates`. It does not cover Viewer filtering, one digest per user, empty/private content or failure isolation.
- `PushNotificationServiceTest` verifies only that the native token query executes with empty/non-empty results, not APNs authentication, preference/category gating, event wiring, delivery response or retry.
- Follow/invitation/party tests contain partial message/count assertions described in prior reviews. They do not cover the complete Group 8 recipient matrix or failed/no-op event behavior.
- `api/notification.http` uses numeric bypass headers and basic statuses. It is not evidence for normal JWT identity or delivery.
- No JUnit, HTTPYac, browser, iOS, Keycloak, database, SMTP or APNs test was run for Group 8.

## Integrated result

The bounded modification of `social-and-notifications` integrates the expanded SOC-03 contract plus SOC-08 notification-center state, SOC-09 preferences, SOC-10 delivery and SOC-11 welcome/digest behavior. The applied child [proposal](../../openspec/changes/archive/2026-09-30-document-notifications-and-preferences/proposal.md), [design](../../openspec/changes/archive/2026-09-30-document-notifications-and-preferences/design.md), [delta](../../openspec/changes/archive/2026-09-30-document-notifications-and-preferences/specs/social-and-notifications/spec.md) and [tasks](../../openspec/changes/archive/2026-09-30-document-notifications-and-preferences/tasks.md) remain active and unarchived.

After synchronization, `social-and-notifications` contains **11 requirements/82 scenarios** and accepted total coverage is **52 requirements/274 scenarios** across six capabilities. D020 resolves Q007 at the specification layer. G040-G045 preserve implementation, client and runtime differences; Q006 and Q014 retain physical lifecycle and exact API compatibility boundaries.
