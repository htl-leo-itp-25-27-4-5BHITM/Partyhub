## Why
Only the bring-along list updated live. New notifications, follow requests, follower counts, dashboard numbers and gallery photos appeared only after polling (5–15 s) or a manual reload.

## What Changes
- New authenticated stream `GET /api/live/events` (server-sent events, one per tab). After a committed change the server sends the affected user `changed` with a kind: `notifications`, `follows` or `attendance`; no data, clients refetch.
- Notifications page and the inbox badge update immediately; the dashboard reloads the shown range on `follows`/`attendance`; the own profile updates follower counts and the follow button on `follows`.
- Gallery: re-checks every 10 s while visible and redraws only when the photos changed (never while a photo is open or an upload runs).
- Polling stays as a fallback; the notifications page polls every 30 s instead of 5 s while the stream is connected.

## Capabilities
### New Capabilities
None.

### Modified Capabilities
- `social-and-notifications`: live notification and follow updates.
- `host-dashboard`: dashboard refreshes live.
- `party-media-gallery`: open gallery shows new photos without reload.

## Impact
- Backend: `at.htl.live` (`UserChanged`, `UserEvents`, `LiveResource`); events fired in `NotificationRepository`, `FollowRepository`, `HistoryRecorder`. No database change.
- Frontend: `nav.js` (stream), `notifications.js`, `dashboard.js`, `profile.js`, `gallery.js`; asset versions.
