# Quality expectations and test evidence

Group 11.4, inspected 2026-09-30 at `3a3f6ed` (source unchanged since `9487ccb`). This record separates three things: **accepted quality expectations**, which have spec or decision authority; **declared build or test configuration**; and **execution evidence**. **No JUnit, HTTPYac, browser, iOS, CI or coverage command was run in Group 11.** Every test listed below is test-present-but-not-run under G013.

## Accepted quality expectations (D025)

Only these expectations carry accepted authority. Each is already normative in a main spec. This record adds no new target.

| Quality area | Accepted source | What is accepted | Not accepted / open |
|---|---|---|---|
| Authentication | AUTH-01-AUTH-12, D001, ENV-11 | Validated Keycloak bearer identity for protected actions; numeric IDs are insufficient; browser PKCE/session and native Keychain minimums; bypass is non-authoritative | Provider logout/revocation (Q013); multi-match linking (Q012) |
| Privacy / access | SOC-01, SOC-04-SOC-11, PARTY-03-PARTY-07, PARTY-14, PARTY-17, MEDIA-01-MEDIA-03, D015-D022 | Audience-specific profile projections, recipient-private requests and notifications, same-user settings, Viewer predicates for private parties/media, device-local location, no shared location | Retention periods, account deletion and orphan cleanup (Q016) |
| Input validation | PARTY-12/PARTY-13, MEDIA-03, SOC-07, AUTH scenarios | Lifecycle field boundaries, atomic rejection, JPEG/PNG/GIF/WebP up to 5 MiB, invalid picture leaves the previous one | Exact status codes/envelopes (Q014); profile-text constraints are not specified beyond SOC-06 |
| Failure isolation | SOC-10, SOC-11, PARTY-18, PARTY-19, MEDIA-03 | Delivery failures do not roll back domain actions; permission/EventKit/storage failures leave consistent state | Retry timing, alerting, delivery receipts (Q018) |
| Environment | ENV-01-ENV-11 | Local Keycloak/DB/realm/client/bypass contract | Deployed durability, backups, availability (Q015, Q018) |
| Accessibility | none | — | No accepted browser or iOS accessibility target (Q017) |
| Performance / capacity | none | — | No accepted latency, throughput or scale target. The design forbids inventing one. |

Declared but not accepted: the `pom.xml` JaCoCo `check` execution (phase `test`) requires a BUNDLE INSTRUCTION covered ratio of at least 0.50. It is a build gate that can fail `mvn test`, not a product requirement. Its current result is unknown because no test was run.

## Repository guidance vs source

`AGENTS.md` describes controls the source does not implement. The claims are repository guidance, not accepted specs, so they are recorded as G064:

| AGENTS.md claim | Source observation |
|---|---|
| All REST endpoints use `@Valid` | Six endpoints use `@Valid` (rows 2, 15, 18, 36, 44, 56); other JSON/multipart endpoints do not. |
| `@SafeText`, `@NoHtml`, `@ValidPartyName` protect inputs | Only `@ValidPartyName` is applied (`PartyCreateDto.title`). `@SafeText` is imported but not applied in `UserLocationUpdateDto`; `@NoHtml` is unused. Validator unit tests exist. |
| Validation groups `OnCreate`/`OnUpdate` enforce create vs update | Groups are declared on `PartyCreateDto`, but no resource activates them (`@ConvertGroup`/`@Validated` absent), so group-only constraints are not enforced (G029). |
| Output encoding with OWASP Java Encoder | Dependency declared in `pom.xml`; no `Encode.` call in main source. |
| CI runs java-sql-inspector | No such step in `.github/workflows/*`. Native SQL in `PartyResource.updateToken`/`UserResource.updateDeviceToken`/`NotificationSchemaCompatibility` is parameterized or constant. |
| In-memory H2 for tests, PostgreSQL for dev/prod | Matches test and application properties. |

## Test configuration and identity

