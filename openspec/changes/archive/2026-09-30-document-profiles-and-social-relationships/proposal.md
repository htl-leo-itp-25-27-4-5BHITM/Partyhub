# Proposal

## Why

The accepted social spec defines one-way follow acceptance and basic profile discovery but leaves profile-field exposure, self versus cross-user permissions, duplicate/removal transitions and mutation actor semantics unspecified. The source currently exposes raw user entities and pending requests through open reads and uses inconsistent follow path parameters, so agentic implementation needs a bounded normative contract before fixes are attempted.

## What Changes

- Extend the follow-request requirement with explicit self-request, duplicate, authorized acceptance, cancellation, rejection, unfollow, follower-removal and reverse-direction preservation scenarios.
- Define mutual contact strictly as two independent accepted directed relationships and make loss of either direction end mutual status without deleting the other.
- Add a bounded profile projection separating social fields from self-only contact fields and internal identity/delivery fields.
- Add authenticated self-only profile editing with immutable/internal field and conflict/failure boundaries.
- Clarify authenticated profile search/read, private pending-request access, caller-relative relationship status and D008 profile-party visibility.
- Record browser/iOS support separately without inventing iOS parity; retain profile-picture lifecycle, notification delivery and exact API status/schema work for their later owner stages.
- Keep source mismatches in the gap register; this change performs documentation/specification work only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `social-and-notifications`: Complete the profile/social contract while preserving the existing follow-request model, mutual-contact rule, invitation dependency and notification-center requirement.

## Impact

The change updates the existing `social-and-notifications` specification and baseline traceability for user/profile and follow routes. Later implementation work may affect `UserResource`, `UserRepository`, `FollowRepository`, browser profile/notification pages, iOS profile/social surfaces and their tests, but this proposal does not edit those files or require cross-client UI parity.
