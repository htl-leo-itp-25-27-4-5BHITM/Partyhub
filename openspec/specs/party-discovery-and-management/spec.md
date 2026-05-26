# party-discovery-and-management Specification

## Purpose
Defines PartyHub's core party discovery and host-management behavior, including visible-party map discovery, party details, private-party visibility, party creation and updates, mutual-contact invitation enforcement, and invitation attendance semantics.
## Requirements
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

### Requirement: Home map supports client-side party filtering for visible parties
The system SHALL allow users to narrow already-visible home-map parties with client-side filters without changing the underlying party-visibility rules.

#### Scenario: User opens home map filters
- **WHEN** a user opens the regular party map filter controls
- **THEN** the system SHALL present filter options for within-two-weeks, party theme, distance, minimum age, maximum age, free parties, and text search

#### Scenario: User combines multiple filters
- **WHEN** a user enables or enters more than one party-map filter
- **THEN** the system SHALL show only parties that satisfy all active filter criteria

#### Scenario: User clears filters
- **WHEN** a user resets the regular party map filters to their default state
- **THEN** the system SHALL restore the full set of already-visible parties on the map

#### Scenario: Existing filter selection changes results
- **WHEN** a user enables one of the already-supported regular map filters such as free-only, near-me, my-age, or within-two-weeks
- **THEN** the system SHALL immediately update the visible home-map party result set to reflect that active filter

### Requirement: Home map filter experience matches the attendee-map interaction style
The system SHALL present the regular party map filter affordance using the same interaction style as the attendee map, including an obvious active-filter state and a sheet-based editing flow.

#### Scenario: No filters are active
- **WHEN** the user has not enabled any non-default regular map filters
- **THEN** the filter affordance SHALL appear inactive and the summary state SHALL reflect the default map result set

#### Scenario: Filters are active
- **WHEN** one or more non-default regular map filters are active
- **THEN** the filter affordance SHALL show an active state and the map UI SHALL reflect that filters are currently narrowing the party results

#### Scenario: Active filter state and map results stay in sync
- **WHEN** the regular map indicates that a filter is active
- **THEN** the visible parties, summary state, and filter affordance SHALL all correspond to the same filtered result set

### Requirement: Home map time, distance, age, free, and text filters behave predictably
The system SHALL evaluate each regular-map party filter against party metadata already available on the client and SHALL apply defined fallback behavior when required data is missing.

#### Scenario: Within-two-weeks filter is active
- **WHEN** the within-two-weeks filter is active
- **THEN** the system SHALL include only parties whose start time is within the next 14 days relative to the client clock

#### Scenario: Distance filter is active and user location is available
- **WHEN** the user selects a distance filter and current location is available
- **THEN** the system SHALL include only parties whose coordinates fall within the selected distance threshold from the user

#### Scenario: Distance filter is active and user location is unavailable
- **WHEN** the user selects a distance filter but the app has no current user location
- **THEN** the system SHALL not silently apply an invalid distance result set and SHALL surface a disabled or clearly unavailable distance-filter state

#### Scenario: Age range filter is active
- **WHEN** the user sets minimum age and or maximum age filters
- **THEN** the system SHALL include only parties whose admission-age bounds remain compatible with the selected filter range

#### Scenario: Free parties filter is active
- **WHEN** the user enables the free-parties filter
- **THEN** the system SHALL include only parties whose fee is missing or zero

#### Scenario: Text search filter is active
- **WHEN** the user enters party-map search text
- **THEN** the system SHALL match that text case-insensitively against party name, description, location, host display name, and theme where available

### Requirement: Home map theme filtering uses displayable theme metadata
The system SHALL provide theme filtering only from displayable theme metadata available to the client for each party.

#### Scenario: Party has theme metadata
- **WHEN** a visible party includes theme or category display metadata on the client
- **THEN** the system SHALL make that metadata available for theme-based filtering and search

#### Scenario: Party lacks theme metadata
- **WHEN** a visible party does not include displayable theme metadata on the client
- **THEN** the system SHALL exclude that party from theme-specific matches unless another non-theme filter includes it

