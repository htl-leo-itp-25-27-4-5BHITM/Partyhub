# user-auth-and-identity Specification

## Purpose
Defines PartyHub's Keycloak-backed authentication and acting-user contract across browser, iOS, backend APIs and public client bootstrap, including platform-specific sessions, validated bearer identity, user linking and onboarding outcomes.
## Requirements
### Requirement: Browser-based user identity is the current active authentication context
The system SHALL support a browser-based Keycloak identity model in which the active PartyHub user is represented by an authenticated Keycloak browser session and a backend-validated bearer access token.

#### Scenario: Frontend resolves the authenticated acting user
- **WHEN** a PartyHub frontend flow needs the acting user context after Keycloak authentication
- **THEN** it SHALL resolve that context through the authenticated browser session and backend `/me`-style identity lookup rather than through a stored numeric user ID alone

#### Scenario: Unauthenticated protected page access redirects to login
- **WHEN** a browser user opens a PartyHub page that requires authentication without an active Keycloak-backed browser session
- **THEN** the frontend SHALL start the Keycloak login redirect flow

### Requirement: Backend business actions use validated Keycloak user context
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

### Requirement: Keycloak provides browser login and protected backend authentication
The system SHALL treat Keycloak-based authentication as implemented target behavior for browser login and protected backend access.

#### Scenario: Auth work is implemented
- **WHEN** a change implements login or identity modernization
- **THEN** it SHALL integrate with the local `partyhub` Keycloak realm rather than adding another browser-stored numeric-ID login model

#### Scenario: Legacy user-context compatibility is considered
- **WHEN** Keycloak-based authentication is introduced
- **THEN** protected business actions SHALL NOT require legacy `X-User-Id` or query-parameter identity compatibility

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
The backend SHALL link authenticated Keycloak subjects to PartyHub user records. Every successful first login SHALL end with the subject linked to exactly one PartyHub user, and the backend SHALL NOT choose among several candidate records by guessing.

#### Scenario: Linked user exists
- **WHEN** a valid Keycloak token has a `sub` value that matches a PartyHub user's stored Keycloak ID
- **THEN** the backend SHALL use that PartyHub user as the acting user

#### Scenario: Existing user matches token claims
- **WHEN** a valid Keycloak token has no existing Keycloak-ID link but its username or email matches one unlinked PartyHub user
- **THEN** the backend SHALL link that PartyHub user to the token subject and use it as the acting user

#### Scenario: No matching PartyHub user exists
- **WHEN** a valid Keycloak token has no existing link and no matching PartyHub user
- **THEN** the backend SHALL create a minimal PartyHub user from token claims, link it to the token subject and use it as the acting user; profile details MAY be completed afterwards

#### Scenario: Several unlinked users match token claims
- **WHEN** a valid Keycloak token has no existing link and its username or email matches more than one unlinked PartyHub user
- **THEN** the backend SHALL NOT link any of those users, SHALL create a minimal PartyHub user from token claims, link it to the token subject and use it as the acting user

#### Scenario: Seeded test users stay unlinked data
- **WHEN** PartyHub test or seed data is loaded
- **THEN** its user records carry no Keycloak ID and gain one only when a login matches exactly one of them through the unique-match rule

### Requirement: Protected APIs use authenticated acting-user identity
Protected PartyHub APIs SHALL derive the caller's acting-user identity from the validated Keycloak token for browser, iOS and other API callers. Authentication SHALL NOT replace the ownership, recipient or visibility checks required by the affected capability.

#### Scenario: Create party uses authenticated user
- **WHEN** an authenticated browser or iOS user creates a party
- **THEN** the backend SHALL assign the party host from the authenticated PartyHub user resolved from the token

#### Scenario: Join party uses authenticated user
- **WHEN** an authenticated browser or iOS user joins or leaves a party
- **THEN** the backend SHALL update attendance for the authenticated PartyHub user resolved from the token

#### Scenario: Notification access uses authenticated user
- **WHEN** an authenticated browser or iOS user requests notifications
- **THEN** the backend SHALL return notifications for the authenticated PartyHub user resolved from the token

#### Scenario: Authenticated identity does not grant object authority
- **WHEN** a caller presents a valid token but lacks the ownership, recipient or visibility permission required for the requested operation by its capability
- **THEN** the backend SHALL reject the operation without treating authentication alone as that permission

### Requirement: Clients obtain authentication configuration before sign-in
PartyHub SHALL provide its Keycloak issuer through a public authentication-bootstrap endpoint for browser and iOS clients without requiring an authenticated PartyHub session. The endpoint SHALL expose public authentication configuration rather than tokens, credentials or private user data. Clients SHALL use their platform's configured public client identity and callback URI with the issuer.

