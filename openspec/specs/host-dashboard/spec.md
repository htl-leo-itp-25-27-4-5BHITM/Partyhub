# host-dashboard Specification

## Purpose
Gives an authenticated host a personal dashboard with statistics about their parties, guests and followers for a selected time range, without exposing data about individual guests.

## Requirements

### Requirement: Dashboard statistics are self-scoped and authenticated
PartyHub SHALL provide host dashboard statistics only to an authenticated caller and only about that caller. The acting user SHALL be derived from the validated access token; no path, query or body identifier SHALL select another user's statistics. Statistics SHALL be read-only and SHALL NOT change any stored state.

#### Scenario: Anonymous caller requests the dashboard
- **WHEN** a caller without a valid access token requests dashboard statistics
- **THEN** the system SHALL reject the request as unauthenticated

#### Scenario: Caller tries to read another user's statistics
- **WHEN** an authenticated user adds another user's identifier to a dashboard request
- **THEN** the system SHALL ignore it and return only the caller's own statistics

### Requirement: Dashboard time ranges are fixed presets
The dashboard SHALL support exactly the time ranges 7 days, 30 days, 3 months and 6 months, each ending at the time of the request. The 7- and 30-day ranges SHALL start at the beginning of the day 6 or 29 days before the request day, so they cover exactly 7 or 30 calendar days including today. The 3- and 6-month ranges SHALL start at the beginning of the Monday of the week that contains the date 3 or 6 months before the request. Requests with any other range SHALL be rejected as invalid input. When no range is given, 30 days SHALL be used.

#### Scenario: Supported range is requested
- **WHEN** an authenticated user requests the 3-month range
- **THEN** every time-based statistic SHALL cover the period from the Monday of the week three months before the request until the request

#### Scenario: Unsupported range is requested
- **WHEN** an authenticated user requests a range outside the four presets
- **THEN** the system SHALL reject the request with a validation error and no statistics

### Requirement: Dashboard reports host activity metrics
For the selected range the dashboard SHALL report: the number of parties the caller created; the number of followers gained and lost; the number of joins to parties the caller hosts; parties and joins split by private and public visibility; invitation outcomes (accepted, declined, pending) for the caller's parties; capacity utilisation per hosted party with a capacity limit and on average; and the top party. A party belongs to the range when it was created in the range; invitation outcomes, capacity utilisation and the top party refer to the caller's parties that belong to the range. A join belongs to the range when a recorded join to one of the caller's parties happened in the range, even if the guest later left; each guest SHALL count at most once per party and range, at their first join in the range. Followers gained and lost SHALL be counted from recorded follow history in the range. A follow that the same follower undoes (by unfollowing or being removed) within 24 hours SHALL count neither as gained nor as lost, also when the follow happened shortly before the range. Each follower SHALL count at most once as gained (at their first remaining follow in the range) and at most once as lost (at their last remaining unfollow in the range), so repeated or duplicate history entries of the same person are not counted several times. The top party SHALL be the party in the range with the most joined guests, with ties broken by the higher number of favorites and then by the more recent creation time.

#### Scenario: Follower gained and lost in the same range
- **WHEN** user A started following the caller and stopped following more than 24 hours later, both within the selected range
- **THEN** the dashboard SHALL count one gained and one lost follower

#### Scenario: Same follower recorded many times
- **WHEN** the history contains 22 follows of user A to the caller in the selected range, without unfollows in between
- **THEN** the dashboard SHALL count A as one gained follower

#### Scenario: Guest joins the same party repeatedly
- **WHEN** guest G joined, left and joined the caller's party P again within the selected range
- **THEN** the dashboard SHALL count one join of G to P

#### Scenario: Follow undone right away
- **WHEN** user A follows the caller and unfollows again within 24 hours
- **THEN** the dashboard SHALL count neither a gained nor a lost follower for it

