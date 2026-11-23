## Why
Hosts have no way to see how their parties and their profile develop over time. They cannot tell how many people joined, whether they gain or lose followers, or who their guests are. A personal dashboard on the website answers this for a selected time range.

## What Changes
- New browser page `dashboard/` with a time-range selector (7 days, 30 days, 3 months, 6 months), KPI tiles and one chart whose metric is switched via a dropdown.
- New authenticated endpoint `GET /api/dashboard?range=7d|30d|3m|6m` returning only the caller's own host statistics: parties created, followers gained/lost, joins to own parties, private vs. public split, guest gender distribution, guest age distribution, invitation outcome rates, capacity utilisation, top party and a time series for gains/losses/joins.
- Follow history: accepting a follow and removing an accepted follow (by either side) records a timestamped follow event, so gained and lost followers can be counted per time range.
- Attendance history: joining and leaving a party records a timestamped attendance event, so joins can be counted per time range.
- Profile: two new optional self-managed fields, gender (`MALE`, `FEMALE`, `DIVERSE`, `NOT_SPECIFIED`) and birth date. They appear only in the self profile projection, never in cross-user projections.
- Privacy: gender and age distributions are aggregated and shown only when at least 5 guests in the range provided that value.
- One Flyway migration (`V9`) for `follow_event`, `attendance_event`, `users.gender`, `users.birth_date`; dev seed data for all of them.

## Capabilities
### New Capabilities
- `host-dashboard`: Authenticated host statistics for a selected time range, their privacy thresholds and the browser dashboard page.

### Modified Capabilities
- `social-and-notifications`: Self profile projection and profile editing gain optional gender and birth date; follow acceptance and removal of accepted follows are recorded as timestamped history.
- `party-discovery-and-management`: Joining and leaving a party are recorded as timestamped attendance history.

## Impact
- Backend: new `at.htl.dashboard` package (resource, service, DTOs), new `FollowEvent` and `AttendanceEvent` entities, changes in follow accept/remove and party join/leave, `User`, `ProfileDto` and the profile update DTO.
- Database: migration `V9__host_dashboard.sql`, seed data in `dev-seed/afterMigrate.sql`.
- Frontend: new `META-INF/resources/dashboard/` page, link in `nav.js`, gender/birth-date fields in `editProfile`.
- Statistics based on follow events and join times start at deployment; older follows and joins have no timestamp and are not counted in time ranges.
- iOS is not affected (new profile fields are optional; existing responses only gain fields in the self projection).
