## MODIFIED Requirements

### Requirement: Realm import provisions frontend client
The `partyhub` realm SHALL include a client named `frontend` configured as a public browser client for PartyHub's plain JavaScript Authorization Code with PKCE login flow.

#### Scenario: Frontend client exists
- **WHEN** the `partyhub` realm is inspected
- **THEN** a client with client ID `frontend` exists

#### Scenario: Frontend client has no secret
- **WHEN** the `frontend` client is inspected
- **THEN** it is configured as a public client

#### Scenario: Frontend client supports standard flow
- **WHEN** the `frontend` client is inspected
- **THEN** standard authorization code flow is enabled

#### Scenario: Frontend client disables direct access grants
- **WHEN** the `frontend` client is inspected
- **THEN** direct access grants are disabled for browser login

#### Scenario: Frontend redirect URI matches PartyHub app origin
- **WHEN** the `frontend` client is inspected
- **THEN** it allows redirect URIs for `http://localhost:8080/*`

#### Scenario: Frontend web origin matches PartyHub app origin
- **WHEN** the `frontend` client is inspected
- **THEN** it allows web origin `http://localhost:8080`

#### Scenario: Frontend client accepts PKCE
- **WHEN** the `frontend` client is used by the PartyHub browser login flow
- **THEN** it accepts authorization requests that include a PKCE code challenge

## ADDED Requirements

### Requirement: Realm import provisions local PartyHub demo users
The local `partyhub` realm SHALL include enabled non-admin demo users that can authenticate through Keycloak and link to seeded PartyHub user records.

#### Scenario: Demo user exists
- **WHEN** the `partyhub` realm is inspected
- **THEN** at least one enabled non-admin user exists with username or email matching a seeded PartyHub `users` record

#### Scenario: Demo user can authenticate
- **WHEN** a local developer authenticates as a provisioned demo user with the documented local password
- **THEN** authentication succeeds for the `partyhub` realm

#### Scenario: Demo user can link to PartyHub user
- **WHEN** the demo user completes browser login and calls the PartyHub backend
- **THEN** the backend can link the Keycloak subject to the matching PartyHub user record
