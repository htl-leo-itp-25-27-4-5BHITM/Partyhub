# Proposal

## Why

The accepted party specification establishes host-managed parties and public/private visibility, but it does not yet define the complete lifecycle field contract, validation failures, immutable ownership, or cross-client compatibility boundary. Source inspection also confirms that the current update path can transfer ownership and that browser/iOS callers contain route and payload drift, so agentic implementation needs a bounded normative contract before application fixes are attempted.

## What Changes

- Complete create, read, update, and delete behavior for anonymous users, hosts, invitees, attendees, and unrelated authenticated users.
- Make the authenticated creator the immutable host and require host authority for every update or deletion.
- Define the lifecycle field model for title, description, time, location, visibility, theme, fee, age bounds, capacity, and website, including atomic validation failures.
- Treat age and capacity as stored/displayable/filterable metadata in this lifecycle change; whether attendance must enforce them remains the explicit Group 5 decision.
- Define the canonical plural party CRUD routes and require browser/iOS callers to preserve fields they do not edit instead of overwriting them with client defaults.
- Preserve the accepted invitation, attendance, discovery, notification, and map-filter semantics for their owning work packages.
- Keep confirmed implementation and client mismatches in the gap register; this change performs documentation/specification work only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `party-discovery-and-management`: Complete party lifecycle authorization, visibility, fields, validation, mutation atomicity, and client/API compatibility while preserving the existing invitation, attendance, discovery, and map rules.

## Impact

The change updates the existing `party-discovery-and-management` specification and baseline traceability for party CRUD routes and browser/iOS lifecycle callers. Later implementation work may affect `PartyResource`, `PartyRepository`, party DTO/model validation, browser party forms/helpers, iOS party list/forms/details/notification polling, and their tests, but this proposal does not edit those application files or require identical client user interfaces.
