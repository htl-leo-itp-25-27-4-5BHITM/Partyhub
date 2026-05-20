## MODIFIED Requirements

### Requirement: Browser-based user identity is the current active authentication context
The system SHALL support a browser-based Keycloak identity model in which the active PartyHub user is represented by an authenticated Keycloak browser session and a backend-validated bearer access token.

#### Scenario: Frontend resolves the authenticated acting user
- **WHEN** a PartyHub frontend flow needs the acting user context after Keycloak authentication
- **THEN** it SHALL resolve that context through the authenticated browser session and backend `/me`-style identity lookup rather than through a stored numeric user ID alone

#### Scenario: Unauthenticated protected page access redirects to login
- **WHEN** a browser user opens a PartyHub page that requires authentication without an active Keycloak-backed browser session
- **THEN** the frontend SHALL start the Keycloak login redirect flow

### Requirement: Backend business actions use explicit user context in the brownfield system
The system SHALL replace explicit client-supplied acting-user context for protected business actions with acting-user context derived from the validated Keycloak access token.

#### Scenario: Protected business action receives a valid bearer token
- **WHEN** the frontend invokes a protected business action with a valid Keycloak bearer access token
- **THEN** the backend SHALL evaluate that action using the PartyHub user linked to the token subject

#### Scenario: Protected business action omits bearer token
- **WHEN** the frontend invokes a protected business action without a valid bearer access token
- **THEN** the backend SHALL reject the request as unauthenticated

#### Scenario: Legacy acting-user parameter is supplied
- **WHEN** a protected business action receives `X-User-Id`, `user`, or `userId` as the only acting-user evidence
- **THEN** the backend SHALL NOT treat that value as authenticated user identity

### Requirement: Keycloak is the planned future authentication direction
The system SHALL treat Keycloak-based authentication as implemented target behavior for browser login and protected backend access.

#### Scenario: Auth work is implemented
- **WHEN** a change implements login or identity modernization
- **THEN** it SHALL integrate with the local `partyhub` Keycloak realm rather than adding another browser-stored numeric-ID login model

#### Scenario: Legacy user-context compatibility is considered
- **WHEN** Keycloak-based authentication is introduced
- **THEN** protected business actions SHALL NOT require legacy `X-User-Id` or query-parameter identity compatibility

## ADDED Requirements

### Requirement: Plain JavaScript login uses Authorization Code Flow with PKCE
The frontend SHALL implement Keycloak browser authentication in plain JavaScript using OpenID Connect Authorization Code Flow with PKCE and SHALL NOT depend on the `keycloak-js` adapter package.

#### Scenario: Login redirect is started
- **WHEN** the frontend starts login
- **THEN** it SHALL generate `state`, `nonce`, `code_verifier`, and `code_challenge` values and redirect the browser to the Keycloak authorization endpoint for realm `partyhub`

#### Scenario: Callback exchanges authorization code
- **WHEN** Keycloak redirects back to the PartyHub callback page with a valid authorization code and matching state
- **THEN** the frontend SHALL exchange the code and code verifier at the Keycloak token endpoint

#### Scenario: Callback state is invalid
- **WHEN** the PartyHub callback page receives a state value that does not match the stored login transaction
- **THEN** the frontend SHALL reject the callback and SHALL NOT exchange the authorization code

#### Scenario: Password grant is not used
- **WHEN** the frontend authenticates a browser user
- **THEN** it SHALL NOT collect the user's Keycloak password or call the token endpoint with the password grant

### Requirement: Frontend auth service manages the Keycloak browser session
The frontend SHALL expose an `authService` facade for plain JavaScript pages that manages initialization, login, logout, token refresh, user lookup, and authenticated API calls.

#### Scenario: Auth service initializes
- **WHEN** a PartyHub page loads
- **THEN** `authService.init()` SHALL restore or complete the current browser-session authentication state before protected page logic depends on identity

#### Scenario: Authenticated API call is made
- **WHEN** frontend code calls a protected backend API through the shared auth service
- **THEN** the request SHALL include `Authorization: Bearer <access_token>`

#### Scenario: Token is near expiry
- **WHEN** a protected API call is about to be made and the access token is near expiry
- **THEN** the frontend SHALL attempt to refresh the token before sending the request

#### Scenario: Token refresh fails
- **WHEN** token refresh fails because the Keycloak session is no longer valid
- **THEN** the frontend SHALL clear its browser-session auth state and require login again

#### Scenario: User logs out
- **WHEN** the user logs out of PartyHub
- **THEN** the frontend SHALL clear local auth session data and redirect to Keycloak logout for the `partyhub` realm

### Requirement: Browser tokens are not persisted long term
The frontend SHALL avoid long-lived browser persistence of Keycloak tokens.

#### Scenario: Tokens are stored for page navigation
- **WHEN** the plain JavaScript multi-page frontend needs to preserve authentication across same-tab navigation
- **THEN** it SHALL store token session data in `sessionStorage` or memory and SHALL NOT store Keycloak tokens in `localStorage`

#### Scenario: Logout clears token state
- **WHEN** logout completes or authentication becomes invalid
- **THEN** the frontend SHALL remove stored token session data from the browser tab

### Requirement: Backend validates Keycloak bearer tokens
The Quarkus backend SHALL validate Keycloak-issued bearer access tokens for protected endpoints using the `partyhub` realm issuer and JWKS endpoint.

#### Scenario: Valid token is presented
- **WHEN** a protected endpoint receives a bearer token issued by the configured `partyhub` realm and signed by a current realm key
- **THEN** Quarkus SHALL authenticate the request

#### Scenario: Invalid token is presented
- **WHEN** a protected endpoint receives a missing, expired, malformed, or wrong-issuer token
- **THEN** Quarkus SHALL reject the request

#### Scenario: Realm role is present
- **WHEN** a Keycloak access token contains realm roles under `realm_access.roles`
- **THEN** the backend SHALL make those roles available for role-based authorization

### Requirement: PartyHub users link to Keycloak identities
The backend SHALL link authenticated Keycloak subjects to PartyHub user records.

#### Scenario: Linked user exists
- **WHEN** a valid Keycloak token has a `sub` value that matches a PartyHub user's stored Keycloak ID
- **THEN** the backend SHALL use that PartyHub user as the acting user

#### Scenario: Existing user matches token claims
- **WHEN** a valid Keycloak token has no existing Keycloak-ID link but its username or email matches one unlinked PartyHub user
- **THEN** the backend SHALL link that PartyHub user to the token subject and use it as the acting user

#### Scenario: No matching PartyHub user exists
- **WHEN** a valid Keycloak token has no existing link and no matching PartyHub user
- **THEN** the backend SHALL create a minimal PartyHub user from token claims or return an explicit onboarding-required response

### Requirement: Protected APIs use authenticated acting-user identity
Protected PartyHub APIs SHALL derive the caller's acting-user identity from the validated Keycloak token.

#### Scenario: Create party uses authenticated user
- **WHEN** an authenticated browser user creates a party
- **THEN** the backend SHALL assign the party host from the authenticated PartyHub user resolved from the token

#### Scenario: Join party uses authenticated user
- **WHEN** an authenticated browser user joins or leaves a party
- **THEN** the backend SHALL update attendance for the authenticated PartyHub user resolved from the token

#### Scenario: Notification access uses authenticated user
- **WHEN** an authenticated browser user requests notifications
- **THEN** the backend SHALL return notifications for the authenticated PartyHub user resolved from the token
