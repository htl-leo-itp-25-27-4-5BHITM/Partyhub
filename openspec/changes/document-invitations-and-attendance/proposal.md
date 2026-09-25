# Proposal

## Why

PartyHub's durable specification preserves mutual-contact invitations and acceptance-through-attendance, but it does not define who may manage invitations, how decline/withdrawal/renewal and retries affect private visibility, or who may read invitation and attendance projections. The backend and both clients currently expose conflicting paths and audiences, so agentic implementation work needs one reviewable contract that keeps intended transitions separate from observed defects.

## What Changes

- Expand private-party invitation requirements with stored-host authority, backend mutual-contact enforcement, one logical invitation per party/recipient, and explicit duplicate, renewal, withdrawal, self-invite and missing-target behavior.
- Expand attendance requirements with public/private join eligibility, atomic acceptance/decline/leave transitions, repeat-action behavior, and denial without membership or visibility side effects.
- Define how `PENDING`, `ACCEPTED`, `DECLINED` and withdrawn invitations affect private-party visibility.
- Add actor-scoped invitation lists/details, attendance status, invited/joined rosters and invitation statistics, including host-only invitation metadata and viewer-safe joined-member projections.
- Add domain-event inputs and intended recipients for invitation and attendance transitions while leaving notification channel, preference, delivery and retry contracts to the notification stage.
- Keep age/capacity admission enforcement unresolved under Q004 and exact method/status/schema migration under Q014; record source and client mismatches as implementation gaps rather than accepted behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `party-discovery-and-management`: Complete invitation management, attendance transitions, private-visibility effects, actor-scoped projections and transition-event requirements while retaining the accepted party lifecycle and mutual-contact semantics.

## Impact

- Planning and specifications: this change's proposal, design, party delta and documentation-only tasks; after a later review/apply task, the durable `party-discovery-and-management` specification and umbrella Group 5 records.
- Evidence and follow-up areas: invitation/party repositories and resources, browser invitation selector/detail/notification flows, iOS invitation/invite/detail flows, notification event production, and their test suites.
- No application code, API implementation, database schema, runtime configuration, deployment or notification delivery adapter is changed by this documentation proposal.
