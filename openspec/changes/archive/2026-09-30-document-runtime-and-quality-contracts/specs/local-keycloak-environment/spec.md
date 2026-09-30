## ADDED Requirements

### Requirement: Local runtime binds PartyHub to the local realm
The local development runtime SHALL bind the PartyHub backend, its public configuration and the browser application origin to the Compose Keycloak `partyhub` realm, so that tokens issued locally are the tokens the backend verifies.

#### Scenario: Backend defaults to the local issuer
- **WHEN** the backend runs locally without an external issuer override
- **THEN** it verifies bearer tokens against issuer `http://localhost:8000/realms/partyhub` and that issuer's published signing keys

#### Scenario: Public configuration names the verified issuer
- **WHEN** a local browser or iOS client requests `/api/config/public`
- **THEN** the returned issuer is the same issuer the backend uses for token verification

#### Scenario: Application origin matches the browser client
- **WHEN** the PartyHub application is served for local development
- **THEN** it is served from `http://localhost:8080`, an origin and redirect base allowed by the `frontend` client

### Requirement: Local realm import has one source of truth
The local Docker Compose environment SHALL import the `partyhub` realm only from `keycloak/realm-dev.json`. Realm files intended for image-based or deployed environments SHALL NOT be present as competing local imports for the same realm.

#### Scenario: Compose imports the development realm file
- **WHEN** Compose starts Keycloak with realm import enabled
- **THEN** the `partyhub` realm definition comes from `keycloak/realm-dev.json`

#### Scenario: No competing realm definition is imported locally
- **WHEN** the local Keycloak import directory is inspected
- **THEN** it contains no other file that defines the `partyhub` realm

#### Scenario: Existing realm needs documented recreation
- **WHEN** the `partyhub` realm already exists in the local Keycloak database and the development realm file changes
- **THEN** the local setup documentation states that the Keycloak database or Postgres volume must be recreated for the change to be imported

### Requirement: Realm import provisions native iOS client
The local `partyhub` realm SHALL include a public native client for the iOS application that supports Authorization Code with S256 PKCE on the PartyHub custom-scheme callback.

#### Scenario: Native client exists and is public
- **WHEN** the `partyhub` realm is inspected
- **THEN** a public client with client ID `partyhub-ios` exists

#### Scenario: Native client uses the app callback
- **WHEN** the `partyhub-ios` client is inspected
- **THEN** it allows redirect URI `partyhub.auth://callback`

#### Scenario: Native client requires S256 PKCE
- **WHEN** the `partyhub-ios` client is inspected
- **THEN** standard authorization code flow is enabled and the PKCE code challenge method is `S256`

#### Scenario: Native client disables direct access grants
- **WHEN** the `partyhub-ios` client is inspected
- **THEN** direct access grants are disabled

### Requirement: Development identity bypass is non-authoritative
The `X-User-Id` identity bypass SHALL be disabled unless a development or automated-test configuration explicitly enables it. Results that authenticate only through the bypass SHALL NOT be treated as evidence that bearer authentication satisfies `user-auth-and-identity`.

#### Scenario: Bypass is off by default
- **WHEN** the backend runs without a profile or environment value that enables the bypass
- **THEN** a request carrying only an `X-User-Id` header is not authenticated for protected actions

#### Scenario: Bypass-only checks are not authentication evidence
- **WHEN** a local check, JUnit test or HTTPYac request authenticates only through `X-User-Id` or synthetic test identity
- **THEN** its result is recorded as domain-behaviour evidence only and not as verification of bearer-token authentication

#### Scenario: Local real-token verification is possible
- **WHEN** the bypass is disabled locally and a provisioned demo user presents a bearer token issued by the local `partyhub` realm
- **THEN** protected PartyHub endpoints resolve that demo user through the accepted identity-linking rules
