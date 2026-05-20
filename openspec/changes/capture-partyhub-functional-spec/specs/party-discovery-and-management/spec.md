## ADDED Requirements

### Requirement: Home map shows visible parties as the primary discovery experience
The system SHALL present visible parties on the home map as the primary party discovery experience.

#### Scenario: Anonymous user opens the home map
- **WHEN** a user without active user context opens the home map
- **THEN** the system SHALL show public parties that are visible without authentication

#### Scenario: Authenticated user opens the home map
- **WHEN** a user with active user context opens the home map
- **THEN** the system SHALL show public parties and any additional visible parties the user hosts, is invited to, or has already joined

### Requirement: Extended location features are separate from core party discovery
The system SHALL treat nearby filtering, live attendee locations, and live user location as extended or optional behavior rather than the core requirement for party discovery.

#### Scenario: Core discovery baseline is defined
- **WHEN** the product baseline for the home map is described
- **THEN** it SHALL require visible-party discovery without depending on nearby filtering or live location features

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

#### Scenario: Host edits a party
- **WHEN** a host updates a party they own
- **THEN** the system SHALL persist the updated party details and related invitation changes

#### Scenario: Host deletes a party
- **WHEN** a host deletes a party they own
- **THEN** the system SHALL remove the party and notify relevant recipients according to party notification rules

### Requirement: Invitation acceptance happens through party attendance
The system SHALL model invitation acceptance through joining or attending the party.

#### Scenario: Invited user joins a party
- **WHEN** a user with a pending invitation joins the invited party
- **THEN** the system SHALL mark that invitation as accepted

#### Scenario: Invited user leaves a previously accepted party
- **WHEN** a user leaves a party for which their invitation had been accepted
- **THEN** the system SHALL update the invitation state according to the current brownfield behavior
