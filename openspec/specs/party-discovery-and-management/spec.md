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
The system SHALL allow a party visible to the current viewer to be opened in a detail view that presents the party's lifecycle context without widening that party's visibility.

#### Scenario: User opens party details from the map
- **WHEN** a user selects a visible party from the home map
- **THEN** the system SHALL open the party detail view for that party

#### Scenario: Party detail metadata is shown
- **WHEN** a user has access to a party detail view
- **THEN** the system SHALL show the title, host, location, start and optional end time, description, visibility, theme, fee, age bounds, capacity, and website where those values are available

#### Scenario: Party detail field is absent
- **WHEN** an optional party field has no stored value
- **THEN** the detail response and client SHALL handle that absence without inventing a value that changes the party's stored meaning

### Requirement: Private party visibility is restricted
The system SHALL expose public parties to anonymous and authenticated viewers and SHALL restrict private-party list and detail visibility to the host, users with a current invitation under the invitation lifecycle rules, and users who have already joined the party.

#### Scenario: Anonymous user requests a public party
- **WHEN** an anonymous user requests a public party through a list or detail operation
- **THEN** the system SHALL allow the public party to be returned

#### Scenario: Anonymous user requests a private party
- **WHEN** an anonymous user requests a private party through a list or detail operation
- **THEN** the system SHALL deny access to that private party and SHALL NOT disclose its lifecycle fields

#### Scenario: Host requests a private party
- **WHEN** the authenticated host requests their private party through a list or detail operation
- **THEN** the system SHALL allow the party to be returned

#### Scenario: Invited user requests a private party
- **WHEN** an authenticated user with a qualifying current invitation requests the private party
- **THEN** the system SHALL allow the party to be returned according to the invitation lifecycle rules

#### Scenario: Joined user requests a private party
- **WHEN** an authenticated user who has joined a private party requests it
- **THEN** the system SHALL allow the party to be returned

#### Scenario: Non-invited user requests a private party
- **WHEN** an authenticated user who is not the host, a qualifying invitee, or a joined attendee requests a private party
- **THEN** the system SHALL deny access and SHALL NOT disclose the party's lifecycle fields

#### Scenario: Alternate list branch is used
- **WHEN** a party list is requested with search, sort, filter, or another supported query combination
- **THEN** the system SHALL apply the same public/private viewer predicate before returning results

### Requirement: Users can create and manage parties
The system SHALL allow an authenticated user to create a party and SHALL allow only the party's stored host to update or delete it. The authenticated creator SHALL become the host, and lifecycle requests SHALL NOT transfer host ownership.

#### Scenario: Host creates a party
- **WHEN** an authenticated user submits valid party data
- **THEN** the system SHALL create the party with the submitted mutable attributes and assign the authenticated user as its host

#### Scenario: Create payload supplies another host
- **WHEN** a create request includes a host identifier that differs from the authenticated user
- **THEN** the system SHALL ignore or reject that identifier and SHALL NOT assign another user as host

#### Scenario: Anonymous user attempts to create a party
- **WHEN** a request without authenticated PartyHub identity attempts to create a party
- **THEN** the system SHALL reject the request and SHALL NOT create a party

#### Scenario: Host submits party attributes
- **WHEN** a host creates or updates a party
- **THEN** the system SHALL support title, description, start and optional end time, location coordinates and address, `PUBLIC` or `PRIVATE` visibility, theme, fee, minimum and maximum age, capacity, and website according to the lifecycle validation contract

#### Scenario: Host edits a party
- **WHEN** the stored host submits a valid update for their party
- **THEN** the system SHALL persist the submitted mutable party details and preserve the stored host

#### Scenario: Non-host attempts to edit a party
- **WHEN** an authenticated user other than the stored host attempts to update the party
- **THEN** the system SHALL deny the update, preserve the existing party fields, and preserve the existing host

#### Scenario: Host deletes a party
- **WHEN** the stored host deletes their party
- **THEN** the system SHALL remove the party and trigger notification behavior according to the party notification rules

#### Scenario: Non-host attempts to delete a party
- **WHEN** an authenticated user other than the stored host attempts to delete the party
- **THEN** the system SHALL deny the deletion and preserve the party

#### Scenario: Lifecycle mutation targets a missing party
- **WHEN** an authenticated user attempts to update or delete a party that does not exist
- **THEN** the system SHALL report that the party is unavailable and SHALL NOT create replacement state

### Requirement: Party lifecycle data is validated atomically
The system SHALL validate the complete submitted party lifecycle data before a create or update is committed. A failed validation SHALL leave party, ownership, invitation, and notification state unchanged.

#### Scenario: Required create data is missing
- **WHEN** a create request omits a valid title, start time, or usable location coordinate pair
- **THEN** the system SHALL reject the request and SHALL NOT create a party

#### Scenario: Title is invalid
- **WHEN** a submitted title is blank, shorter than 2 characters, longer than 100 characters, or contains text outside the accepted party-name character policy
- **THEN** the system SHALL reject the mutation with a field-specific validation failure

