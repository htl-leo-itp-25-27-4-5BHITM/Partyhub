# Design

## Context

See [proposal.md](proposal.md) for motivation. The accepted party and social contracts already define directed follow state, invitation/attendance event inputs, stored-host authority, and Viewer eligibility. Group 8 must turn those inputs into one notification contract without changing domain transitions or treating current delivery code as accepted policy.

The backend persists recipient/sender/message/status records and filters types by English message fragments. Event producers differ: pending follow requests are surfaced by browser domain-state queries, acceptance creates two notification rows, invitation withdrawal removes an action without a withdrawal item, and some public joins omit the host event required by PARTY-15. A notification setting can currently suppress both persistence and downstream email, even though channel switches should be independent.

Email is the only integrated out-of-app adapter. A weekly digest and welcome email exist as separate paths. The APNs class is not wired to event production or preferences, its token contract disagrees with iOS callers, and SMS has no adapter. Browser notification UI merges persisted records with authoritative invitation and follow-request state; iOS has local polling and APNs/deep-link scaffolding but no complete backend notification-center client.

This change is documentation/specification work only. Application repairs, persistence migration, delivery operations, and client implementation require later bounded changes.

## Goals / Non-Goals

**Goals:**

- Reuse the event inputs from SOC-01 and PARTY-15 with one non-contradictory recipient map.
- Keep actionable invitation/follow state available even when optional informational delivery is disabled.
- Separate recipient-owned center state from authoritative domain transitions.
- Make channel and category preferences independent and give missing/legacy settings deterministic effective values.
- State which delivery adapters are supported, stubbed, or unsupported without promising unavailable delivery.
- Preserve visibility for digest content and domain success when delivery fails.

**Non-Goals:**

- Implement typed storage, queues, retries, adapters, settings UI, client parity, API routes, or tests.
- Select exact HTTP statuses, response envelopes, retry schedules, retention periods, provider SLAs, or operational alert thresholds.
- Make push or SMS a supported channel by specification alone.
- Change follow, invitation, attendance, party ownership, Viewer, identity, or media rules.
- Start QR or any later umbrella group.

## Decisions

### 1. Use authoritative domain state for actions and typed events for information

Pending invitations and follow requests remain actionable from their domain rows. Informational records use explicit event types and references; localized message text is display content only. This matches the browser's useful merge model while removing message parsing as policy.

Alternative considered: make every action depend on a generic notification row. Rejected because deleting or suppressing a delivery record could hide a still-pending domain action or accidentally change domain state.

### 2. Use one recipient map across social and party events

| Event | Recipient set | Category | In-app | Email | Push | SMS |
|---|---|---|---|---|---|---|
| Follow requested | Target user | `followEvents` | Authoritative action + optional information | Supported | Stub/unsupported | Unsupported |
| Follow accepted | Original requester | `followEvents` | Informational | Supported | Stub/unsupported | Unsupported |
| Invitation issued/renewed | Invitation recipient | `partyInvites` | Authoritative action + optional information | Supported | Stub/unsupported | Unsupported |
| Invitation withdrawn | Former recipient | `partyInvites` | Remove action + information | Supported | Stub/unsupported | Unsupported |
| Invitation accepted/joined, declined, attendee left | Stored host | `partyInvites` | Informational | Supported | Stub/unsupported | Unsupported |
| Party materially updated | Current non-actor attendees and pending invitees, deduplicated; a newly invited recipient gets the invitation action instead of a second update from the same transaction | `partyUpdates` | Informational | Supported | Stub/unsupported | Unsupported |
| Party cancelled | Current non-actor attendees and pending invitees, deduplicated | `partyUpdates` | Snapshot information surviving deletion | Supported | Stub/unsupported | Unsupported |
| New profile welcome | Newly created user with usable email | Onboarding service message | None | Supported | None | None |
| Weekly digest | Each eligible user, built per recipient visibility | `partyUpdates` + email | None | Supported | None | None |

The accepting user does not need a notification that they accepted their own request, and the host does not receive their own update/cancellation message. A participant who qualifies through more than one role receives one event. A user newly invited by the same party update receives the actionable invitation with current details instead of both an invitation and an update.

Alternative considered: preserve every current producer recipient, including the follow accepter and message-specific duplicates. Rejected because it creates self-notifications and contradicts the actor/recipient meaning established in prior stages.

