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
The system SHALL allow only a party's stored host to create, renew, or withdraw invitations for that party. A private-party invitation SHALL be issued or renewed only when the recipient is a mutual contact of the host at that transition. The host SHALL NOT invite themselves, and the system SHALL maintain at most one logical invitation for each party and recipient.

#### Scenario: Host invites mutual contact to private party
- **WHEN** a host creates or updates a private party and selects an invitee who has a mutual contact relationship with the host
- **THEN** the system SHALL allow the invitation to be created or retained

#### Scenario: Host invites non-mutual user to private party
- **WHEN** a host creates or updates a private party and includes an invitee who is not a mutual contact
- **THEN** the backend SHALL reject that private-party invitation

#### Scenario: Non-host attempts to manage an invitation
- **WHEN** an authenticated user other than the stored host attempts to create, renew, or withdraw an invitation for the party
- **THEN** the system SHALL deny the action and preserve invitation, membership, visibility, and event state

#### Scenario: Host attempts to invite themselves
- **WHEN** the stored host selects themselves as an invitation recipient
- **THEN** the system SHALL reject the invitation without creating a self-invitation

#### Scenario: Invitation target is missing
- **WHEN** an invitation action names a party or recipient that does not exist
- **THEN** the system SHALL reject the action without creating replacement invitation or attendance state

#### Scenario: Host repeats a current invitation
- **WHEN** the stored host invites a recipient whose logical invitation is already pending or is accepted while the recipient remains joined
- **THEN** the system SHALL preserve the current invitation and membership without creating a duplicate invitation or invitation-issued event

#### Scenario: Host renews a declined invitation
- **WHEN** the stored host reinvites an eligible recipient whose logical invitation is declined
- **THEN** the system SHALL change that invitation to pending, restore invitation-based private visibility, and SHALL NOT create a second logical invitation

#### Scenario: Host withdraws a pending invitation
- **WHEN** the stored host withdraws a pending invitation
- **THEN** the recipient SHALL no longer have a qualifying current invitation or invitation-based private visibility, while any access from another accepted role remains unchanged

### Requirement: Invitation acceptance happens through party attendance
The system SHALL model invitation acceptance through party attendance. An authenticated non-host MAY join a public party, while a private-party non-host SHALL have a pending invitation before joining. Joining, accepting, declining, and leaving SHALL update invitation status, attendance membership, private visibility, projections, and their domain event as one logical transition. Age and capacity metadata alone SHALL NOT be interpreted by this requirement as an admission decision.

#### Scenario: Invited user joins a party
- **WHEN** a user with a pending invitation joins the invited party
- **THEN** the system SHALL mark that invitation as accepted
- **AND** add the user to attendance exactly once

#### Scenario: Invited user leaves a previously accepted party
- **WHEN** a user leaves a party for which their invitation had been accepted
- **THEN** the system SHALL update the invitation state to declined
- **AND** remove the user from attendance

#### Scenario: Authenticated user joins a public party
- **WHEN** an authenticated non-host who is not attending joins a public party
- **THEN** the system SHALL add that user to attendance exactly once without requiring an invitation

#### Scenario: User without a pending invitation joins a private party
- **WHEN** an authenticated non-host without a pending invitation attempts to join a private party
- **THEN** the system SHALL deny the action and preserve invitation, membership, visibility, projection, and event state

#### Scenario: Recipient declines a pending invitation
- **WHEN** the authenticated recipient declines a pending invitation
- **THEN** the system SHALL mark the invitation declined, ensure the recipient is not an attendee, and remove invitation-based private visibility

#### Scenario: Recipient accepts through an invitation action
- **WHEN** the authenticated recipient accepts a pending invitation through a supported invitation action
- **THEN** the system SHALL perform the same accepted-invitation and attendance transition as joining the party

#### Scenario: User repeats an accepted join
- **WHEN** a user who is already attending repeats a join or acceptance action
- **THEN** the system SHALL preserve one membership and the current invitation state without emitting a duplicate transition event

