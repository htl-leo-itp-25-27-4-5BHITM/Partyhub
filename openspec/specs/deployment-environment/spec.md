# deployment-environment Specification

## Purpose
Defines how the deployed PartyHub school-cloud environment keeps application, identity and upload data across deployments, and how a successful push to `main` updates that environment incrementally without resetting it.

## Requirements
### Requirement: Deployments preserve persisted data
The deployed PartyHub school-cloud environment SHALL keep application data, Keycloak identity data and uploaded files across deployments, restarts and pod replacement.

#### Scenario: Application data survives a deployment
- **WHEN** a new PartyHub version is deployed
- **THEN** existing users, parties, invitations, attendance, follows and notifications are still present afterwards

#### Scenario: Keycloak accounts survive a deployment
- **WHEN** a new PartyHub or Keycloak version is deployed
- **THEN** existing Keycloak users, registrations and their links to PartyHub users remain valid

#### Scenario: Uploaded files survive pod replacement
- **WHEN** the application pod is restarted or replaced
- **THEN** previously uploaded profile pictures and party gallery files remain available through their stored references

### Requirement: Pushes deploy changes without resetting
A successful push to `main` SHALL deploy the new PartyHub version by applying code, schema and configuration changes incrementally to the existing environment. Deployment SHALL NOT drop schemas, truncate tables or replay seed data on the deployed database.

#### Scenario: Successful push is deployed
- **WHEN** a push to `main` passes the test and image build workflows
- **THEN** the new version is deployed to the school cloud

#### Scenario: Failed pipeline does not deploy
- **WHEN** the test or image build workflow for a push fails
- **THEN** no deployment of that push takes place

#### Scenario: Schema changes keep existing rows
- **WHEN** a deployed version changes the database schema
- **THEN** the change is applied to the existing database without deleting rows unrelated to the change

#### Scenario: Seed data is not replayed
- **WHEN** a deployment runs
- **THEN** seed or test data is not truncated into or re-imported onto the deployed database

#### Scenario: Existing realm is not overwritten
- **WHEN** Keycloak starts with realm import configured and the `partyhub` realm already exists
- **THEN** the existing realm and its users are kept

### Requirement: Application startup does not write seed or test data
On the deployed environment, starting or restarting the PartyHub application SHALL NOT insert, update or delete seed or test data. Reference data the application needs to work, such as the follow statuses, SHALL be provided by versioned schema migrations, and those migrations SHALL leave existing rows unchanged.

#### Scenario: Restart does not invent user locations
- **WHEN** the deployed application starts and some users have no stored location
- **THEN** those users still have no stored location after startup

#### Scenario: Follow statuses exist after deployment
- **WHEN** a version with the follow-status migration is deployed to a database with or without the follow statuses
- **THEN** the statuses `pending`, `accepted` and `blocked` exist afterwards, and follow requests can be created and accepted

#### Scenario: Reference migration keeps existing rows
- **WHEN** the follow-status migration runs on a database that already contains follow statuses
- **THEN** the existing follow-status rows and the follows that reference them are unchanged
