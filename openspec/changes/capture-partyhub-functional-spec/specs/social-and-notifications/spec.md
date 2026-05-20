## ADDED Requirements

### Requirement: Social relationships use a follow-request model
The system SHALL use a follow-request and acceptance model rather than direct unconditional following.

#### Scenario: User initiates a follow
- **WHEN** a user requests to follow another user
- **THEN** the system SHALL create a follow request instead of immediately creating a direct follow relationship

#### Scenario: Recipient accepts a follow request
- **WHEN** the target user accepts a pending follow request
- **THEN** the system SHALL create an accepted follow relationship

### Requirement: Private party invitations are limited to mutual contacts
The system SHALL allow private-party invitations only for mutual contacts, where mutual contacts are users who follow each other.

#### Scenario: Host selects private invitees
- **WHEN** a host opens the private-party invitation selector
- **THEN** the system SHALL allow selection only from users who have a mutual accepted follow relationship with the host

### Requirement: Notification center is the primary action surface for invites and follow requests
The system SHALL use the notification center as the primary place where users review and act on private-party invitations and follow requests.

#### Scenario: User receives a party invitation
- **WHEN** a user is invited to a private party
- **THEN** the system SHALL surface that invitation in the notification center

#### Scenario: User receives a follow request
- **WHEN** another user requests to follow them
- **THEN** the system SHALL surface that request in the notification center

### Requirement: Profiles support social discovery and party context
The system SHALL allow users to search for other users, open profiles, and view party-related context associated with those users.

#### Scenario: User searches for another user
- **WHEN** a user searches for another user by supported profile identifiers
- **THEN** the system SHALL return matching users and allow navigation to the selected profile

#### Scenario: User views another profile
- **WHEN** a user opens another user’s profile
- **THEN** the system SHALL show social relationship context and party-related context available for that profile
