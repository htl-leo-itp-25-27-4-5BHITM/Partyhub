## Why
The dashboard counted history entries instead of people. After the backfill from notifications (V10), a user who followed another user 22 times (unfollows were never notified) appeared as 22 new followers; repeated join/leave of the same party inflated joins the same way.

## What Changes
- Followers gained: each follower at most once per range (first remaining follow); followers lost: at most once (last remaining unfollow). Applied after the 24-hour quick-unfollow rule.
- Joins: each guest at most once per party and range (first join). The private/public split and the timeline use the same deduplicated rows.
- Stored history is unchanged; only counting changes.

## Capabilities
### New Capabilities
None.

### Modified Capabilities
- `host-dashboard`: follower and join counts are per person, not per history entry.

## Impact
- Backend: `DashboardService` only. No database change.
