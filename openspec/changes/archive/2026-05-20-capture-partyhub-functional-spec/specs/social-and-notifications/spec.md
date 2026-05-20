## ADDED Requirements

### Requirement: Social relationships use a follow-request model
The system SHALL use a follow-request and acceptance model rather than direct unconditional following, and an accepted follow request SHALL create a one-way follow relationship.

#### Scenario: User initiates a follow
- **WHEN** a user requests to follow another user
- **THEN** the system SHALL create a follow request instead of immediately creating a direct follow relationship

#### Scenario: Recipient accepts a follow request
- **WHEN** the target user accepts a pending follow request
- **THEN** the system SHALL create an accepted one-way follow relationship from the requester to the recipient

#### Scenario: Mutual contact is evaluated
- **WHEN** the system determines whether two users are mutual contacts
- **THEN** it SHALL require accepted one-way follow relationships in both directions between those users

### Requirement: Private party invitations are limited to mutual contacts
The system SHALL allow private-party invitations only for mutual contacts, where mutual contacts are users who follow each other through accepted one-way follow relationships.

#### Scenario: Host selects private invitees
- **WHEN** a host opens the private-party invitation selector
- **THEN** the system SHALL allow selection only from users who have a mutual accepted follow relationship with the host

#### Scenario: Backend receives private invite for non-mutual user
- **WHEN** a private-party create or update request includes an invitee who is not a mutual contact of the host
- **THEN** the backend SHALL reject that invitation

### Requirement: Notification center is the primary action surface for invites and follow requests
The system SHALL use the notification center as the primary place where users review and act on private-party invitations, follow requests, follow-acceptance messages, party update messages, and party cancellation messages.

#### Scenario: User receives a party invitation
- **WHEN** a user is invited to a private party
- **THEN** the system SHALL surface that invitation in the notification center

#### Scenario: User receives a follow request
- **WHEN** another user requests to follow them
- **THEN** the system SHALL surface that request in the notification center

#### Scenario: User receives party change notification
- **WHEN** a party relevant to a user is updated or cancelled
- **THEN** the system SHALL surface the update or cancellation in the notification center

#### Scenario: User manages notification state
- **WHEN** a user marks a notification as read or deletes a notification
- **THEN** the system SHALL persist the requested notification state change

### Requirement: Profiles support social discovery and party context
The system SHALL allow users to search for other users, open profiles, and view party-related context associated with those users.

#### Scenario: User searches for another user
- **WHEN** a user searches for another user by supported profile identifiers
- **THEN** the system SHALL return matching users and allow navigation to the selected profile

#### Scenario: User views another profile
- **WHEN** a user opens another user’s profile
- **THEN** the system SHALL show social relationship context and party-related context available for that profile

#### Scenario: Profile-created parties are listed
- **WHEN** a user views parties created by another user from that user's profile
- **THEN** the system SHALL show public parties and private parties to which the viewing user was invited
