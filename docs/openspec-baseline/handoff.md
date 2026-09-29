# Notifications and preferences proposal handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`). Groups 1-7 remain complete. Group 8 items 8.1-8.3 remain open, so umbrella progress is still **26/46 complete, 20 remaining**. Group 8 is in progress at its proposal checkpoint; Group 9 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. Group 8 planning started from repository commit `312d104f0568e550f1f68b933ec153348e98226f`. No application source, configuration, database, deployment or uploaded data was changed.
- Child proposal: [document-notifications-and-preferences](../../openspec/changes/document-notifications-and-preferences/proposal.md), with its [design](../../openspec/changes/document-notifications-and-preferences/design.md), [social delta](../../openspec/changes/document-notifications-and-preferences/specs/social-and-notifications/spec.md) and [tasks](../../openspec/changes/document-notifications-and-preferences/tasks.md). Planning artifacts are complete and strictly valid; **0/8 child tasks are complete**. The child is active, unapplied, unsynced and unarchived.
- This checkpoint is proposal-only under W015. The main `social-and-notifications` spec remains at SOC-01-SOC-07 with 7 requirements/43 scenarios; accepted overall coverage remains **48 requirements/235 scenarios**.
- The scoped proposal commit uses message `docs: propose notifications and preferences specification`; use `git log -1` for its immutable SHA.

## Proposed Group 8 contract awaiting apply

The proposal reuses the existing social capability and modifies SOC-03 while adding four notification requirements. It proposes:

- deterministic recipients for follow request/acceptance, invitation issue/withdrawal/outcomes, attendance leave, party update/cancellation, welcome and weekly digest;
- authoritative pending invitation/follow actions plus typed informational notification records, without message-text classification as policy;
- authenticated recipient-only list/filter/unread/read/delete state, with informational deletion separated from domain transitions;
- same-user effective settings with in-app/email and three event categories enabled by default, while unsupported push/SMS remain effectively disabled;
- independent channel/category gates, delivery-failure isolation, stable retry identity and no delivery deadline or automatic-retry promise;
- integrated email, an unintegrated APNs stub, unsupported SMS, and caller-derived device-token ownership if push is later activated;
- a one-time best-effort onboarding welcome email and a preference-aware weekly email digest filtered through the party Viewer predicate;
- cleanup of obsolete action items and stale party-bound notices while a bounded cancellation snapshot survives party deletion.

These are proposed requirements, not accepted behavior, until the child is applied and synced. Q007 therefore remains unresolved at this checkpoint.

## Evidence reviewed for the proposal

- Backend center/settings: `Notification`, `NotificationDto`, `NotificationType`, `NotificationResource`, `NotificationRepository`, `UserNotificationSettings`, its DTO/repository/resource and `NotificationSchemaCompatibility`.
- Event producers: `FollowRepository`, `InvitationRepository` and `PartyRepository`, reconciled with SOC-01 and PARTY-15 plus [profiles/social](profiles-and-social.md) and [invitation/attendance](invitations-and-attendance.md) evidence.
- Delivery: `OutOfAppNotificationService`, `WelcomeEmailService`, `PartyEmailDigestService`, `PushNotificationService`, current application/test mail configuration and both device-token routes.
- Clients: browser notification page/action merge; iOS local/remote notification, badge, polling, deep-link and device-token code. The browser has no inspected read-state/settings controls; iOS has no complete backend notification-center/settings client. Both iOS token upload implementations use POST with a user-id path/body that disagrees with the authenticated PUT/query backend routes.
- Tests/requests: notification repository/resource, settings resource, digest and push tests plus `api/notification.http`. They were inspected but not run. Existing tests cover only partial read/delete/ownership/default/digest conditions and do not prove typed events, recipient completeness, independent gates, push delivery, visibility-safe digest content or cross-client compatibility.

## Proposal validation record

| Check | Result |
|---|---|
| Child planning status | Proposal, delta, design and tasks are complete; apply progress remains 0/8. |
| Child strict validation | `openspec validate document-notifications-and-preferences --strict --no-interactive` passes. |
| Main specs | Not modified or synced at this checkpoint; accepted social coverage remains 7/43 and overall coverage 48/235. |
| Umbrella checklist | Items 8.1-8.3 remain unchecked; progress remains 26/46. |
| Runtime evidence | No application, API, browser, iOS, Keycloak, database, mail-provider or deployment test was executed. |
| Preservation | Application source/configuration and the two unrelated working-tree files remain unstaged and unchanged. |

## Working-tree preservation

Do not include or overwrite these unrelated user edits:

- `prompts/prompts.md`, preserved SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`, preserved SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`

Before applying Group 8, compare current hashes and source/configuration state to this handoff. Do not archive the umbrella or any active child while later groups remain.

## Exact next prompt

```text
Use openspec-apply-change for document-notifications-and-preferences, then
continue complete-partyhub-specification Group 8 only.

Read docs/openspec-baseline/handoff.md and runbook.md first, then the child
proposal/design/delta/tasks, umbrella design/tasks, accepted social/party/auth
specs, notification source/tests, coverage, decisions, gaps, inventory and
access matrix.

Complete all 8 child documentation/specification tasks; do not implement
application fixes. Create the durable notification/preferences evidence and
event-recipient-channel matrix, sync the accepted social delta, and update
coverage, decisions, gaps, inventory, access matrix, runbook, umbrella tasks
8.1-8.3 and this handoff. Validate the child, main social spec and umbrella.

Preserve the application-source snapshot and unrelated dirty files. Do not
start Group 9 and do not archive the child or umbrella.
```
