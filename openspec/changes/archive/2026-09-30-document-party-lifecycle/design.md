# Design

## Context

See [proposal.md](proposal.md) for the motivation. Party lifecycle behavior spans the backend resource/repository, a shared persistence model, a browser form plus legacy helper functions, and iOS list/form/detail/notification code. The accepted baseline already fixes public/private viewer roles and host management in D007. Source behavior cannot be treated as policy: the update path currently assigns the caller as host without checking stored ownership, validation groups and cross-field rules are incomplete, several query branches skip visibility, and some client calls use singular routes, wrong methods, unauthenticated reads, or hard-coded replacement values.

This is a documentation change. Application code, data, configuration, route migration, and runtime tests remain outside this proposal.

## Goals / Non-Goals

**Goals:**

- Produce one testable lifecycle contract for create, read, update, and delete authorization.
- Define the accepted party fields and validation invariants without turning observed defects into intended behavior.
- Give browser, iOS, backend, and later API reconciliation work one canonical route/payload boundary.
- Preserve accepted authentication, social, invitation, attendance, notification, discovery, map, and media decisions.

**Non-Goals:**

- Define invitation-state transitions, mutual-contact enforcement mechanics, roster exposure, or join/leave idempotency owned by Group 5.
- Decide whether age or capacity blocks admission; Q004 remains with Group 5 after this lifecycle change records those fields as metadata.
- Reconcile every response envelope, HTTP status, serialization field, or README claim owned by Group 11.
- Require browser/iOS interface parity or implement any source fix.

## Decisions

### 1. Stored host identity is immutable through lifecycle payloads

The backend derives the creator from the validated bearer-token identity, stores that user as host, and compares later mutations with the stored host before changing anything. Host identifiers in a payload have no authority. This preserves D001 and D007 and prevents an update from becoming an ownership-transfer operation.

An explicit ownership-transfer feature was rejected because no accepted requirement or user flow defines consent, notification, or invitation consequences for transfer. Trusting a client-side owner guard was rejected because clients are not an authorization boundary.

### 2. One viewer predicate governs every party list and detail path

Public parties are visible anonymously. Private parties use D007's host/invitee/joined viewer set across direct detail reads and all search, filter, and sort branches. The invitation lifecycle decides which invitation states qualify; this change does not silently answer Q003.

Keeping separate visibility logic for legacy query branches was rejected because query shape must not change access rights. Returning private metadata and relying on clients to hide it was rejected because denial must occur before disclosure.

### 3. Lifecycle mutations validate the complete state before side effects

Create and update validate individual fields and cross-field invariants before persistence, invitation changes, or notifications. Coordinates are a pair with geographic ranges; the browser may geocode an address before submission, but the API accepts the resolved coordinate pair. Unsupported non-empty visibility values fail rather than becoming public. Optional age and capacity values are validated as metadata.

Partial persistence was rejected because a failed mutation could otherwise change ownership, location, invitations, or notifications independently. Silently normalizing arbitrary visibility strings to public was rejected because it changes user intent. Admission enforcement from age/capacity was deferred to Q004 and Group 5 because lifecycle evidence only establishes storage, display, and filtering.

### 4. Canonical CRUD uses the plural party resource

The shared contract uses `/api/parties` and `/api/parties/{id}` with GET, POST, PUT, and DELETE according to operation. Browser and iOS callers use bearer identity for mutations and viewer-dependent reads. Singular paths and a POST-based update helper are compatibility defects, not alternate accepted APIs.

Retaining aliases indefinitely was rejected because no accepted compatibility promise establishes them. The exact implementation migration or temporary redirect policy remains a later bounded application/API change.

### 5. Clients preserve fields outside their editing surface

A client that exposes only a subset of mutable fields must round-trip existing valid values or use an update contract that leaves omitted fields unchanged. It must not force public visibility, a default theme, current timestamps, empty invitations, or other defaults over stored values the user did not edit.

Requiring identical browser and iOS controls was rejected because the accepted baseline permits platform-specific scope. Allowing destructive defaults was rejected because it makes an unrelated edit alter visibility and party meaning.

## Risks / Trade-offs

- [Exact lifecycle validation can reject payloads the current backend accepts] → Treat this as an intentional contract tightening and implement it later with field-level compatibility tests and clear client errors.
- [Full-update clients may omit fields or carry stale values] → Preserve unedited values explicitly and reconcile partial-versus-replacement wire semantics in Group 11 before application rollout.
- [Invitation status still affects private visibility] → Reference Q003 and have Group 5 define revocation, decline, and reinvitation without weakening D007.
- [Route correction can expose dormant callers] → Use the Group 4 client call-site inventory and Group 11 API matrix before removing or redirecting any legacy path.
- [Existing stored records may violate new invariants] → Audit data in a separate implementation change and define migration behavior before enforcing constraints on existing rows.

## Migration Plan

1. Validate this child change strictly and review its complete modified requirement blocks against the current main party spec.
2. On a later explicit apply request, sync the delta into `party-discovery-and-management` and update coverage, access, decision, gap, runbook, and handoff records.
3. Mark umbrella 4.4 complete only after the integrated main spec and traceability checks pass.
4. Implement backend authorization/validation and client compatibility fixes through separate bounded changes with runtime tests and data review.

Rollback for this planning stage is removal of this unarchived child change. After integration, restore prior main behavior only through a reviewed follow-up delta rather than silently deleting accepted lifecycle rules.

## Open Questions

- Q003 remains for declined, revoked, and renewed invitation effects on private visibility.
- Q004 remains for admission-time enforcement of age and capacity metadata.
- Q010 remains for `can-edit`, roster, count, statistics, and invitation-detail exposure beyond the lifecycle visibility floor.
- Group 11 must choose final response envelopes, status codes, update wire semantics, and any temporary route migration behavior consistent with this contract.