#### Scenario: Signed-out client obtains the issuer
- **WHEN** a signed-out browser or iOS client requests `/api/config/public`
- **THEN** the backend SHALL return the configured Keycloak issuer without requiring caller identity
- **AND** obtaining that configuration SHALL NOT authenticate the client or create an acting-user context

#### Scenario: Authentication configuration cannot be loaded
- **WHEN** a client cannot obtain usable public authentication configuration
- **THEN** it SHALL either use its configured fallback issuer or present a recoverable sign-in configuration error
- **AND** it SHALL NOT treat configuration failure or fallback selection as successful authentication

### Requirement: iOS login uses Keycloak authorization code with PKCE
The iOS client SHALL authenticate through Keycloak's web authorization flow using its native public client, Authorization Code Flow with S256 PKCE, a fresh state and nonce, and the registered native callback URI. PartyHub SHALL NOT collect the user's Keycloak password or use the password grant. A new native PartyHub session SHALL require a callback bound to the initiating transaction and a successful bearer-authenticated PartyHub user lookup under the existing subject-linking requirement.

#### Scenario: Native login starts
- **WHEN** a signed-out iOS user starts sign-in
- **THEN** the client SHALL open Keycloak web authorization using client `partyhub-ios`, callback `partyhub.auth://callback`, fresh state and nonce, and a challenge derived from the transaction's code verifier

#### Scenario: Native callback completes its transaction
- **WHEN** Keycloak returns an authorization code with state matching the active native login transaction
- **THEN** the client SHALL exchange the code using that transaction's code verifier and native callback URI
- **AND** it SHALL validate the returned ID token's binding to the transaction nonce before establishing the new session

#### Scenario: Native callback state or code is invalid
- **WHEN** the callback has missing or mismatched state, no active transaction, or no authorization code
- **THEN** the client SHALL reject that callback without exchanging the authorization code or establishing a new session

#### Scenario: Native callback nonce is invalid
- **WHEN** the returned ID token has no nonce or a nonce different from the initiating transaction
- **THEN** the client SHALL reject the login response without persisting it as a new authenticated session

#### Scenario: Native login is cancelled or fails
- **WHEN** the user cancels web authentication, the provider returns an error, or code exchange fails
- **THEN** the client SHALL remain without a newly authenticated session and allow the user to start sign-in again

#### Scenario: Native login resolves the PartyHub user
- **WHEN** native token exchange succeeds with a response bound to the login transaction
- **THEN** the client SHALL resolve the PartyHub user through bearer-authenticated `/api/users/me` before establishing its new session
- **AND** it SHALL use the backend-resolved PartyHub ID rather than a numeric deep-link value or locally decoded subject as the local user ID

#### Scenario: Native user resolution cannot complete
- **WHEN** the authenticated PartyHub user lookup fails or returns an explicit onboarding-required outcome instead of a resolved user
- **THEN** the client SHALL NOT establish a completed PartyHub session from the token or a cached numeric ID alone
- **AND** it SHALL expose a recoverable sign-in or onboarding outcome appropriate to the response

### Requirement: iOS manages a token-backed local session
The iOS client SHALL retain native authentication credentials in Keychain, restore only a usable token-backed PartyHub session, refresh access tokens before protected calls when needed, and clear local credentials and acting-user context when the session becomes invalid or the user logs out. The browser sessionStorage restriction SHALL remain browser-specific. This requirement defines local native logout and does not promise provider-session termination or token revocation.

#### Scenario: Native credentials persist across launches
- **WHEN** iOS retains authentication credentials after successful PartyHub user resolution
- **THEN** it SHALL store the tokens in Keychain and retain the associated backend-resolved PartyHub identity
- **AND** a cached numeric ID without usable token credentials SHALL NOT establish authentication

#### Scenario: Native session is restored
- **WHEN** the app starts with stored credentials and associated PartyHub identity
- **THEN** it SHALL establish the authenticated application state only when it has a usable access token or has successfully refreshed the credentials

#### Scenario: Native access token needs refresh
- **WHEN** a protected API call needs a new access token and a refresh token is available
- **THEN** iOS SHALL attempt the refresh before sending the protected request and retain replacement credentials in Keychain after success

#### Scenario: Native session cannot be refreshed
- **WHEN** the access token is no longer usable and a refresh token is absent or the session refresh is rejected as invalid
- **THEN** iOS SHALL clear its local authentication credentials and acting-user context and require sign-in again
- **AND** it SHALL NOT send the protected action with numeric identity as an authentication fallback

#### Scenario: Native protected API request is sent
- **WHEN** an authenticated iOS user invokes a protected PartyHub API
- **THEN** the client SHALL attach a usable bearer access token and the backend SHALL apply the shared authenticated acting-user contract

#### Scenario: Native user logs out locally
- **WHEN** the user completes local iOS logout
- **THEN** the client SHALL remove persisted authentication credentials and its in-memory acting-user context and return to signed-out application state
- **AND** restoring a cached numeric ID SHALL NOT restore protected access
