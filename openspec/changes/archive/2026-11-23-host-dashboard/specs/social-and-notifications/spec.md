# Spec Delta

## ADDED Requirements

### Requirement: Accepted follow changes are recorded as history
PartyHub SHALL record a timestamped follow-history entry when a follow request is accepted and when an accepted follow relationship is removed by either the follower or the followed user. Each entry SHALL identify the follower, the followed user, whether the follow started or ended, and the time. Pending requests, rejected requests and no-op actions SHALL NOT create entries. Follow history SHALL only be exposed as aggregated counts to the followed user.

#### Scenario: Follow request is accepted
- **WHEN** user B accepts user A's pending follow request
- **THEN** the system SHALL record one entry that A started following B at the time of acceptance

#### Scenario: Accepted follower is removed
- **WHEN** user A stops following B, or B removes follower A, from an accepted relationship
- **THEN** the system SHALL record one entry that A stopped following B at that time

#### Scenario: Pending request is rejected
- **WHEN** user B rejects user A's pending follow request
- **THEN** the system SHALL NOT record a follow-history entry

## MODIFIED Requirements

### Requirement: Profile and social reads use audience-specific projections
PartyHub SHALL return explicit audience-specific profile projections rather than serializing internal user records. A cross-user profile SHALL include only the numeric profile reference, display name, distinct handle, biography, profile-picture reference or placeholder, and accepted follower/following counts. An authenticated self projection MAY additionally include provider username, email, phone number, gender and birth date. Keycloak subject links, device tokens and other internal fields SHALL NOT be returned by profile search, profile reads, relationship status, follow lists or pending-request reads. Gender and birth date SHALL NOT appear in any projection other than the self projection.

#### Scenario: Search returns a bounded profile summary
- **WHEN** an authenticated user searches for profiles
- **THEN** each result SHALL contain only the profile reference, display name, distinct handle and profile-picture reference or placeholder needed for selection

#### Scenario: Cross-user profile is returned
- **WHEN** an authenticated user reads another user's profile
- **THEN** the response SHALL use the bounded cross-user projection
- **AND** it SHALL exclude email, phone number, gender, birth date, provider username, Keycloak subject and device token

#### Scenario: Self profile is returned
- **WHEN** an authenticated user reads their own profile
- **THEN** the response MAY include that user's provider username, email, phone number, gender and birth date in addition to the cross-user fields
- **AND** it SHALL exclude Keycloak subject and device token

#### Scenario: Accepted follow list is returned
- **WHEN** an authenticated profile viewer requests accepted followers or following users
- **THEN** the system SHALL return only accepted relationships and a bounded cross-user profile projection for each listed user

#### Scenario: Pending follow requests are read
- **WHEN** an authenticated user requests their pending incoming follow requests
- **THEN** the system SHALL return only requests addressed to that user using bounded requester summaries
- **AND** another user SHALL NOT read that pending inbox by changing a path identifier

#### Scenario: Relationship status is read
- **WHEN** an authenticated user requests follow status with a target user
- **THEN** the system SHALL report only the caller's directed relationship to that target
- **AND** path or query identifiers SHALL NOT authorize inspection as another actor

### Requirement: Authenticated users manage only their own editable profile
PartyHub SHALL allow an authenticated user to update only their own display name, distinct handle, email, phone number, biography, gender and birth date. Gender and birth date SHALL be optional; gender SHALL be one of male, female, diverse or not specified, and a birth date SHALL lie in the past. Database ID, provider username, Keycloak subject, device token and other internal fields SHALL remain outside profile editing. The distinct handle SHALL identify at most one profile.

#### Scenario: User updates their editable profile fields
- **WHEN** an authenticated user submits valid editable values for their own profile
- **THEN** the system SHALL persist those values and return the updated self profile projection

#### Scenario: User leaves gender and birth date empty
- **WHEN** an authenticated user saves their profile without gender or birth date
- **THEN** the system SHALL accept the update and store no value for the empty fields

#### Scenario: User submits a birth date in the future
- **WHEN** an authenticated user submits a birth date that is not in the past
- **THEN** the system SHALL reject the update without partially changing the stored profile

#### Scenario: User attempts to update another profile
- **WHEN** an authenticated user targets another user's profile for an update
- **THEN** the system SHALL reject the update without changing that profile

#### Scenario: Update includes an internal or immutable field
- **WHEN** a profile update attempts to change the database ID, provider username, Keycloak subject, device token or another non-editable field
- **THEN** the system SHALL reject or ignore that field without changing the protected value

#### Scenario: Distinct handle conflicts with another profile
- **WHEN** a user selects a distinct handle already assigned to another profile
- **THEN** the system SHALL reject the conflicting update and preserve the user's previous handle

#### Scenario: Profile update fails validation
- **WHEN** any submitted editable value fails the accepted profile validation contract
- **THEN** the system SHALL reject the update without partially changing the stored profile
