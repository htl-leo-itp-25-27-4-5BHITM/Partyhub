## Why
The host dashboard only counts follows and joins recorded since it went live, so it looks empty for everything earlier. Older notifications already contain who followed whom and who accepted an invitation or left a party, with a timestamp, so part of that history can be reconstructed.

## What Changes
- One-time Flyway migration `V10` that fills `follow_event` and `attendance_event` from existing notifications created before the dashboard recorded history:
  - "… follows you now." → follower started following the recipient (available since 2026-05-13)
  - "… accepted your invitation to the party …" / "… hat deine Einladung zur Party … angenommen." → guest joined the host's party
  - "… left the party …" / "… hat die Party … verlassen." → guest left the host's party
- Entries that the live recording already wrote are not duplicated.
- The dashboard note says that earlier activity is included where notifications allow it.

Not recoverable (no stored date anywhere): unfollows and removed followers, joins to public parties without an invitation, follows accepted before 2026-05-13, and events whose notification was deleted.

## Capabilities
### New Capabilities
None.

### Modified Capabilities
- `host-dashboard`: history recorded before the dashboard is reconstructed from notifications where possible.

## Impact
- Database: data-only migration `V10__backfill_dashboard_history.sql` (`INSERT … SELECT`, no schema change, no deletion).
- Frontend: dashboard note text.
