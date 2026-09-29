# Proposal

## Why

PartyHub's accepted notification-center requirement does not yet define complete event recipients, event categories, query/state behavior, channel preferences, or welcome/digest delivery. Current source also derives notification types from message text, couples the in-app switch to email creation, exposes unused push and SMS settings, and contains incompatible iOS device-token calls, so source behavior cannot safely stand in for the product contract.

## What Changes

- Define one event-recipient matrix for follow requests and acceptance, invitation issue/withdrawal/outcomes, attendance changes, party updates/cancellation, welcome messages, and weekly digests.
- Expand the notification center into authenticated recipient-owned, explicitly typed state with deterministic list/filter/unread/read/delete behavior, actionable-state cleanup, deduplication, and party-deletion handling.
- Define same-user notification settings with explicit enabled defaults, atomic replacement, independent channel/category gates, and no implication that an unsupported channel delivers messages.
- Establish in-app and email as the source-backed delivery channels, classify the current APNs code as an unintegrated stub and SMS as unsupported, and keep device-token registration inactive until a supported push adapter and one caller-derived API contract exist.
- Define best-effort delivery failure behavior, a preference-aware and visibility-safe weekly email digest, and an onboarding welcome email that never controls identity creation.
- Preserve exact wire paths/status/envelopes, physical retention, delivery observability, and retry scheduling for Steps 11-12 instead of inventing transport or reliability guarantees.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `social-and-notifications`: Complete notification event recipients, notification-center state, same-user preferences, delivery channels, welcome/digest behavior, cleanup, and failure boundaries.

## Impact

- Main-spec target: `openspec/specs/social-and-notifications/spec.md` after apply and sync.
- Evidence and later implementation areas: notification/settings entities, repositories and resources; follow/invitation/party event producers; welcome and digest email services; browser notification actions; iOS APNs/local-notification/device-token paths; notification/settings/delivery tests and HTTPYac requests.
- No application code, API implementation, database schema, message delivery, runtime configuration, dependency, or deployed service changes are part of this documentation change.
