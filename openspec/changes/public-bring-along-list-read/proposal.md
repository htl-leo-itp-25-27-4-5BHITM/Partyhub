# Proposal

## Why

A public party is visible to everyone on the platform, even without login, but its bring-along list is hidden from anyone who has not joined. Visitors cannot see what a party still needs before deciding to join, which makes the list less useful than the rest of the public party details.

## What Changes

- The bring-along list of a **public** party becomes readable by everyone who can view the party: anonymous visitors, logged-in users who have not joined, and members.
- Non-members get a **read-only, anonymised** view: item name, unit, required quantity, pledged total, remaining quantity and fulfilled flag, but no pledges and no user data (who brings what stays visible to members only).
- Pledging, item management (add/edit/delete) and the live change stream stay limited to the authenticated host and joined attendees.
- Private parties are unchanged: callers who cannot view the party get "not found", and logged-in viewers who are not members get "forbidden".
- The web party detail page shows the read-only list to non-members of public parties, without pledge controls, with a hint to log in / join to pledge.
- **BREAKING** (API semantics): `GET /api/parties/{id}/bring-along` no longer returns 401 for anonymous callers or 403 for logged-in non-members on public parties; it returns 200 with items whose `pledges` field is absent.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `party-bring-along-list`: read access widens from "members only" to "anyone who can view a public party" with an anonymised view for non-members; the detail-page and live-update requirements are adjusted accordingly.

## Impact

- Backend: `BringAlongResource` (authentication moves from class level to the write/stream endpoints; list endpoint resolves the current user optionally), `BringAlongItemDto` (pledges omitted for non-members).
- Frontend: `advancedPartyInfos/bringAlong.js` (load and render the read-only list for non-members, no live stream for them).
- Tests: `BringAlongResource` tests for anonymous / non-member reads on public and private parties.
- API contract: `docs/openspec-baseline/api-contract-matrix.md` entry for the list endpoint.
