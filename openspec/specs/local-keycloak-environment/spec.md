# local-keycloak-environment Specification

## Purpose
Defines the local Docker Compose Keycloak environment used for PartyHub development, including the shared Postgres setup, imported PartyHub realm, frontend client, and bootstrap admin user.
## Requirements
### Requirement: Docker Compose provides local Keycloak
The local Docker Compose environment SHALL provide a Keycloak service using the official Keycloak image.

#### Scenario: Keycloak starts locally
- **WHEN** the Docker Compose environment is started
- **THEN** Keycloak is available on host port `8000`

#### Scenario: Keycloak uses the project network
- **WHEN** Keycloak starts
- **THEN** it joins the existing `partyhub-network`

### Requirement: Keycloak uses a dedicated database in the existing Postgres service
The local Keycloak service SHALL use the existing Docker Compose `postgres` service with a dedicated `keycloak` database.

#### Scenario: Only one Postgres service is used
- **WHEN** the Docker Compose file is inspected
- **THEN** it defines only one Postgres service

#### Scenario: Keycloak data is isolated
- **WHEN** Keycloak connects to Postgres
- **THEN** it uses database name `keycloak` instead of the PartyHub application database `demo`

#### Scenario: Only one Postgres port is exposed
- **WHEN** the Docker Compose environment is started
- **THEN** only the existing Postgres host port mapping for `5432` is exposed

### Requirement: Compose bootstraps the Keycloak database
The local Docker Compose setup SHALL include a first-run bootstrap mechanism that creates the `keycloak` database in the existing Postgres service.

#### Scenario: Fresh Postgres volume initializes Keycloak database
- **WHEN** the Postgres container initializes a fresh data volume
- **THEN** it creates a database named `keycloak`

#### Scenario: Existing Postgres volume needs manual remediation
- **WHEN** the Postgres data volume already exists before this change is applied
- **THEN** the implementation documents that the `keycloak` database must be created manually or the volume must be recreated

### Requirement: Realm import provisions PartyHub realm
The local Keycloak setup SHALL import a realm named `partyhub`.

#### Scenario: Realm is imported on startup
- **WHEN** Keycloak starts with the realm import mounted
- **THEN** the `partyhub` realm exists

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

### Requirement: Realm import provisions admin role and user
The `partyhub` realm SHALL include an `admin` role and an enabled user named `admin` with password `password` assigned to that role.

#### Scenario: Admin role exists
- **WHEN** the `partyhub` realm is inspected
- **THEN** a realm role named `admin` exists

#### Scenario: Admin user exists
- **WHEN** the `partyhub` realm is inspected
- **THEN** an enabled user named `admin` exists

#### Scenario: Admin user can authenticate
- **WHEN** the user authenticates as username `admin` with password `password`
- **THEN** authentication succeeds for the `partyhub` realm

#### Scenario: Admin user has admin role
- **WHEN** the `admin` user role mappings are inspected
- **THEN** the user has the realm role `admin`

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
