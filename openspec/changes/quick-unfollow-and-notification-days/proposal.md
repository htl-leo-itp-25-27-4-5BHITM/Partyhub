## Why
Following and immediately unfollowing a host inflates their dashboard. On the notifications page, new follow requests appear at the bottom because they have no time, action buttons can be pressed repeatedly, the inner scroll area shows its own scrollbar, and a long list is hard to scan.

## What Changes
- Dashboard: a follow undone within 24 hours counts neither as gained nor as lost.
- Follows store `requested_at` (migration `V11`); the pending follow-request read returns it.
- Notifications page: newest first including follow requests, one section per day, whole-page scrolling, action buttons disabled with a loading indicator while a request runs.

## Capabilities
### New Capabilities
None.

### Modified Capabilities
- `host-dashboard`: quick follow/unfollow pairs are not counted.
- `social-and-notifications`: follow requests carry their send time; browser notification list ordering, day sections and guarded actions.

## Impact
- Backend: `DashboardService`, `Follow`, `FollowRepository`, `UserResource` (`FollowRequestDto`), migration `V11__follow_requested_at.sql`, dev seed.
- Frontend: `notifications/` page.
