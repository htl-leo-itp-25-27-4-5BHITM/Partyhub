## ADDED Requirements

### Requirement: Home map shows visible parties as the primary discovery experience
The system SHALL present visible parties on the home map as the primary party discovery experience.

#### Scenario: Anonymous user opens the home map
- **WHEN** a user without active user context opens the home map
- **THEN** the system SHALL show public parties that are visible without authentication

#### Scenario: Authenticated user opens the home map
- **WHEN** a user with active user context opens the home map
- **THEN** the system SHALL show public parties and any additional visible parties the user hosts, is invited to, or has already joined

### Requirement: Core party discovery excludes live location features
The system SHALL define core party discovery in terms of visible-party map discovery and SHALL NOT require nearby filtering, live attendee locations, or live current-user location features.

#### Scenario: Core discovery baseline is defined
- **WHEN** the product baseline for the home map is described
- **THEN** it SHALL require visible-party discovery without depending on nearby filtering or live location features

#### Scenario: Current time-window filtering is evaluated
- **WHEN** a current implementation filters map parties by a fixed time window such as the next 14 days
- **THEN** that filtering SHALL be treated as an implementation detail unless a future product change explicitly defines it as required behavior

### Requirement: Party details expose the selected party context
The system SHALL allow a visible party selected from discovery surfaces to be opened in a detail view that presents the party's essential context.

#### Scenario: User opens party details from the map
- **WHEN** a user selects a visible party from the home map
- **THEN** the system SHALL open the party detail view for that party

#### Scenario: Party detail metadata is shown
- **WHEN** a user has access to a party detail view
- **THEN** the system SHALL show the party's location, date or time information, description, and theme where that information is available

### Requirement: Private party visibility is restricted
The system SHALL restrict private party visibility to the host, invited users, and users who have already joined the party.

#### Scenario: Non-invited user requests a private party
- **WHEN** a user who is not the host, not invited, and not already joined requests a private party
- **THEN** the system SHALL deny access to that private party

### Requirement: Users can create and manage parties
The system SHALL allow a user to create, edit, and delete parties they host.

#### Scenario: Host creates a party
- **WHEN** a host submits valid party data
- **THEN** the system SHALL create the party with the submitted attributes and assign the submitting user as host

#### Scenario: Host submits party attributes
- **WHEN** a host creates or updates a party
- **THEN** the system SHALL support party attributes including title, description, start and end time, address or location coordinates, visibility, and optional party metadata such as theme or capacity where supported

#### Scenario: Host edits a party
- **WHEN** a host updates a party they own
- **THEN** the system SHALL persist the updated party details and related invitation changes

#### Scenario: Host deletes a party
- **WHEN** a host deletes a party they own
- **THEN** the system SHALL remove the party and notify relevant recipients according to party notification rules

### Requirement: Private party invitees are enforced as mutual contacts
The system SHALL enforce that private-party invitations can only be created for mutual contacts, where mutual contacts are users who follow each other through accepted one-way follow relationships.

#### Scenario: Host invites mutual contact to private party
- **WHEN** a host creates or updates a private party and selects an invitee who has a mutual contact relationship with the host
- **THEN** the system SHALL allow the invitation to be created or retained

#### Scenario: Host invites non-mutual user to private party
- **WHEN** a host creates or updates a private party and includes an invitee who is not a mutual contact
- **THEN** the backend SHALL reject that private-party invitation

### Requirement: Invitation acceptance happens through party attendance
The system SHALL model invitation acceptance through joining or attending the party.

#### Scenario: Invited user joins a party
- **WHEN** a user with a pending invitation joins the invited party
- **THEN** the system SHALL mark that invitation as accepted

#### Scenario: Invited user leaves a previously accepted party
- **WHEN** a user leaves a party for which their invitation had been accepted
- **THEN** the system SHALL update the invitation state to declined