#### Scenario: User repeats an absent leave or decline
- **WHEN** a user who is not attending repeats a leave action or repeats decline on an already declined invitation
- **THEN** the system SHALL preserve the current state without emitting a duplicate transition event

#### Scenario: Attendance transition targets a missing party
- **WHEN** an authenticated user attempts an attendance transition for a party that does not exist
- **THEN** the system SHALL report that the party is unavailable and SHALL NOT create invitation, membership, projection, or event state

### Requirement: Invitation and attendance projections are actor-scoped
The system SHALL expose invitation and attendance projections only to their intended authenticated actors. Pending invitations SHALL qualify their recipient for private-party visibility; declined or withdrawn invitations SHALL NOT. Joined attendees SHALL retain private-party visibility through membership. Invitation metadata and statistics SHALL remain host-only, while authenticated party viewers SHALL be allowed to read bounded joined-member and own-attendance projections.

#### Scenario: Pending recipient requests a private party
- **WHEN** the authenticated recipient of a pending invitation requests its private party
- **THEN** the system SHALL allow access through the current invitation

#### Scenario: Declined or withdrawn recipient requests a private party
- **WHEN** a user whose invitation is declined or withdrawn and who has no other viewer role requests the private party
- **THEN** the system SHALL deny access without disclosing party, invitation, roster, or statistics data

#### Scenario: Accepted attendee requests a private party
- **WHEN** a user with an accepted invitation remains joined to the private party
- **THEN** the system SHALL allow access through attendance membership

#### Scenario: User lists invitations
- **WHEN** an authenticated user lists received or sent invitations
- **THEN** the system SHALL return only invitations where that user is respectively the recipient or stored host/sender

#### Scenario: User requests invitation details
- **WHEN** an authenticated user requests invitation details
- **THEN** the system SHALL return a bounded party and invitation projection only when the user is that invitation's stored host/sender or recipient

#### Scenario: Host requests invitation roster or statistics
- **WHEN** the stored host requests invited-member identities, invitation statuses, or invitation statistics for their party
- **THEN** the system SHALL return the corresponding bounded projection

#### Scenario: Party viewer requests joined-member or own-attendance projection
- **WHEN** an authenticated party viewer requests the joined-member roster or their own attendance status and viewer-safe count
- **THEN** the system SHALL return a bounded projection without exposing host-only invitation metadata

#### Scenario: Non-host requests host-only invitation projection
- **WHEN** an authenticated non-host requests invited-member identities, invitation statuses, or invitation statistics
- **THEN** the system SHALL deny the request and SHALL NOT disclose that projection

#### Scenario: Host opens invitation statistics
- **WHEN** the stored host opens invitation statistics
- **THEN** accepted, declined, pending, and total counts SHALL be derived from actual logical invitations and SHALL NOT classify the host as an accepted invitation

### Requirement: Invitation and attendance transitions publish consistent domain events
The system SHALL produce at most one domain event for each committed invitation or attendance transition, with the party, acting user, transition type, and intended domain recipient needed by notification processing. A failed, denied, or repeated no-op action SHALL NOT produce a transition event. Notification channels, user preferences, delivery, retry, and cleanup remain governed by the notification contract.

#### Scenario: Host issues or renews an invitation
- **WHEN** the stored host commits a new or renewed pending invitation
- **THEN** the system SHALL produce one invitation-issued event intended for the recipient

#### Scenario: Host withdraws a pending invitation
- **WHEN** the stored host commits withdrawal of a pending invitation
- **THEN** the system SHALL produce one invitation-withdrawn event intended for the recipient

#### Scenario: Recipient accepts or joins
- **WHEN** the recipient commits acceptance of a pending invitation by joining the party
- **THEN** the system SHALL produce one acceptance-and-join event intended for the host

#### Scenario: Recipient declines an invitation
- **WHEN** the recipient commits decline of a pending invitation
- **THEN** the system SHALL produce one invitation-declined event intended for the host

