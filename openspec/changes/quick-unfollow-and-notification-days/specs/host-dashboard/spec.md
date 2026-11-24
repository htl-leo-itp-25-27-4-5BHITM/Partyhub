# Spec Delta

## MODIFIED Requirements

### Requirement: Dashboard reports host activity metrics
For the selected range the dashboard SHALL report: the number of parties the caller created; the number of followers gained and lost; the number of joins to parties the caller hosts; parties and joins split by private and public visibility; invitation outcomes (accepted, declined, pending) for the caller's parties; capacity utilisation per hosted party with a capacity limit and on average; and the top party. A party belongs to the range when it was created in the range; invitation outcomes, capacity utilisation and the top party refer to the caller's parties that belong to the range. A join belongs to the range when a recorded join to one of the caller's parties happened in the range, even if the guest later left. Followers gained and lost SHALL be counted from recorded follow history in the range. A follow that the same follower undoes (by unfollowing or being removed) within 24 hours SHALL count neither as gained nor as lost, also when the follow happened shortly before the range. The top party SHALL be the party in the range with the most joined guests, with ties broken by the higher number of favorites and then by the more recent creation time.

#### Scenario: Follower gained and lost in the same range
- **WHEN** user A started following the caller and stopped following more than 24 hours later, both within the selected range
- **THEN** the dashboard SHALL count one gained and one lost follower

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
