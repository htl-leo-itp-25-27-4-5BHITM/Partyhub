## Why
The guest list on the party detail page (joined guests, or invited guests with their status for private parties) only changed after a reload, while the bring-along list on the same page was already live.

## What Changes
- New authenticated stream `GET /api/live/parties/{partyId}/events` for users who may see the party (404 otherwise). It sends `changed` after a committed join, leave or invitation change; the page reloads the guest list and the join button.
- Invitation changes are detected by a JPA entity listener on `Invitation` (insert, update, delete), so every code path is covered; joins and leaves via `HistoryRecorder`.
- Without the stream the page re-checks every 15 s; it never refreshes during the user's own join/leave request.
- Internal: the SSE subscriber handling shared by user and party streams moved into `SseHub`.

## Capabilities
### New Capabilities
None.

### Modified Capabilities
- `party-discovery-and-management`: guest list updates live on the detail page.

## Impact
- Backend: `at.htl.live` (`PartyChanged`, `PartyEvents`, `SseHub`, `LiveResource`), `InvitationChangeListener`, `HistoryRecorder`. No database change.
- Frontend: `advancedPartyInfos.js` and its asset version.
