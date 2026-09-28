# Spec Delta

## ADDED Requirements

### Requirement: Profile pictures are authenticated profile content and self-managed
PartyHub SHALL make a profile picture or stable placeholder available as part of the authenticated profile-viewing contract. Only the authenticated profile owner SHALL upload or replace that picture. User-supplied profile pictures SHALL be non-empty JPEG, PNG, GIF, or WebP content no larger than 5 MiB, and a successful replacement SHALL leave exactly one current logical picture reference without exposing a filesystem path.

#### Scenario: Authenticated viewer requests a custom profile picture
- **WHEN** an authenticated profile viewer requests the current picture for a profile that has a stored image
- **THEN** the system SHALL return that image using its validated image media type and a bounded cache or version reference

#### Scenario: Profile has no usable custom picture
- **WHEN** an authenticated profile viewer requests a profile whose custom picture reference or backing file is absent or unusable
- **THEN** the system SHALL return or direct the client to a stable profile-picture placeholder without exposing storage details

#### Scenario: Anonymous caller requests profile-picture content
- **WHEN** a caller without an authenticated PartyHub session requests profile-picture content or filename metadata
- **THEN** the system SHALL reject the request consistently with authenticated profile and social reads

#### Scenario: Profile owner uploads a valid picture
- **WHEN** an authenticated user uploads a valid picture for their own profile
- **THEN** the system SHALL make the new picture the single current logical picture and return a bounded reference that clients can use to refresh it

#### Scenario: User uploads a picture for another profile
- **WHEN** an authenticated user attempts to upload or replace another user's profile picture
- **THEN** the system SHALL reject the action without changing that profile's current picture

#### Scenario: Profile-picture upload is invalid
- **WHEN** a profile-picture upload is empty, larger than 5 MiB, or is not JPEG, PNG, GIF, or WebP image content
- **THEN** the system SHALL reject it without changing the current picture or creating a new logical picture reference

#### Scenario: Profile-picture replacement fails
- **WHEN** storage or metadata persistence fails while replacing a current profile picture
- **THEN** the system SHALL report failure and preserve the previously usable current picture and reference

#### Scenario: Client refreshes a replaced profile picture
- **WHEN** a browser or iOS client completes a successful self profile-picture upload
- **THEN** it SHALL invalidate stale cached picture state and display the new server-backed picture or the server-defined placeholder on a later load