#### Scenario: Attendee leaves a party
- **WHEN** a joined non-host commits leaving the party
- **THEN** the system SHALL produce one attendance-left event intended for the host and include the declined invitation transition when one applies

#### Scenario: Transition is denied or has no state change
- **WHEN** an invitation or attendance action is denied, fails validation, targets missing state, or repeats an already-current state
- **THEN** the system SHALL preserve all projections and SHALL NOT produce a duplicate transition event

### Requirement: Home map supports client-side party filtering for visible parties
The iOS client SHALL allow users to narrow already-visible home-map parties with client-side filters without changing the underlying party-visibility rules, and SHALL expose distance filtering directly in the iOS map interface.

#### Scenario: User opens home map filters
- **WHEN** a user opens the iOS home map filter controls
- **THEN** the system SHALL present filter options for within-two-weeks, party theme, distance, minimum age, maximum age, free parties, and text search

#### Scenario: User uses in-map distance control
- **WHEN** a user adjusts the distance radius from the iOS map interface
- **THEN** the system SHALL apply the selected radius to the visible home-map party result set

#### Scenario: User combines multiple filters
- **WHEN** a user enables or enters more than one iOS party-map filter
- **THEN** the system SHALL show only parties that satisfy all active filter criteria

#### Scenario: User clears filters
- **WHEN** a user resets the iOS home map filters to their default state
- **THEN** the system SHALL clear search text and selected themes, unset age bounds, select any-time and all-fee states, select unlimited distance, and restore the full server-authorized visible party set

#### Scenario: Existing filter selection changes results
- **WHEN** a user changes an iOS home-map filter
- **THEN** the system SHALL immediately update visible annotations, clusters, result count, and active-filter summary from the same filtered party set

### Requirement: Home map filter experience matches the attendee-map interaction style
The iOS client SHALL present the regular party map filter affordance using the attendee-map interaction style, including an obvious active-filter state, a sheet-based editing flow, and direct in-map distance feedback.

#### Scenario: No filters are active
- **WHEN** the iOS user has not enabled any non-default regular map filters
- **THEN** the filter affordance SHALL appear inactive and the summary state SHALL reflect the default visible map result set

#### Scenario: Filters are active
- **WHEN** one or more non-default iOS regular map filters are active
- **THEN** the filter affordance SHALL show an active state and the map UI SHALL reflect that filters are narrowing the party results

#### Scenario: Distance filter is active
- **WHEN** the iOS user selects a finite distance radius
- **THEN** the map UI SHALL visually reflect the active radius around the current user location where that location is available

#### Scenario: Active filter state and map results stay in sync
- **WHEN** the iOS regular map indicates that a filter is active
- **THEN** the visible parties, clusters, summary count, and filter affordance SHALL correspond to the same filtered result set

### Requirement: Home map time, distance, age, free, and text filters behave predictably
The iOS client SHALL evaluate each regular-map party filter against metadata already present in the server-authorized visible party set and SHALL apply the defined boundary and missing-data behavior below.

#### Scenario: Within-two-weeks filter is active
- **WHEN** the within-two-weeks filter is evaluated at a client clock instant
- **THEN** the system SHALL include parties starting at that instant through the corresponding instant 14 calendar days later, inclusive, and SHALL exclude a party with no usable start time

#### Scenario: Distance filter is active and user location is available
- **WHEN** the user selects a finite distance and current user location is available
- **THEN** the system SHALL include only parties whose coordinates are present and whose calculated distance is less than or equal to the selected threshold

#### Scenario: Unlimited distance is selected
- **WHEN** the iOS distance state is unlimited
- **THEN** the system SHALL apply no distance predicate and SHALL NOT require current user location to retain an otherwise matching visible party

#### Scenario: Distance filter is changed from map interface
- **WHEN** the user changes the selected distance state from the in-map control and current location is available
- **THEN** the system SHALL update both the visible result set and any finite-radius visualization to match the selected state

