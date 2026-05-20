## ADDED Requirements

### Requirement: Browser-based user identity is the current active authentication context
The system SHALL support the current browser-based identity model in which the active PartyHub user is represented by a client-stored user identifier used by frontend flows and backend calls.

#### Scenario: Frontend resolves the acting user
- **WHEN** a PartyHub frontend flow needs the acting user context
- **THEN** it SHALL be able to resolve that context from the current browser-based user identity model

### Requirement: Backend business actions use explicit user context in the brownfield system
The current brownfield system SHALL allow business actions to use explicit acting-user context supplied by the client, including request headers or equivalent request parameters, until a different authenticated identity model is adopted.

#### Scenario: Acting user is provided for a protected business action
- **WHEN** the frontend invokes a business action that depends on the acting user
- **THEN** the backend SHALL be able to evaluate that action using explicit acting-user context supplied by the client

### Requirement: Keycloak is the planned future authentication direction
The specification baseline SHALL treat Keycloak-based authentication as planned target behavior rather than current implemented behavior.

#### Scenario: Future auth work is proposed
- **WHEN** a change proposal addresses login or identity modernization
- **THEN** it SHALL treat Keycloak as the target authentication direction and SHALL NOT claim that a Keycloak browser flow already exists in the current system

#### Scenario: Legacy user-context compatibility is considered
- **WHEN** Keycloak-based authentication is introduced in a future change
- **THEN** the specification SHALL NOT require legacy `X-User-Id` or query-parameter identity compatibility unless that future change explicitly chooses to retain it
