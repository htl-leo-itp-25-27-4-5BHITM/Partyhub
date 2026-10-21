# Proposal

## Why

On the party detail page, "Withdraw" removes a member's whole pledge at once. Someone who pledged 3 packs and can only bring 2 has to withdraw everything and pledge again. Guests expect "Withdraw" to give back one unit at a time.

## What Changes

- The "Withdraw" button on the detail page lowers the member's own pledge by one. When the pledge is 1, pressing it removes the pledge.
- Each press frees one unit for the other members and updates open pages live, as before.
- The API stays unchanged: lowering uses `PUT …/pledge` with the quantity minus one, the last unit uses `DELETE …/pledge`. `DELETE` still removes a whole pledge for other clients.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `party-bring-along-list`: the detail-page withdraw control removes one unit per press instead of the whole pledge.

## Impact

- Web frontend only: `advancedPartyInfos/bringAlong.js` (and its cache-busting version in `advancedPartyInfos.html`).
- No backend, database or API contract changes.
