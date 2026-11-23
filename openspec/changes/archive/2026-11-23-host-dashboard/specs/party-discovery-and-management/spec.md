# Spec Delta

## ADDED Requirements

### Requirement: Attendance changes are recorded as history
When a user's attendance at a party is committed (join or accepted invitation) or removed (leave), PartyHub SHALL record a timestamped attendance-history entry identifying the party, the user, whether the user joined or left, and the time. Failed, denied or no-op attendance actions SHALL NOT create entries. Attendance that existed before history was recorded SHALL remain valid without an entry. Attendance history SHALL only be exposed as aggregated statistics to the party's host.

#### Scenario: User joins a party
- **WHEN** an authenticated user successfully joins a party or accepts an invitation by joining
- **THEN** the system SHALL record one entry that the user joined that party at that time

#### Scenario: User leaves a party
- **WHEN** an attending user leaves a party
- **THEN** the system SHALL record one entry that the user left that party at that time

#### Scenario: Join is denied
- **WHEN** a join is rejected because of capacity, age or missing invitation
- **THEN** the system SHALL NOT record an attendance-history entry
