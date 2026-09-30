# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
