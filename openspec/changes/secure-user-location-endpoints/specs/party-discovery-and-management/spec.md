# Spec Delta

## ADDED Requirements

### Requirement: Stored user locations are private and returned through a bounded projection
PartyHub SHALL return stored user locations only to authenticated callers. A caller SHALL read a single stored location only for themselves, and SHALL read the stored locations of a party's attendees only when the caller may view that party. Every location response SHALL contain only latitude, longitude, and the located user's numeric reference, display name and distinct handle. It SHALL NOT include email, phone number, provider username, Keycloak subject, device token or other internal user fields. Each user SHALL have at most one stored location, and storing a location SHALL change only the caller's own location.

#### Scenario: Anonymous caller requests party attendee locations
- **WHEN** an unauthenticated caller requests the stored locations for a party
- **THEN** the system SHALL require authentication and SHALL NOT return any location

#### Scenario: Party viewer requests attendee locations
- **WHEN** an authenticated user who may view a party requests that party's attendee locations
- **THEN** the system SHALL return each stored attendee location with only coordinates, user reference, display name and distinct handle

#### Scenario: User without party access requests attendee locations
- **WHEN** an authenticated user who cannot view a party requests that party's attendee locations
- **THEN** the system SHALL respond as if the party does not exist and SHALL NOT return any location

#### Scenario: User reads their own stored location
- **WHEN** an authenticated user requests their own stored location
- **THEN** the system SHALL return that user's location using the bounded projection, or report that none is stored

#### Scenario: User requests another user's stored location
- **WHEN** an authenticated user requests a single stored location for a different user identifier
- **THEN** the system SHALL reject the request without revealing whether that user has a stored location

#### Scenario: User stores their location repeatedly
- **WHEN** an authenticated user stores a location and later stores a different location
- **THEN** the system SHALL keep exactly one stored location for that user, holding the latest coordinates, and SHALL NOT change any other user's location
