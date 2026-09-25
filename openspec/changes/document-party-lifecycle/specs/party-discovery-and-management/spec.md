# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