### 3. Make notification state recipient-owned and independent of domain state

Read state and deletion belong to the addressed user. Every informational event type is dismissible; no English message pattern makes an item undeletable. Deletion never accepts, declines, withdraws, cancels, or removes a follow. Current domain state decides whether an action remains visible.

Alternative considered: protect selected follow messages from deletion. Rejected because message text is not a stable authorization or retention rule and no accepted policy requires permanent follow notices.

### 4. Define supported-channel defaults and independent gates

Effective defaults are enabled for in-app, email, `partyInvites`, `partyUpdates`, and `followEvents`. Push and SMS are disabled while unsupported. Event eligibility is `supported channel enabled AND category enabled`, except authoritative action items, which remain available while pending. An in-app switch never disables email, and an email switch never disables in-app state.

Alternative considered: copy all seven source booleans as enabled defaults. Rejected because enabled push/SMS would falsely communicate delivery support. Another alternative was to hide pending action items when a category is disabled; rejected because that would strand domain state outside the primary action surface.

### 5. Treat delivery as best effort after a durable event input

The domain transition and its event input remain the atomic boundary established by PARTY-15. Channel processing can fail independently. A stable event/recipient/channel identity permits idempotent in-app processing and safe retry coordination; exact queueing, retry timing, and provider delivery acknowledgement remain Step 11 concerns.

Alternative considered: execute every adapter inside the domain transaction. Rejected because an SMTP or provider failure would invalidate valid follow, invitation, attendance, or party state.

### 6. Keep email supported and classify push/SMS honestly

Generic event email, welcome email, and weekly digest are supported email behaviors with distinct eligibility rules. Push remains an integration target only after an authenticated caller-derived token API, preference wiring, configured provider authentication, and delivery reporting exist. SMS remains unsupported. Neither inactive preference field may be presented as successful delivery.

Alternative considered: accept the APNs helper as a supported adapter because source can issue an HTTP request. Rejected because it is unreferenced by event producers, ignores preferences, lacks a compatible client token route, and has no reliable success/error contract.

### 7. Give welcome and digest separate semantics

Welcome is a one-time onboarding communication after a new PartyHub profile exists. It does not create a center item or use event categories, and its failure never breaks identity linkage. Digest is email-only, requires email plus `partyUpdates`, and is built per recipient from the same public/private Viewer predicate used by party reads.

Alternative considered: use the current global upcoming-party list for every digest recipient. Rejected because it can reveal private-party details to unrelated users.

### 8. Clean up actions while preserving cancellation history

Invitation/follow actions disappear or become non-actionable when their domain row leaves pending state. Party cancellation removes stale party-bound invitation/update actions, then preserves one bounded cancellation snapshot that does not require the deleted party. Physical retention and account-deletion cleanup remain Q006/Step 11.

Alternative considered: retain live foreign-key dependence after cancellation. Rejected because deleting the party would either delete the notice or leave an invalid reference.

## Risks / Trade-offs

- **[Existing message-only rows lack typed event identity]** → Record a migration/compatibility gap and make Step 11 choose exact schema and API mechanics before implementation.
- **[Action items can appear while informational preferences are disabled]** → Explain that they represent authoritative pending work, not optional channel delivery.
- **[Defaults differ from current all-true settings fields]** → Record the push/SMS mismatch explicitly and require effective support status rather than trusting stored booleans.
- **[Best-effort email can still duplicate at a provider boundary]** → Require stable attempt identity and honest delivery state; leave provider-specific idempotency and retry policy to Step 11.
- **[Browser and iOS support differs]** → Keep client behavior in the evidence record and avoid a cross-platform UI-parity requirement.
- **[Digest visibility may increase query cost]** → Reuse the accepted Viewer predicate per recipient; performance targets and batching remain Step 11 quality work.

## Migration Plan

1. Apply and sync the social delta, preserving SOC-01, SOC-02 and SOC-04-SOC-07.
2. Update the Group 8 matrix/evidence, access rows, coverage, decision, gap, inventory, runbook and handoff records.
3. Implement typed events, independent preferences, cleanup and email handling in later bounded backend changes; migrate legacy message-only rows under the Step 11 persistence/API contract.
4. Add browser center behavior and any approved iOS push/center behavior in separate client changes after the shared backend contract is implemented.
5. Keep physical retention, exact transport/status schemas, retry schedules, provider configuration and operational evidence in Steps 11-12.
