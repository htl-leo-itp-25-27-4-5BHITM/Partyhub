# Spec Delta

## ADDED Requirements

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
