# social-and-notifications Specification

## Purpose
Defines PartyHub's social graph and notification behavior, including one-way follow requests, mutual-contact evaluation, private-party invite eligibility, notification-center actions, profile search, and profile party visibility.

## Requirements

### Requirement: Social relationships use a follow-request model
The system SHALL model each follow as an independent directed relationship from an authenticated requester/follower to a different target/recipient. A new request SHALL begin as pending, only its recipient SHALL accept or reject it, and acceptance SHALL create one accepted one-way relationship without creating the reverse relationship. Mutual contact SHALL require accepted relationships in both directions.

#### Scenario: User initiates a follow
- **WHEN** authenticated user A requests to follow different user B and no A-to-B relationship exists
- **THEN** the system SHALL create one pending A-to-B follow request instead of an accepted or reverse relationship

#### Scenario: Recipient accepts a follow request
- **WHEN** target user B accepts A's pending A-to-B follow request
- **THEN** the system SHALL change that request to one accepted A-to-B relationship
- **AND** it SHALL NOT create or accept B-to-A automatically

#### Scenario: Mutual contact is evaluated
- **WHEN** the system determines whether users A and B are mutual contacts
- **THEN** it SHALL require accepted A-to-B and B-to-A relationships
- **AND** a pending or missing direction SHALL make mutual contact false

#### Scenario: User attempts to follow themselves
- **WHEN** authenticated user A requests an A-to-A follow
- **THEN** the system SHALL reject the request without creating a relationship

#### Scenario: Pending request is repeated
- **WHEN** A requests B while one pending A-to-B request already exists
- **THEN** the system SHALL keep the single pending relationship without creating a duplicate

#### Scenario: Accepted request is repeated
- **WHEN** A requests B while an accepted A-to-B relationship already exists
- **THEN** the system SHALL keep that accepted relationship without creating a duplicate or changing it to pending

#### Scenario: Non-recipient attempts acceptance
- **WHEN** a user other than B attempts to accept A's pending request to B
- **THEN** the system SHALL reject the action and leave the relationship pending

#### Scenario: Requester cancels a pending request
- **WHEN** requester A cancels the pending A-to-B request
- **THEN** the system SHALL remove A-to-B and leave B-to-A unchanged

#### Scenario: Recipient rejects a pending request
- **WHEN** recipient B rejects the pending A-to-B request
- **THEN** the system SHALL remove A-to-B and leave B-to-A unchanged

#### Scenario: Follower stops following
- **WHEN** follower A removes their accepted A-to-B relationship
- **THEN** the system SHALL remove A-to-B and leave B-to-A unchanged

#### Scenario: Recipient removes a follower
- **WHEN** recipient B removes accepted follower A
- **THEN** the system SHALL remove A-to-B and leave B-to-A unchanged

#### Scenario: One direction is removed from a mutual contact
- **WHEN** A-to-B and B-to-A are accepted and either directed relationship is removed
- **THEN** the users SHALL no longer be mutual contacts
- **AND** the other accepted direction SHALL remain unchanged

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
PartyHub SHALL provide authenticated profile discovery and party context through shared backend contracts with explicit client scope. The browser SHALL support profile search, another-user profile navigation, social actions and profile party context. The iOS minimum SHALL support the authenticated user's own profile and accepted follower/following counts; browser-only social controls SHALL NOT imply iOS parity.

#### Scenario: User searches for another user
- **WHEN** an authenticated user searches by a supported profile identifier
- **THEN** the system SHALL search the distinct profile handle case-insensitively and return matching bounded profile summaries
- **AND** it SHALL allow navigation to the selected profile

#### Scenario: User views another profile
- **WHEN** an authenticated user opens another user's profile
- **THEN** the system SHALL show the bounded cross-user profile projection and accepted social relationship context available to that viewer

#### Scenario: Profile-created parties are listed
- **WHEN** an authenticated user views parties created by another user from that user's profile
- **THEN** the system SHALL show public parties and private parties to which the viewing user was invited
- **AND** opening the profile SHALL NOT grant additional private-party access

#### Scenario: User views their own created parties
- **WHEN** an authenticated user views the party context on their own profile
- **THEN** the system SHALL show the parties they host that are available under the party visibility contract

#### Scenario: Anonymous caller requests profile discovery
- **WHEN** a caller without an authenticated PartyHub session searches for users or requests profile/social data
- **THEN** the system SHALL reject the profile/social request without returning user or relationship data

#### Scenario: iOS user opens their own profile
- **WHEN** an authenticated iOS user opens the profile surface
- **THEN** the client SHALL show the backend-resolved self profile and accepted follower/following counts
- **AND** the absence of cross-user search or follow controls SHALL NOT be treated as a failure of this iOS minimum

### Requirement: Profile and social reads use audience-specific projections
PartyHub SHALL return explicit audience-specific profile projections rather than serializing internal user records. A cross-user profile SHALL include only the numeric profile reference, display name, distinct handle, biography, profile-picture reference or placeholder, and accepted follower/following counts. An authenticated self projection MAY additionally include provider username, email and phone number. Keycloak subject links, device tokens and other internal fields SHALL NOT be returned by profile search, profile reads, relationship status, follow lists or pending-request reads.

#### Scenario: Search returns a bounded profile summary
- **WHEN** an authenticated user searches for profiles
- **THEN** each result SHALL contain only the profile reference, display name, distinct handle and profile-picture reference or placeholder needed for selection

#### Scenario: Cross-user profile is returned
- **WHEN** an authenticated user reads another user's profile
- **THEN** the response SHALL use the bounded cross-user projection
- **AND** it SHALL exclude email, phone number, provider username, Keycloak subject and device token

#### Scenario: Self profile is returned
- **WHEN** an authenticated user reads their own profile
- **THEN** the response MAY include that user's provider username, email and phone number in addition to the cross-user fields
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
PartyHub SHALL allow an authenticated user to update only their own display name, distinct handle, email, phone number and biography. Database ID, provider username, Keycloak subject, device token and other internal fields SHALL remain outside profile editing. The distinct handle SHALL identify at most one profile.

#### Scenario: User updates their editable profile fields
- **WHEN** an authenticated user submits valid editable values for their own profile
- **THEN** the system SHALL persist those values and return the updated self profile projection

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
