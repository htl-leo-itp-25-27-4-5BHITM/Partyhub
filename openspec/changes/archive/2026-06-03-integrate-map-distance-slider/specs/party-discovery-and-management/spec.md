## MODIFIED Requirements

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
