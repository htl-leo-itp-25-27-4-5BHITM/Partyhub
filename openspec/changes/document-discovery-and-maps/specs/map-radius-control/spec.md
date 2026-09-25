# Spec Delta

## MODIFIED Requirements

### Requirement: Map exposes an in-context distance radius control
The iOS client SHALL present a distance radius slider directly in the SwiftUI home-map interface so users can select a finite or unlimited party search radius without opening the filter sheet.

#### Scenario: User opens the home map with location available
- **WHEN** the iOS user opens the home map and current user location is available
- **THEN** the system SHALL show an enabled distance slider overlaid on the right side of the map

#### Scenario: User adjusts the map distance slider
- **WHEN** the user changes the in-map distance slider value
- **THEN** the system SHALL update the selected finite or unlimited search-radius state immediately and synchronize the shared iOS map filter state

#### Scenario: User resets map filters
- **WHEN** the user resets the iOS home-map filters
- **THEN** the system SHALL select unlimited distance and synchronize the in-map slider, filtered result set, active summary, and radius visualization with that state

### Requirement: Map distance slider is vertically oriented
The iOS client SHALL render the in-map distance slider vertically from top to bottom using the SwiftUI map layout and rotation behavior.

#### Scenario: Slider is displayed on the map
- **WHEN** the in-map distance slider is visible
- **THEN** the system SHALL align it vertically along the right side of the iOS map interface

### Requirement: Map displays selected radius as a geographic circle
The iOS client SHALL render a geographic circle centered on the current user location only when a finite search radius is selected and SHALL keep the circle, filtered results, and camera response synchronized with the selected radius state.

#### Scenario: Finite radius is selected
- **WHEN** the user selects a finite search radius and current user location is available
- **THEN** the system SHALL display a geographic circle whose radius matches the selected search radius

#### Scenario: Radius selection changes
- **WHEN** the selected finite search radius changes through the in-map slider
- **THEN** the system SHALL update the geographic circle and filtered result set without requiring the map view to be reopened

#### Scenario: Finite radius becomes active
- **WHEN** the user selects a finite search radius and current user location is available
- **THEN** the system SHALL adjust the map camera so the selected radius circle is visible

#### Scenario: Unlimited radius is selected
- **WHEN** the user selects unlimited distance
- **THEN** the system SHALL remove the distance predicate and SHALL NOT render a search-radius circle

#### Scenario: Location is unavailable
- **WHEN** current user location is unavailable
- **THEN** the system SHALL disable or clearly mark finite selection as unavailable, reset any finite selection to unlimited, and SHALL NOT render a misleading search-radius circle

#### Scenario: Location becomes unavailable
- **WHEN** current user location becomes unavailable after a finite radius was active
- **THEN** the system SHALL synchronize the slider, filter state, result set, summary, and circle with the unlimited state