#### Scenario: Distance filter is active and user location is unavailable
- **WHEN** current user location is unavailable while a finite distance is selected
- **THEN** the system SHALL reset distance to unlimited, disable or clearly mark finite distance selection as unavailable, and SHALL NOT produce an empty result set by silently evaluating an invalid distance predicate

#### Scenario: Age range filter is active
- **WHEN** the user sets a minimum age, maximum age, or both
- **THEN** the system SHALL include a party when its admission-age interval overlaps the selected interval, treating an absent party bound or selected bound as open

#### Scenario: Free parties filter is active
- **WHEN** the user enables the free-parties filter
- **THEN** the system SHALL include only parties whose fee is missing or zero

#### Scenario: Text search filter is active
- **WHEN** the user enters iOS party-map search text after trimming surrounding whitespace
- **THEN** the system SHALL match it case-insensitively against party name, description, location, host display name, or displayable theme metadata

### Requirement: Home map theme filtering uses displayable theme metadata
The iOS client SHALL derive theme choices and theme-specific matches only from non-blank displayable theme metadata in the server-authorized visible party set.

#### Scenario: Party has theme metadata
- **WHEN** a visible party includes non-blank theme or category display metadata on the client
- **THEN** the system SHALL make that metadata available for theme-based filtering and text search

#### Scenario: Party lacks theme metadata
- **WHEN** at least one theme filter is active and a visible party has no displayable theme metadata or does not match a selected theme
- **THEN** the system SHALL exclude that party even when it satisfies every other active filter

### Requirement: Visible-party queries have shared composition and pagination boundaries
The system SHALL derive one viewer-eligible party candidate set before applying any supported search, theme, time, age, fee, distance, sort, limit, or offset input. Active server-side query predicates SHALL combine with logical AND, sorting and pagination SHALL occur after visibility and filtering, and client-side narrowing SHALL only remove parties from the server-authorized result set.

#### Scenario: Anonymous caller queries parties
- **WHEN** an anonymous caller lists, searches, filters, sorts, or pages parties
- **THEN** every returned party SHALL be public and satisfy every supported query predicate supplied by the caller

#### Scenario: Authenticated caller queries parties
- **WHEN** an authenticated caller lists, searches, filters, sorts, or pages parties
- **THEN** every returned party SHALL satisfy every supported query predicate and SHALL be public or visible because the caller is its host, pending invitee, or joined attendee

#### Scenario: Multiple server query predicates are supplied
- **WHEN** a caller supplies more than one supported search, theme, time, age, fee, or distance predicate
- **THEN** a party SHALL be returned only when it remains viewer-eligible and satisfies all supplied predicates

#### Scenario: Shared text search is supplied
- **WHEN** a non-blank shared party search value is supplied
- **THEN** the system SHALL match it case-insensitively against party title, description, or displayable theme metadata

#### Scenario: Time range is supplied
- **WHEN** both lower and upper party-start boundaries are supplied and the lower boundary is not later than the upper boundary
- **THEN** the system SHALL include parties starting at either boundary and between them and SHALL reject an incomplete or reversed range

#### Scenario: Age fee or distance metadata is queried
- **WHEN** an age, free-or-paid, or finite-distance predicate is supplied
- **THEN** the system SHALL treat absent age bounds as open, missing or zero fee as free, and missing party coordinates as not matching a finite-distance predicate
- **AND** a finite-distance predicate SHALL require a complete caller coordinate pair and a positive distance

#### Scenario: Query results are paged
- **WHEN** a caller requests a non-negative offset and positive limit
- **THEN** the system SHALL apply them after visibility, filtering, and deterministic sorting so repeated requests over unchanged data do not duplicate or skip parties because of an unstable tie order

#### Scenario: Browser and iOS narrow visible results
- **WHEN** the browser narrows a fetched party list or the iOS home map applies its local filter state
- **THEN** each client SHALL start from the server-authorized visible result set and SHALL NOT restore a party excluded by backend viewer eligibility
- **AND** browser controls SHALL NOT be required to mirror the iOS map filter interface
