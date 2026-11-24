# Design

## Decisions
1. **Quick unfollow window = 24 h**, a constant in `DashboardService`. Follow events are loaded from 24 h before the range start, then each FOLLOWED that the same follower undid within the window is dropped together with its UNFOLLOWED, before range filtering. Repeated follow/unfollow cycles are all dropped; a final follow that is not undone still counts. The history itself is not changed.
2. **`follow.requested_at`** (nullable, set in `createFollowRequest`). `/api/users/{id}/follow-requests` returns `FollowRequestDto` = the previous profile summary fields plus `requestedAt`, so existing clients keep working.
3. **Ordering in the browser**: items sort by their time; pending follow requests and pending invitations without a time sort to the top ("Open requests"), other unknown times to the bottom ("Earlier").
4. **Guarded actions**: a per-item busy map survives the 5-second polling redraw; the card's buttons are disabled and the pressed one shows a spinner until the action and the following refresh finished; afterwards the list is redrawn.
5. **Page scroll** like the dashboard: `body.notifications-page` scrolls, the panel does not.
