## Why
Three problems around followers: declining a follow request failed with 404 (the endpoint ignored the follower id) and removing a follower was impossible; any logged-in user could read anyone's pending follow requests; and the dashboard counted a follower who left and came back as both gained and lost.

## What Changes
- `DELETE /api/users/{id}/followers/{followerId}`: the follower may unfollow / withdraw, the followed user may decline / remove; everyone else gets 403.
- `GET /api/users/{id}/follow-requests`: only for `{id}` = caller (403 otherwise).
- New `GET /api/users/{id}/follow-status` → the caller's own relationship (`following`, `pending`, `none`); profile pages use it instead of reading other users' requests.
- Profile: "Remove" button per follower on the own followers list.
- Dashboard: followers counted by net change per follower in the range.

## Capabilities
### New Capabilities
None.

### Modified Capabilities
- `host-dashboard`: net follower counting.
- `social-and-notifications`: follower removal / declining in the browser, own follow status read, pending inbox only for its recipient (spec already required the latter; implementation now matches).

## Impact
- Backend: `UserResource`, `FollowRepository`, `DashboardService`. No database change.
- Frontend: `profile.js/css`, `backend-functions.js`, version bumps on pages that load it.
