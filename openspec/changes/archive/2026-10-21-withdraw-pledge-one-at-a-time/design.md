# Design

## Context

See proposal.md. The detail page's `withdrawPledge(item)` sends `DELETE …/items/{id}/pledge`, which removes the whole pledge. `PUT …/pledge` already upserts the caller's pledge and never counts the caller's own previous quantity against the limit, so lowering by one can never be rejected with 409.

## Goals / Non-Goals

**Goals:** one unit per press, no API change.
**Non-Goals:** changing the meaning of `DELETE …/pledge` (other clients and the wizard rely on "remove whole pledge").

## Decisions

- **Client-side decrement**: `own.quantity > 1` → `PUT` with `own.quantity - 1`; otherwise `DELETE`. Rejected: a new `POST …/pledge/decrement` endpoint – more API surface for what one existing call already does.
- **Label**: "Withdraw 1" with `aria-label="Withdraw one {name}"`, so the button says what it does. The quantity input and "Update" stay for larger changes.
- **Stale value**: the decrement uses the quantity from the last loaded list. Because only the member changes their own pledge, the only staleness is a double-click; the button is disabled while the request runs.

## Risks / Trade-offs

- [Two tabs of the same user] → each press is still based on the latest list after the live refresh; worst case one extra unit is withdrawn, which the user sees immediately.
