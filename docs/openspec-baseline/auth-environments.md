# Authentication environment evidence

Step 2.3, source snapshot `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, 2026-09-23. This is a record of repository declarations, **not effective runtime configuration or a live cluster check**. Accepted policy remains [AUTH-02/07](coverage.md#auth-02) / D001: protected actions require validated Keycloak bearer identity, and numeric IDs alone are insufficient. Development convenience does not change that policy.

## Normal JWT identity

[application.properties](../../src/main/resources/application.properties):7–15 declares bypass disabled by default, issuer from `partyhub.keycloak.issuer`, JWT verification issuer/JWKS and role extraction at `realm_access/roles`. [pom.xml](../../pom.xml) includes SmallRye JWT. [CurrentUserResolver](../../src/main/java/at/htl/auth/CurrentUserResolver.java) links validated subject to a PartyHub user; its numeric fallback is separately tracked under G019. Every protected resource in [access-matrix.md](access-matrix.md) uses `@Authenticated`; no `@RolesAllowed` check or admin override was found in these seven resources.

Accepted scenarios: a correctly signed token from the configured realm authenticates; missing, expired, malformed or wrong-issuer tokens are rejected; realm roles are made available. Configuration and synthetic test identities do not verify those scenarios. No audience guarantee, provider availability or successful signature check is inferred beyond the existing specification.

## Declared profiles and overrides

| Context | JWT / issuer declaration | Bypass declaration | Interpretation |
|---|---|---|---|
| Base application | Issuer defaults to `http://localhost:8000/realms/partyhub`; JWKS derives from issuer. | `partyhub.auth.bypass-enabled=${PARTYHUB_AUTH_BYPASS_ENABLED:false}`. | Default numeric-header bypass is off; environment can supply another value. No runtime config read performed. |
| `%dev` | Inherits base JWT settings unless overridden externally. | Explicit `true` at application.properties:20. | Source permits alternate identity; not a compliant real-token auth test configuration. |
| `%staging` | Inherits issuer expression unless overridden externally. | Explicit `true` at application.properties:31. | Same policy conflict; profile name does not make numeric identity trustworthy. |
| `%prod` without external bypass override | Production realm issuer at application.properties:44; JWKS follows issuer. | No prod-specific true value; base default false absent override. | Declared default supports normal bearer path; actual deployed values unverified. |
| Test resources | [test properties](../../src/test/resources/application.properties):14 disables SmallRye JWT. | Explicit true at line 16. | Existing resource tests using `X-User-Id` exercise alternate identity/domain behavior, not real JWT acceptance or numeric-only rejection. `@TestSecurity` is another synthetic source. |
| Kubernetes application manifest | [k8s/quarkus.yaml](../../k8s/quarkus.yaml):33–39 selects prod and supplies cloud issuer. | Environment variable `PARTYHUB_AUTH_BYPASS_ENABLED` explicitly `"true"`. | Repository declaration contradicts accepted protected-action identity (G002). This is not a report that a running cluster currently has the override. No manifest was changed. |

## Bypass mechanism and unresolved runtime precedence

[XUserIdAuthFilter.java](../../src/main/java/at/htl/auth/XUserIdAuthFilter.java):27–53 returns no identity when disabled/header absent, but when enabled creates an authenticated principal and `user` role from **any nonblank `X-User-Id` string**, without token validation or checking user existence. It is not restricted to digits in the mechanism. The resolver tries numeric database lookup; other values or absent numeric records can proceed through link/create fallback. This evidence sharpens G002; it does not approve that behavior for any product environment.

No global HTTP path policy or second custom mechanism beyond this class was found in the inspected main Java/properties/manifest sources. The matrix combines that search, route annotations, resolver calls and repository predicates. It does not assume absent annotations bypass framework behavior for malformed credentials, nor that all public endpoints return successfully for invalid input. Mechanism ordering when both bearer and bypass header are supplied, framework challenge/status behavior and external overrides were not executed; no precedence guarantee is made.

## Client configuration and realm declarations

| Surface | Observed configuration | Limits |
|---|---|---|
| Public config | [PublicConfigResource.java](../../src/main/java/at/htl/config/PublicConfigResource.java) exposes only `keycloakIssuer`; no caller resolution. | AUTH-10 accepts its public client-bootstrap role; it is not a token or user identity source. |
| Browser | [auth-service.js](../../src/main/resources/META-INF/resources/auth-service.js) fetches issuer; fallback is current origin plus `/keycloak/realms/partyhub`; client `frontend`, callback `/auth/callback.html`. | Config failure can leave an unsuitable fallback in another environment; actual discovery/token connectivity unverified. |
| iOS | [KeycloakConfig.swift](../../PartyHubiOS/PartyHubiOS/KeycloakConfig.swift) fetches same issuer; fallback is declared cloud realm; client `partyhub-ios`, callback `partyhub.auth://callback`. | Client IDs, callback and storage are platform-specific, not browser parity requirements. |
| Realm files | [realm-dev.json](../../keycloak/realm-dev.json) and [realm-staging.json](../../keycloak/realm-staging.json) both declare public browser/native clients, standard flow, S256, disabled direct grants. Both allow registration/reset; dev `verifyEmail:false`, staging `true`. | These are import-file contents, not current provider policy. No passwords or signing material are reproduced here. |
| Import inputs | [Compose](../../docker-compose.yaml) mounts dev realm; [Dockerfile.keycloak](../../Dockerfile.keycloak) also copies staging realm. | Same realm name, unverified fresh/existing-volume selection; G005/G018 owned by Step 11. Do not infer mandatory email verification or successful demo login from one file. |

## Verification handoff

No services were started and no network/provider/cluster probe was performed. Later bounded implementation verification should separately exercise valid/invalid/wrong-issuer/expired JWTs, numeric-only rejection with bypass off, and explicitly isolated bypass fixtures. It must record actual profile and resolved non-secret auth settings. Do not use passing bypass-based tests as evidence that normal authentication conforms. This document requires neither deployment nor configuration fixes in the specification task.
