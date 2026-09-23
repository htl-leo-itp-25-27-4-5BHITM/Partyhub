# Design

## Context

See [proposal.md](proposal.md) for motivation and [profiles-and-social.md](../../../docs/openspec-baseline/profiles-and-social.md) for source evidence. The existing capability combines social relationships, private-invite eligibility, notifications and profile discovery. This change modifies only the profile/social portions while preserving SOC-02 private-invite semantics and SOC-03 notification-center semantics.

The backend currently returns JPA `User` entities from open profile/follow reads, accepts a broad update DTO, and exposes follow mutations whose path parameters do not consistently describe the actor or target. Browser code implements search, profiles and most follow actions; iOS currently implements an authenticated self profile and counts, with inert Follow/Message buttons. Existing tests were inspected but not run.

## Goals / Non-Goals

**Goals:**

- Define actor/target and state-transition semantics independently of legacy route parameter names.
- Establish an explicit least-privilege profile projection and self-update boundary.
- Preserve one-way acceptance, two-way mutual-contact evaluation and D008 profile-party visibility.
- Make browser/iOS scope explicit so source presence or absence is not mistaken for parity.
- Produce a delta that can be synced without editing application source.

**Non-Goals:**

- Choose final REST paths, payload envelopes or HTTP status codes; Step 11 owns the cross-client API matrix.
- Specify profile-picture validation/storage, notification delivery, invitation enforcement or party-query implementation.
- Resolve Q011 local-user creation, Q012 identity-claim matching or application defects.
- Implement source fixes or add client features.

## Decisions

### Use directed relationship semantics instead of legacy path semantics

Every relationship is expressed as follower/requester A to target/recipient B. The authenticated principal supplies the actor for mutations, while request parameters identify the other user or relationship. Cancellation, rejection, unfollow and follower removal all delete only A-to-B; the reverse direction remains independent.

This gives G024 a stable target without choosing whether existing routes are renamed, validated or replaced. Treating ignored path parameters as the contract was rejected because their meanings differ across POST, PUT and DELETE and would preserve an accidental compatibility shape.

### Complete the two-state lifecycle without inventing notification policy

The delta uses None, PENDING and ACCEPTED for each direction. It defines self-request, duplicate, authorized acceptance, cancellation, rejection and removal outcomes. Exact idempotent response status and follow-event notifications remain Step 11 and Step 8 concerns respectively.

Leaving cancellation/rejection unspecified was rejected because umbrella 3.2 explicitly requires removal and duplicate-action scenarios, and the notification UI exposes both accept and dismiss actions. Requiring a reverse relationship on acceptance was rejected because D004 fixes acceptance as one-way.

### Return projections rather than persistence entities

Search and cross-user profile/follow responses use a bounded social projection. Self responses may add contact and provider-username fields. Keycloak subject and device token never belong to profile or social output. This creates one access rule across list, ID, handle, follow-list and pending-request reads without making database serialization part of the product API.

Continuing raw entity serialization was rejected because it exposes identity-link and delivery fields unrelated to the profile experience. A separate new profile capability was rejected because the existing `social-and-notifications` spec already owns profile discovery and party context.

### Require authentication for profile and social reads

The bounded target requires an authenticated PartyHub user for search, profiles, accepted lists/counts, pending inbox and relationship status. Cross-user reads expose only social fields; pending requests are recipient-private and status is caller-relative.

Preserving anonymous raw profile reads was rejected because no accepted artifact authorizes public contact/internal fields, and D008's private-party profile context requires a known viewer. Public party discovery remains available through the party capability; this change does not hide public parties from their dedicated routes.

### Keep self editing narrow and atomic

Editable text fields are display name, distinct handle, email, phone number and biography. The distinct handle is unique profile identity. Database ID, provider username, Keycloak subject and device token are outside profile editing. Invalid or conflicting updates do not partially change the profile.

Free-form patching of every serialized field was rejected because it conflicts with AUTH-08 identity linking and notification ownership. Exact length/format rules remain Step 11 unless existing accepted authority supports them.

### Record client support without requiring parity

The browser owns the currently observed search, other-user profile, follow actions and profile-party UI. The iOS minimum is its authenticated self profile and accepted counts. Shared backend contracts remain reusable by either client, but this change does not require iOS cross-user social screens or treat its inert buttons as accepted behavior.

Mandating immediate iOS parity was rejected because neither the current spec nor archived decisions establish it. Excluding iOS from the capability entirely was also rejected because it consumes self profile/count data and profile images.

## Risks / Trade-offs

- [Restricting currently open reads can break anonymous or legacy callers] → Record the compatibility impact in G026/G027 and require the Step 11 API matrix to enumerate callers before implementation.
- [The proposed projection may require DTOs across several endpoints] → Keep one logical field policy and allow implementation-specific DTO reuse; do not expose persistence entities as a shortcut.
- [Legacy mutation routes can be interpreted multiple ways] → Test the normative actor/target transitions independently of route spelling, then reconcile paths in Step 11.
- [Client support can be mistaken for a promise of parity] → Keep platform scope in coverage and the main requirement text after integration.
- [Handle uniqueness may conflict with existing data] → Before implementation, audit collisions and choose a migration under a bounded implementation change; do not weaken the unique-handle contract silently.

## Migration Plan

1. Validate this child change strictly and review its full modified requirement blocks against the current main spec.
2. On a later explicit apply request, sync the delta into `social-and-notifications` and update coverage, access, decision and gap records.
3. Mark umbrella 3.3 complete only after the integrated main spec and traceability checks pass.
4. Keep application remediation as separate bounded changes; this documentation change has no runtime rollout or data migration.

Rollback for the planning stage is removal of this unarchived child change. After integration, restore the prior main spec only through a reviewed follow-up delta rather than silently deleting accepted behavior.

## Open Questions

- Step 11 must choose final route shapes, response envelopes and status/idempotency behavior that implement these semantics without ambiguous ignored parameters.
- Step 7 must decide profile-picture validation, replacement/deletion and serving details while preserving the projection/access boundary here.
- Step 8 must map request/accept/reject/removal transitions to notification events and recipient preferences.
