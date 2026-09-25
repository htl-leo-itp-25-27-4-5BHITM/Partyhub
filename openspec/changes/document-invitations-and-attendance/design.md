# Design

## Context

See [proposal.md](proposal.md) for the motivation. Invitation and attendance behavior spans two backend write paths (`PartyCreateDto.selectedUsers` and `/api/invitations`), party join/leave operations, several roster/statistics projections, browser invitation and notification flows, and iOS invitation, invite and party-detail flows. The accepted baseline already fixes D004-D007: private invitations target mutual contacts, acceptance happens through attendance, leaving an accepted invited party declines the invitation, and private visibility includes qualifying invitees and joined attendees.

Source behavior cannot be treated as policy. Direct invitation creation does not consistently enforce stored-host authority or mutual-contact eligibility, the party creation path does not remove deselected invitations, private join currently lacks the accepted visibility check, projection endpoints expose different audiences, and browser/iOS payloads and models disagree with the backend. This is a documentation change; application code, data, configuration and runtime tests remain outside this proposal.

## Goals / Non-Goals

**Goals:**

- Define one logical invitation and attendance state machine across party creation, direct invitation actions, acceptance, join, decline, leave, renewal and withdrawal.
- Make stored-host authority, recipient eligibility, private visibility and actor-scoped projections explicit at the backend boundary.
- Define committed transition events as inputs to later notification processing without coupling domain state to a delivery channel.
- Give browser, iOS and backend reconciliation work one server-owned contract while preserving accepted authentication, social and party lifecycle rules.

**Non-Goals:**

- Implement backend or client repairs, migrate existing data, or require browser/iOS interface parity.
- Decide whether age or capacity metadata blocks admission; Q004 remains unresolved.
- Choose exact methods, status codes, response envelopes, field names or legacy-route migration; Q014 remains with Group 11.
- Define notification channels, preferences, delivery, retry or cleanup, which remain with Group 8.
- Define host eviction/moderation or any host-transfer behavior.

## Decisions

### 1. The stored host owns invitation management

Only the party's stored host can issue, renew or withdraw an invitation. Private-party eligibility is checked against the host's current mutual-contact relationship for every issue or renewal transition, and the backend rejects self-invites and missing targets before state changes. This applies equally to invitees selected during party creation/update and to the direct invitation resource.

Trusting a browser-computed mutual-contact list was rejected because clients are not an authorization boundary. Allowing any authenticated sender to create a direct invitation was rejected because it would bypass stored party ownership. Public invitations keep the same host authority so alternate paths do not create conflicting ownership rules.

### 2. One logical invitation per party and recipient carries current visibility state

Each party/recipient pair has one logical invitation. `PENDING` grants invitation-based private visibility, `ACCEPTED` records the acceptance tied to current attendance, and `DECLINED` or host withdrawal removes invitation-based visibility. Reinviting an eligible declined recipient renews the same logical invitation to `PENDING`; repeating a current pending or accepted invitation is a no-op. Withdrawal applies to pending state and does not silently evict an accepted attendee.

Creating duplicate invitation records was rejected because it makes current status, statistics and retry behavior ambiguous. Treating historical declined invitations as permanent viewers was rejected because D007 requires a qualifying invitation, while deleting every status record was rejected because the product exposes invitation status and statistics.

### 3. Attendance is the atomic source of acceptance

An authenticated non-host can join a public party without an invitation. A private-party non-host must have a pending invitation. A supported invitation acceptance action performs the same state transition as joining: one attendance membership plus `ACCEPTED`. Decline ensures no attendance and removes invitation-based visibility; leaving removes membership and changes an applicable accepted invitation to `DECLINED`. Repeating an already-current join, acceptance, leave or decline preserves state and emits no duplicate event.

Keeping a separate accepted-but-not-attending state was rejected because D006 already defines acceptance through attendance. Applying age or capacity as an admission rule here was rejected because Q004 has no accepted answer and lifecycle evidence only establishes those fields as metadata.

### 4. Projections are authorized from the requested data, not merely authentication

Recipients can list their received invitations and hosts can list invitations they issued. Invitation details are bounded to that invitation's host and recipient. Host-only projections include invited identities, invitation statuses and invitation statistics. An authenticated party viewer can read a bounded joined-member roster, their own attendance status and a viewer-safe count without receiving host-only invitation metadata. Statistics count logical invitations and never synthesize an accepted invitation for the host.

Leaving all invitation, roster and statistics endpoints open to any authenticated user was rejected because those views disclose private relationships and party participation. Making every roster host-only was rejected because attendee-facing party detail already needs a bounded joined-member and self-status projection.

### 5. Domain events commit with their transitions

Each committed invitation or attendance transition produces at most one event with the party, actor, transition type and intended domain recipient. Issue/renew/withdraw events target the recipient; accept/join, decline and leave events target the host. Denied, failed and no-op actions produce no transition event. Notification processing owns channel choice, preferences, delivery and retry in Group 8.

Calling notification delivery directly from each route was rejected because multiple entry points would duplicate behavior and couple persistence success to a delivery adapter. Emitting events for repeated actions was rejected because retries must not generate duplicate user-visible effects.

### 6. All clients share server-owned transitions

Browser and iOS may expose different controls, but their supported invitation and attendance actions resolve to the same server-owned state machine and authorization rules. Client filtering can improve selection UX but never replaces backend host, mutual-contact, recipient or viewer checks. Exact transport schema and temporary compatibility handling remain Q014.

Treating the current browser and iOS payload shapes as separate accepted contracts was rejected because they represent the same persisted invitation and membership state. Requiring identical interfaces was rejected because the durable baseline permits platform-specific scope.

## Risks / Trade-offs

- [Existing data may contain duplicate or contradictory invitation/membership rows] → Audit and migrate those rows in a separate implementation change before enforcing uniqueness and state invariants.
- [Tighter authority and projection rules can break current browser/iOS calls] → Use the recorded call-site and payload gaps to stage compatible client and backend fixes with authorization tests.
- [Two acceptance surfaces can drift] → Route both through one domain transition and test identical state/event results during implementation.
- [Current clients disagree with backend field names and response shapes] → Resolve exact wire compatibility under Q014 before application rollout; do not weaken actor or transition rules.
- [Transition events may be confused with delivered notifications] → Keep the domain event contract bounded to committed inputs and defer channel, preference, retry and cleanup guarantees to Group 8.

## Migration Plan

1. Validate this child change strictly and review each modified requirement as a complete replacement of the corresponding main-spec requirement.
2. On a later explicit apply request, reconcile the documentation-only checklist and sync the delta into `party-discovery-and-management`.
3. Update coverage, access, decision, gap, inventory, runbook and handoff records, then mark umbrella 5.4 complete only after integrated validation passes.
4. Implement data cleanup, backend authorization/state transitions, client compatibility and runtime tests through separate bounded application changes.

Rollback for this planning stage is removal of this active, unarchived child change. After integration, revise accepted behavior only through a reviewed follow-up delta rather than silently removing invitation or attendance requirements.

## Open Questions

- Q004 remains for admission-time enforcement of age and capacity metadata.
- Q014 remains for exact methods, statuses, response envelopes, field names and temporary legacy-route compatibility.
- Group 8 must define notification channels, preferences, delivery, retry and cleanup for the transition events established here.
