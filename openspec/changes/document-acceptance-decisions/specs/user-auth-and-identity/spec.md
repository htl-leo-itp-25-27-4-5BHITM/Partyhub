## MODIFIED Requirements

### Requirement: PartyHub users link to Keycloak identities
The backend SHALL link authenticated Keycloak subjects to PartyHub user records. Every successful first login SHALL end with the subject linked to exactly one PartyHub user, and the backend SHALL NOT choose among several candidate records by guessing.

#### Scenario: Linked user exists
- **WHEN** a valid Keycloak token has a `sub` value that matches a PartyHub user's stored Keycloak ID
- **THEN** the backend SHALL use that PartyHub user as the acting user

#### Scenario: Existing user matches token claims
- **WHEN** a valid Keycloak token has no existing Keycloak-ID link but its username or email matches one unlinked PartyHub user
- **THEN** the backend SHALL link that PartyHub user to the token subject and use it as the acting user

#### Scenario: No matching PartyHub user exists
- **WHEN** a valid Keycloak token has no existing link and no matching PartyHub user
- **THEN** the backend SHALL create a minimal PartyHub user from token claims or return an explicit onboarding-required response

#### Scenario: Several unlinked users match token claims
- **WHEN** a valid Keycloak token has no existing link and its username or email matches more than one unlinked PartyHub user
- **THEN** the backend SHALL NOT link any of those users, SHALL create a minimal PartyHub user from token claims, link it to the token subject and use it as the acting user

#### Scenario: Seeded test users stay unlinked data
- **WHEN** PartyHub test or seed data is loaded
- **THEN** its user records carry no Keycloak ID and gain one only when a login matches exactly one of them through the unique-match rule