#### Scenario: Join without recorded history
- **WHEN** a guest joined one of the caller's parties before attendance history was recorded
- **THEN** that join SHALL NOT be counted in any time range but SHALL still count towards current capacity utilisation

#### Scenario: Party without capacity limit
- **WHEN** a hosted party has no maximum number of guests
- **THEN** it SHALL be excluded from capacity utilisation

#### Scenario: Caller hosted nothing in the range
- **WHEN** the caller created no parties and received no joins in the range
- **THEN** the dashboard SHALL return zero counts, no top party and empty distributions instead of an error

### Requirement: Dashboard provides a time series
The dashboard SHALL return followers gained, followers lost and joins per time bucket over the selected range. Buckets SHALL be days for 7 and 30 days and weeks for 3 and 6 months. Buckets without activity SHALL be included with zero values.

#### Scenario: Quiet days in the range
- **WHEN** no follow or join activity happened on some days of a 7-day range
- **THEN** the time series SHALL contain all 7 days, with zeros for the quiet days

### Requirement: Guest demographics are aggregated with a privacy threshold
The dashboard SHALL report the gender distribution and the age-group distribution (under 18, 18–20, 21–24, 25–29, 30 and older) of distinct guests who joined the caller's parties in the range, as percentages. Each distribution SHALL only use guests who provided that value. A distribution SHALL be withheld, and marked as having too few data points, when fewer than 5 distinct guests provided the value. The dashboard SHALL NOT expose which guest has which gender or age.

#### Scenario: Enough guests provided their gender
- **WHEN** 8 distinct guests in the range provided a gender, 4 male, 3 female and 1 diverse
- **THEN** the dashboard SHALL report 50 % male, 37.5 % female and 12.5 % diverse

#### Scenario: Too few guests provided a value
- **WHEN** only 3 distinct guests in the range provided a birth date
- **THEN** the age distribution SHALL be withheld and marked as having too few data points

### Requirement: Browser dashboard page
The browser SHALL provide a dashboard page for authenticated users, reachable from the main navigation. It SHALL offer the four time ranges, show the key counts as tiles and show one chart whose metric is selected from a dropdown. Changing the range or the metric SHALL update the page without a full reload. Withheld distributions SHALL show an explanatory message instead of a chart.

#### Scenario: User switches the chart metric
- **WHEN** the user selects a different metric in the dropdown
- **THEN** the chart SHALL show that metric for the currently selected range

#### Scenario: Unauthenticated visitor opens the page
- **WHEN** a visitor without a session opens the dashboard page
- **THEN** the browser SHALL send them to login instead of showing statistics

### Requirement: Earlier activity is reconstructed from notifications
PartyHub SHALL once add follow and attendance history for activity before history was recorded, using only notifications that identify the acting user, the affected user or party, the kind of event and its time: an accepted follow notification counts as the follower starting to follow the recipient; a host notification that a guest accepted an invitation counts as that guest joining the party; a host notification that a guest left counts as that guest leaving the party. A reconstructed entry SHALL use the notification's creation time and SHALL NOT duplicate an entry already recorded for the same users, party, kind and time. Activity without such a notification SHALL stay unrecorded rather than be estimated.

#### Scenario: Old accepted follow
- **WHEN** a notification from before history recording says user A follows user B now
- **THEN** the dashboard of B SHALL count A as a gained follower at that notification's time

#### Scenario: Old accepted invitation
- **WHEN** a host has a notification from before history recording that guest G accepted the invitation to party P
- **THEN** the host's dashboard SHALL count a join of G to P at that notification's time

#### Scenario: Activity already recorded live
- **WHEN** a follow or join was already recorded by the live history at the same time as its notification
- **THEN** the reconstruction SHALL NOT add a second entry for it

#### Scenario: Activity without a notification
- **WHEN** a guest joined a public party without an invitation, or a follower was removed, before history was recorded
- **THEN** that activity SHALL NOT appear in any time range
