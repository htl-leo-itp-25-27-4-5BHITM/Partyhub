# Spec Delta

## ADDED Requirements

### Requirement: Current device location remains private client context
The iOS client MAY use the current device location as a local input to accepted distance filtering, radius presentation, and optional visit detection only after the relevant platform permission is available. The accepted PartyHub baseline SHALL NOT upload, persist, or expose a user's current coordinates or an attendee-location roster, and a location observation SHALL NOT create attendance, invitation, visibility, or host authority.

#### Scenario: Current location supports distance filtering
- **WHEN** the iOS client has location permission and evaluates an accepted finite-distance map filter
- **THEN** it SHALL use the current coordinates as client context for that calculation
- **AND** it SHALL NOT publish those coordinates as a live user or attendee location

#### Scenario: Current location is unavailable
- **WHEN** location permission is denied or revoked, or no usable current coordinate is available
- **THEN** the client SHALL preserve the accepted unavailable-location and unlimited-radius behavior
- **AND** core party discovery, party details, and attendance actions SHALL remain usable without publishing location

#### Scenario: Device enters a party region
- **WHEN** the client observes that the device is inside a party region
- **THEN** that observation MAY drive an enabled local visit record
- **AND** it SHALL NOT join the user to the party, accept an invitation, or prove server-side attendance

#### Scenario: Caller requests a shared user or attendee location
- **WHEN** a client requests another user's current coordinates or a party attendee-location map or list
- **THEN** the accepted baseline SHALL NOT expose that live-location projection
- **AND** a private party's existence, membership, or location data SHALL NOT be disclosed through that surface

### Requirement: iOS visit tracking is an optional private local history
The iOS client MAY offer visit/time tracking as an optional feature that the user explicitly enables with the required location permission. Visit intervals SHALL be stored only in that user's local application data, SHALL remain separate from authoritative PartyHub attendance, and SHALL be removable by the user. Disabling the feature, losing permission, or failing to determine location SHALL stop new tracking without changing server state.

#### Scenario: User enables visit tracking
- **WHEN** an iOS user explicitly enables visit tracking and grants the required location permission
- **THEN** the client MAY monitor eligible locally available party regions for that user
- **AND** it SHALL explain that the resulting history is device local and is not PartyHub attendance

#### Scenario: User enters and exits a monitored party region
- **WHEN** an enabled client observes entry into an eligible party region and later observes exit
- **THEN** it SHALL create at most one local open interval for that party and close that interval with the observed exit time

#### Scenario: Region event is repeated or out of order
- **WHEN** the client receives a duplicate entry while an interval is open or an exit while none is open
- **THEN** it SHALL preserve a single coherent local interval state without inventing or duplicating a visit

#### Scenario: Permission or monitoring becomes unavailable
- **WHEN** the user denies or revokes required location permission, disables visit tracking, or region monitoring fails
- **THEN** the client SHALL stop creating new visit intervals and present tracking as unavailable
- **AND** it SHALL NOT publish a location, mutate attendance, or report a fabricated visit

#### Scenario: User reviews or deletes visit history
- **WHEN** the user opens visit history or deletes one of their completed intervals
- **THEN** the client SHALL show only that device's local records and remove the selected local record without a backend mutation

#### Scenario: Local party data is removed
- **WHEN** the client removes its local data for a party because the party is deleted or no longer available
- **THEN** it SHALL stop monitoring that party and remove visit records owned by that local party data
- **AND** it SHALL NOT interpret that local cleanup as a server attendance transition

### Requirement: iOS calendar export is an optional user-controlled snapshot
The iOS client MAY let a viewer export a visible party to a device calendar as a user-initiated snapshot. Calendar access SHALL be requested in context, the event SHALL use the visible party's stored title, start time, stored end time or a documented bounded default duration when no end time exists, location, and PartyHub link, and the local event association SHALL remain on the device. Calendar denial or failure SHALL NOT change PartyHub party, invitation, attendance, notification, or visibility state.

#### Scenario: User exports a visible party
- **WHEN** an iOS user viewing an authorized party chooses to add it to their calendar and grants calendar access
- **THEN** the client SHALL create one device-calendar event from the party's stored title, start time, stored end time or documented bounded default duration, location, and PartyHub link
- **AND** it SHALL retain the local event association without sending calendar data to PartyHub

#### Scenario: Calendar permission is denied or unavailable
- **WHEN** calendar access is denied, restricted, revoked, or cannot be requested
- **THEN** the client SHALL report that export is unavailable and SHALL NOT claim that an event was created
- **AND** PartyHub state SHALL remain unchanged

#### Scenario: Exported event already exists
- **WHEN** the client has a valid local association to an existing calendar event for the party
- **THEN** it SHALL present the party as already exported and SHALL NOT create a duplicate event from a repeated add action

#### Scenario: User removes the exported event through PartyHub
- **WHEN** the user confirms removal and the associated device-calendar event still exists
- **THEN** the client SHALL remove only that associated event and clear its local association
- **AND** PartyHub state SHALL remain unchanged

#### Scenario: Associated calendar event is missing or removal fails
- **WHEN** the stored local association is stale, permission is unavailable, or calendar removal fails
- **THEN** the client SHALL report or recover the local calendar state without deleting a different event or changing PartyHub state

#### Scenario: Party changes after export
- **WHEN** the PartyHub party is updated or cancelled after a calendar event was exported
- **THEN** the device event SHALL remain a snapshot unless the user performs a supported remove-and-export action
- **AND** the client SHALL NOT present the snapshot as automatically synchronized with PartyHub
