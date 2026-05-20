## ADDED Requirements

### Requirement: Party galleries support media viewing in the current brownfield system
The system SHALL allow users with access to a party to open that party’s gallery and view the media already stored for the party.

#### Scenario: User opens a party gallery
- **WHEN** a user with access to a party opens the gallery for that party
- **THEN** the system SHALL load and display the party’s available media items

#### Scenario: Party has no media
- **WHEN** a user opens a party gallery with no stored media
- **THEN** the system SHALL show an empty-gallery state

### Requirement: Party gallery upload is target behavior for the user interface
The target product behavior SHALL include UI-based photo upload for party galleries, while current verified behavior may remain view-only until that UI flow is implemented.

#### Scenario: Gallery upload capability is described for future work
- **WHEN** future gallery work is planned or implemented
- **THEN** the specification SHALL treat UI-based photo upload as target behavior and SHALL distinguish it from the currently verified read-only gallery UI

### Requirement: Party gallery uploads are available to party viewers
The system SHALL allow users who can view a party to upload photos to that party's gallery at any time.

#### Scenario: Party viewer uploads a photo
- **WHEN** a user who can view a party uploads a valid photo to that party's gallery
- **THEN** the system SHALL accept the upload without requiring the party end time to have passed

#### Scenario: User without party access uploads a photo
- **WHEN** a user who cannot view a party attempts to upload a photo to that party's gallery
- **THEN** the system SHALL reject the upload
