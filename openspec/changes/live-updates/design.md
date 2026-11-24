# Design

## Decisions
1. **Same pattern as the bring-along list:** a CDI event fired inside the write transaction, observed `AFTER_SUCCESS`, pushed to in-memory SSE subscribers (single replica), 25 s heartbeat, `X-Accel-Buffering: no`. Events name only the kind of change, so all access checks stay in the existing read endpoints.
2. **Per user, not per page:** one stream per tab opened by `nav.js` (loaded on every page) via `authService.apiCall` with a streaming body (EventSource cannot send the bearer token). Pages listen for the window event `partyhub:live` and debounce their reload (250–800 ms).
3. **Kinds:** `notifications` (notification created/read/deleted, follow request created/withdrawn/declined, invitation notifications removed), `follows` (follow accepted/removed, for both users), `attendance` (join/leave, for the party host).
4. **Gallery polls** instead of streaming: photos are per party and come from other users; a 10 s re-check with a change signature is enough and avoids per-party subscriptions.
5. **Fallbacks:** reconnect with backoff (2 s → 30 s); existing polling stays (notifications 30 s while connected, 5 s otherwise; dashboard 60 s without stream; profile 30 s for other users' profiles).