#### Scenario: Optional text exceeds its boundary
- **WHEN** a submitted description exceeds 2000 characters, website or address exceeds 500 characters, theme exceeds 50 characters, or visibility value exceeds 20 characters
- **THEN** the system SHALL reject the mutation with a field-specific validation failure

#### Scenario: Time range is invalid
- **WHEN** an end time is supplied and it is not later than the start time
- **THEN** the system SHALL reject the mutation and preserve existing state

#### Scenario: Location coordinates are incomplete or outside valid ranges
- **WHEN** only one coordinate is supplied, latitude is outside -90 through 90, or longitude is outside -180 through 180
- **THEN** the system SHALL reject the mutation and preserve existing state

#### Scenario: Fee or capacity is outside its accepted range
- **WHEN** a fee is negative or greater than 99999.99, or capacity is supplied outside 1 through 10000
- **THEN** the system SHALL reject the mutation with a field-specific validation failure

#### Scenario: Age metadata is invalid
- **WHEN** a minimum or maximum age is supplied outside 0 through 150, or both are supplied and minimum age exceeds maximum age
- **THEN** the system SHALL reject the mutation with a field-specific validation failure

#### Scenario: Visibility is omitted or unsupported
- **WHEN** visibility is omitted on creation
- **THEN** the system SHALL store the party as `PUBLIC`
- **AND** when a non-empty value other than `PUBLIC` or `PRIVATE` is submitted, the system SHALL reject the mutation instead of silently changing its meaning

#### Scenario: Age and capacity metadata is stored
- **WHEN** valid age bounds or capacity are submitted
- **THEN** the system SHALL store and expose them as party metadata without this lifecycle requirement alone authorizing or denying attendance

#### Scenario: Validation fails during update
- **WHEN** any submitted update field or cross-field relationship is invalid
- **THEN** the system SHALL reject the whole update and SHALL NOT partially change party, invitation, ownership, or notification state

### Requirement: Browser and iOS clients honor the shared party lifecycle contract
The browser and iOS clients SHALL use the shared party lifecycle contract for supported operations while allowing their user interfaces to expose different subsets of optional functionality.

#### Scenario: Client performs a canonical lifecycle request
- **WHEN** a client lists, creates, reads, updates, or deletes a party
- **THEN** it SHALL use `GET /api/parties`, `POST /api/parties`, `GET /api/parties/{id}`, `PUT /api/parties/{id}`, or `DELETE /api/parties/{id}` as appropriate

#### Scenario: Client performs an authenticated lifecycle request
- **WHEN** a client performs a party mutation or requests viewer-dependent private-party visibility
- **THEN** it SHALL send the current usable bearer token and SHALL NOT use a local user identifier as authority

#### Scenario: Client edits only supported fields
- **WHEN** a client edits a party but does not expose every mutable field in its user interface
- **THEN** it SHALL preserve valid stored values for fields the user did not change instead of replacing them with hard-coded defaults or empty collections

#### Scenario: Client receives a lifecycle failure
- **WHEN** the backend rejects party authorization, visibility, or validation
- **THEN** the client SHALL keep its local party state consistent with the server and surface an actionable failure without reporting success

#### Scenario: One client exposes additional party controls
- **WHEN** the browser or iOS client supports a lifecycle option that the other client does not expose
- **THEN** the difference SHALL NOT create an implicit requirement for identical user-interface parity

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
The system SHALL allow users to narrow already-visible home-map parties with client-side filters without changing the underlying party-visibility rules, and SHALL expose distance filtering directly in the map interface.

#### Scenario: User opens home map filters
- **WHEN** a user opens the regular party map filter controls
- **THEN** the system SHALL present filter options for within-two-weeks, party theme, distance, minimum age, maximum age, free parties, and text search

#### Scenario: User uses in-map distance control
- **WHEN** a user adjusts the distance radius from the map interface
- **THEN** the system SHALL apply the selected radius to the visible home-map party result set

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
The system SHALL present the regular party map filter affordance using the same interaction style as the attendee map, including an obvious active-filter state, a sheet-based editing flow, and direct in-map distance feedback.

#### Scenario: No filters are active
- **WHEN** the user has not enabled any non-default regular map filters
- **THEN** the filter affordance SHALL appear inactive and the summary state SHALL reflect the default map result set

#### Scenario: Filters are active
- **WHEN** one or more non-default regular map filters are active
- **THEN** the filter affordance SHALL show an active state and the map UI SHALL reflect that filters are currently narrowing the party results

#### Scenario: Distance filter is active
- **WHEN** the user selects a finite distance radius
- **THEN** the map UI SHALL visually reflect the active radius around the current user location where that location is available

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

#### Scenario: Distance filter is changed from map interface
- **WHEN** the user changes the selected distance threshold from the in-map distance slider and current location is available
- **THEN** the system SHALL update both the visible result set and the map radius visualization to match the selected threshold

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

