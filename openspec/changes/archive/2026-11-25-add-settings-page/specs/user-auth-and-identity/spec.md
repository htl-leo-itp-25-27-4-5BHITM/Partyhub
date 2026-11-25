# Spec Delta

## ADDED Requirements

### Requirement: Profile e-mail follows the Keycloak account e-mail
The Keycloak account e-mail SHALL be the login e-mail and the PartyHub profile e-mail SHALL equal it. The backend SHALL change a user's Keycloak e-mail only on behalf of that authenticated user through a confirmed e-mail change, using a dedicated Keycloak service account whose permissions are limited to managing users of the `partyhub` realm. The service-account credentials SHALL come from configuration and SHALL NOT be exposed to clients or logs. When a valid token carries an e-mail claim that differs from the linked profile's e-mail, the backend SHALL update the profile e-mail to the token value.

#### Scenario: Confirmed e-mail change is applied
- **WHEN** a user confirms a pending e-mail change
- **THEN** the backend SHALL set the new address as verified e-mail of the user's Keycloak account and store it on the PartyHub profile

#### Scenario: Keycloak update fails
- **WHEN** the Keycloak account cannot be updated while confirming an e-mail change
- **THEN** the backend SHALL keep the old e-mail on the profile, keep the change pending and report a temporary error

#### Scenario: E-mail was changed directly in Keycloak
- **WHEN** an administrator changes a user's e-mail in the Keycloak Admin Console and the user logs in again
- **THEN** the backend SHALL update the profile e-mail to the token's e-mail claim