| Suite | Configuration | Identity used | Consequence |
|---|---|---|---|
| JUnit/RestAssured (`src/test/java`, 28 classes, 252 static `@Test` per inventory) | `src/test/resources/application.properties`: H2 `MODE=PostgreSQL`, drop-and-create, no seed, port 8082, **`quarkus.smallrye-jwt.enabled=false`**, **bypass true**, mailer mock, SMS disabled | `X-User-Id` in `PartyResourceTest`, `InvitationResourceTest`, `NotificationResourceTest`, `UserNotificationSettingsResourceTest`; `@TestSecurity` in `CurrentUserResolverTest`, `PartyResourceTest`, `QrResourceTest`, `UserResourceTest` | Domain behaviour under synthetic identity. They do not verify JWT signature/issuer/expiry or numeric-only rejection (ENV-11). H2 differs from PostgreSQL (`NotificationSchemaCompatibility` is skipped on H2). |
| HTTPYac (`api/`, 9 files, 97 request blocks) | Against `quarkus:dev` on 8080: dev profile, bypass true, drop-and-create + `import.sql`; `.httpyacrc.json` `failOnError: true`, sequential | `X-User-Id` in 7 of 9 files (`media.http`, `profilePicture.http` are anonymous) | Smoke/contract evidence under the bypass and seed data; `api/README_TESTS.md` pass counts are historical. |
| Browser | None (`e2e/` holds only `.gitignore`) | — | No automated browser PKCE, UI or accessibility test. |
| iOS | No XCTest target in `PartyHubiOS.xcodeproj` | — | No automated native auth, map, permission, CoreLocation or EventKit test. |
| Keycloak realm | None | — | ENV-04-ENV-10 are verified by file inspection only. |

## CI evidence map

| Workflow | Trigger / gate | Quality evidence it would produce | Limits |
|---|---|---|---|
| `test.yml` | Push to `main` touching `keycloak/`, `src/`, `api/`, `pom.xml`, Compose or workflows; manual | JUnit results and JaCoCo check (`mvn clean test`); HTTPYac results uploaded as `api-test-results` (7-day retention) | No real-JWT job; iOS/browser untested; runs on `main` only (no PR trigger). No run result is recorded in this repository. |
| `push.yaml` | `workflow_run` of Test, **only if conclusion is success** | Built images | `-DskipTests`; relies on the Test gate. |
| `deploy.yml` | `workflow_run` of Build and Push on **completion (any conclusion)**; manual | None; resets data | Can deploy after a failed image build (the previous `latest` images); destructive reset (G057, G061). |

## Assertion mapping by accepted capability

Detailed per-requirement test mapping stays in [coverage.md](coverage.md) and each domain evidence file. Summary:

| Capability | Test presence (not run) | Main missing evidence |
|---|---|---|
| `user-auth-and-identity` | `CurrentUserResolverTest` (3), `UserRepositoryTest` linkage | Real tokens, browser PKCE, native flows (G013, G021-G023) |
| `social-and-notifications` | Follow/notification/settings repository and resource tests, digest and push tests | Typed events, audiences, preference gates, delivery failure (G040-G045) |
| `party-discovery-and-management` | `PartyResourceTest` (30), `PartyRepositoryTest`, `InvitationRepositoryTest`/`InvitationResourceTest`, `FilterDtoTest`, validator tests, HTTPYac `party.http`/`invitation.http` | Ownership denial (G003), private visibility across branches (G009/G034), iOS map/radius/visit/calendar (no iOS tests) |
| `party-media-gallery` | `MediaRepositoryTest` (7), HTTPYac `media.http` | Viewer boundary, upload validation, serving route (G036-G038, G058) |
| `map-radius-control` | none (iOS) | All scenarios |
| `local-keycloak-environment` | none | Import/startup/real-token checks (ENV-09/ENV-11) |

## Open quality decisions (concrete next actions)

- **Q015:** Decide whether the deployed environment is a resettable demonstration or must keep data across deploys. Next action: product owner decision; then either document reset-on-deploy or remove the schema drop and separate the Keycloak database (G057).
- **Q016:** Decide retention and deletion for users, parties, media files, profile pictures, notifications and QR/location rows, including account deletion. Next action: a privacy/retention decision, then a bounded cleanup change (G058/G065).
- **Q017:** Decide whether any browser/iOS accessibility level is required, for example a named WCAG level for the browser and VoiceOver/Dynamic Type support for iOS. Next action: product decision. Until then, no accessibility requirement is accepted.
- **Q018:** Decide operational reliability expectations: backups, availability, email retry/alerting, and whether deploys require a green Test/Build run. Next action: operations decision. The deploy gating defect (G061) can be fixed without choosing numeric targets.
