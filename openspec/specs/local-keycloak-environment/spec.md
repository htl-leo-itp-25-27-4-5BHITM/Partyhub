# local-keycloak-environment Specification

## Purpose
TBD - created by archiving change add-keycloak-compose. Update Purpose after archive.
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
The `partyhub` realm SHALL include a client named `frontend` configured as a public client without a client secret.

#### Scenario: Frontend client exists
- **WHEN** the `partyhub` realm is inspected
- **THEN** a client with client ID `frontend` exists

#### Scenario: Frontend client has no secret
- **WHEN** the `frontend` client is inspected
- **THEN** it is configured as a public client

#### Scenario: Frontend redirect URI is configured
- **WHEN** the `frontend` client is inspected
- **THEN** it allows redirect URI `http://localhost:8000/*`

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

