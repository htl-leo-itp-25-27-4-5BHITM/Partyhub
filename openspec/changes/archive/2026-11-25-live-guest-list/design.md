# Design

## Decisions
1. **Per-party stream**, analogous to the per-user stream: `PartyChanged(partyId)` CDI event observed `AFTER_SUCCESS`, in-memory subscribers, heartbeat. Access: logged-in and `getPartyByIdIfVisible` (same rule as the detail page); guest lists are only shown to logged-in users anyway.
2. **Entity listener for invitations:** invitations are created, renewed, answered and withdrawn in several places (`PartyRepository`, `InvitationRepository`). `@PostPersist/@PostUpdate/@PostRemove` fire `PartyChanged` through `Arc.container().beanManager()`, during flush inside the transaction, so the event is still only delivered after commit.
3. **`SseHub<K>`** holds the subscriber map, send/remove and heartbeat for both `UserEvents` and `PartyEvents`; the bring-along stream is left unchanged.
4. **Frontend** starts everything from the `DOMContentLoaded` handler (the browser regression tests load the script without timers). A refresh is postponed while the user's own join/leave request runs (explicit flag, not the button state: the host's join button is permanently disabled).
