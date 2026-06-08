# map-radius-control Specification

## Purpose
TBD - created by archiving change integrate-map-distance-slider. Update Purpose after archive.
## Requirements
### Requirement: Map exposes an in-context distance radius control
The system SHALL present a distance radius slider directly in the map interface so users can adjust party search radius without opening the filter sheet.

#### Scenario: User opens the home map with location available
- **WHEN** the user opens the home map and current user location is available
- **THEN** the system SHALL show a distance slider overlaid on the right side of the map

#### Scenario: User adjusts the map distance slider
- **WHEN** the user changes the in-map distance slider value
- **THEN** the system SHALL update the selected search radius state immediately

### Requirement: Map distance slider is vertically oriented
The system SHALL render the in-map distance slider vertically from top to bottom using SwiftUI layout and modifiers, including `.rotationEffect`.

#### Scenario: Slider is displayed on the map
- **WHEN** the in-map distance slider is visible
- **THEN** the system SHALL align it vertically along the right side of the map interface

### Requirement: Map displays selected radius as a geographic circle
The system SHALL render a `MapCircle` overlay centered on the current user location when a finite search radius is selected.

#### Scenario: Finite radius is selected
- **WHEN** the user selects a finite search radius and current user location is available
- **THEN** the system SHALL display a `MapCircle` whose radius matches the selected search radius

#### Scenario: Radius selection changes
- **WHEN** the selected search radius changes through the in-map slider
- **THEN** the system SHALL update the `MapCircle` radius without requiring the map view to be reopened

#### Scenario: Finite radius becomes active
- **WHEN** the user selects a finite search radius and current user location is available
- **THEN** the system SHALL adjust the map camera so the selected radius circle is visible

#### Scenario: Location is unavailable
- **WHEN** current user location is unavailable
- **THEN** the system SHALL not render a misleading search-radius `MapCircle`

