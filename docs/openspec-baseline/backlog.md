# Prioritized implementation backlog

Group 12.5, 2026-09-30. Each item is a **bounded implementation change** to be proposed through the normal OpenSpec workflow (`/opsx:propose`). It is not another planning phase: its requirements and acceptance scenarios already exist in the main specs. The items were derived from the open gaps in [gaps.md](gaps.md) (G001-G066) and the only remaining question, Q014. Gaps closed by documentation in Group 12 or explicitly deferred are listed at the end.

Priority: **P1** = identity, access, privacy or data loss; **P2** = accepted behaviour or client compatibility broken; **P3** = hygiene or optional. The order within a priority follows the dependencies.

## P1

### B01 Persistent school-cloud deployment
- **Gaps:** G057, G059 (and the deploy-gating half of G061).
- **Requirements:** DEPLOY-01, DEPLOY-02 (D030).
- **Source areas:** `.github/workflows/deploy.yml` (remove `DROP SCHEMA` and `import.sql` replay; gate on `workflow_run.conclusion == 'success'`), `k8s/keycloak.yaml` (own database or schema instead of `demo`), `k8s/postgres.yaml`/init (create the Keycloak DB), `application.properties` `%prod` schema handling, a versioned migration tool (Flyway or Liquibase) absorbing `NotificationSchemaCompatibility`.
- **Acceptance scenarios:** all 8 DEPLOY scenarios, in particular *Application data survives a deployment*, *Keycloak accounts survive a deployment*, *Failed pipeline does not deploy*, *Seed data is not replayed*, *Existing realm is not overwritten*.
- **Dependencies:** none. Do this first, because until it lands every deploy still erases school-cloud data. The first run needs a one-time plan for moving Keycloak out of the `demo` database.
- **Status:** Implemented in change `persistent-school-cloud-deployment` (Flyway V1/V2, Keycloak `keycloak` database, gated in-place deploy). It is complete once the one-time cut-over in [`../deployment-cutover.md`](../deployment-cutover.md) has run on the school cloud. Follow-up: scheduled backups (G067, B21).

### B02 Remove the identity bypass from production and numeric subjects
- **Gaps:** G002, G019.
- **Requirements:** AUTH-02, AUTH-07, AUTH-09, ENV-11 (D001, D023).
- **Source areas:** `k8s/quarkus.yaml` (`PARTYHUB_AUTH_BYPASS_ENABLED`), `auth/XUserIdAuthFilter.java`, `auth/CurrentUserResolver.tryFindByNumericId`.
- **Acceptance scenarios:** ENV-11 *Bypass is off by default*; the AUTH-07 invalid/expired/wrong-issuer token rejections; AUTH-09 acting-user derivation from the validated subject only.
- **Dependencies:** B03 should land with or before it, so that real-token tests replace the bypass-based coverage.

### B03 Real-token test job
- **Gaps:** G061 (tests half), G013.
- **Requirements:** ENV-08, ENV-11 *Local real-token verification is possible*, AUTH-07/AUTH-08.
- **Source areas:** `.github/workflows/test.yml` (a job with bypass disabled that obtains demo-user tokens from the Compose realm), a new JUnit or HTTPYac suite, `src/test/resources/application.properties` (keep a bypass-free profile).
- **Acceptance scenarios:** valid demo token accepted; `X-User-Id`-only request rejected; wrong issuer rejected; first login links the demo user (AUTH-08 *Existing user matches token claims*).
- **Dependencies:** B17 (ENV-09 realm import) makes the realm deterministic.

### B04 Unique first-login linking
- **Gaps:** G020.
- **Requirements:** AUTH-08 (modified by D028).
- **Source areas:** `auth/CurrentUserResolver.linkOrCreateUser`, `user/UserRepository` lookup by username/email.
- **Acceptance scenarios:** *Several unlinked users match token claims*, *Seeded test users stay unlinked data*, *No matching PartyHub user exists* (always creates and links).
- **Dependencies:** B03 for real-token verification.

### B05 Party ownership and lifecycle validation
- **Gaps:** G003, G029, G030, and the validation half of G064.
- **Requirements:** PARTY-05, PARTY-12, PARTY-13 (D016).
- **Source areas:** `party/PartyRepository.updateParty` (stored-host check), `party/PartyCreateDto` group activation, `PartyResource` create/update, browser `addParty.js`, iOS `ApiService.swift`/`PartyDetailView.swift` payloads.
- **Acceptance scenarios:** the PARTY-05 non-host update denial and PARTY-12 atomic rejection scenarios; PARTY-13 unedited fields preserved.
- **Dependencies:** the ownership check is independent. The client payload part waits for the Q014 PUT decision (B11).

### B06 Private visibility across party queries and details
- **Gaps:** G009, G034.
- **Requirements:** PARTY-01, PARTY-03, PARTY-04, PARTY-16 (D007, D017, D018).
- **Source areas:** `party/PartyRepository` query branches (`findWithFilters`, legacy `q`/`theme`/date branches, `sortParty`, `getPartiesByUser`), `PartyResource.getParties`/`getParty`.
- **Acceptance scenarios:** PARTY-16 visibility-first composition and pagination; PARTY-04 declined/withdrawn invitations do not grant visibility.
- **Dependencies:** none.

### B07 Profile and social privacy projections
- **Gaps:** G026, G027.
- **Requirements:** SOC-04, SOC-05, SOC-06 (D015).
- **Source areas:** `user/UserResource` read endpoints (rows 37-43, 48-51), DTOs replacing raw `User` entities.
- **Acceptance scenarios:** SOC-05 audience-specific projections; recipient-private pending requests; caller-relative status.
- **Dependencies:** B02, so that authenticated reads use real identity.

### B08 Gallery access, serving and persistent storage
- **Gaps:** G036, G037, G058.
- **Requirements:** MEDIA-01, MEDIA-03, DEPLOY-01 *Uploaded files survive pod replacement* (D019).
- **Source areas:** `media/MediaRepository` (upload dir → configurable PVC path, a Viewer-checked item route replacing classpath reads), `PartyResource` rows 26/29, `UserResource` row 57, browser `gallery.js` `/api/media/{id}`.
- **Acceptance scenarios:** MEDIA-01/MEDIA-03 anonymous public viewing, private Viewer-only, 5 MiB/type validation, failure-consistent storage.
- **Dependencies:** B01 (the storage volume must persist).

### B09 Invitation and attendance authority and projections
- **Gaps:** G017, G031, G032, G033.
- **Requirements:** PARTY-06, PARTY-07, PARTY-14, SOC-02 (D005, D017).
- **Source areas:** `invitation/InvitationRepository`, `PartyRepository` attend/leave/members, `InvitationResource`, browser `notifications.js`/`backend-functions.js`, iOS `InvitationsViewModel.swift`/`InviteUsersView.swift`.
- **Acceptance scenarios:** mutual-contact enforcement, host-only management, repeated-action no-ops, actor-scoped projections.
- **Dependencies:** B06.

### B10 Contain the deferred QR and shared-location endpoints
- **Gaps:** G007, G008, G046-G050 (QR); G051-G054 (location).
- **Requirements:** D021 (QR deferred), PARTY-17 / D022 (no shared location), AUTH-02.
- **Source areas:** `qr/*`, `PartyResource.getPartyLocations`, `UserResource` rows 55/56, `user_location/*`, browser `qr-login.html`/`profile.js`/`index.js`, iOS attendee-location views (G053).
- **Acceptance scenarios:** PARTY-17 shared-location exclusion; no QR payload or token authenticates (D021).
- **Dependencies:** Q014 for the status returned by retired routes (a default is available). The iOS parts touch client code; D029 only freezes iOS logout, not these.

### B22 Stop seeding demo locations in production
- **Gaps:** G068.
- **Requirements:** PARTY-17 / D022 (no shared location), DEPLOY-01 (D030, persistent data).
- **Source areas:** `DataSeeder.java` (demo `user_location` rows for the first six users in every profile, plus the `follow_status` reference rows), `db/migration/` (a migration for the `follow_status` rows if they move there), `db/dev-seed/afterMigrate.sql`.
- **Acceptance scenarios:** a `%prod` startup against a database with users writes no `user_location` rows; `follow_status` still holds pending/accepted/blocked; existing seeded rows on the school cloud are removed deliberately and documented.
- **Dependencies:** B01 (Flyway), coordinate with B10, which contains the location endpoints.

## P2

### B11 API error envelope and PUT semantics (answers Q014)
- **Gaps:** G062.
- **Requirements:** wire-level only; accepted specs stay wire-agnostic (D024).
- **Work:** decide Q014 first, then add an exception mapper and serializer-built bodies, and document the result in `api-contract-matrix.md`.
- **Dependencies:** unblocks the client parts of B05, B10 and B12.

### B12 Client route compatibility
- **Gaps:** G006, G024, the device-token calls in G044.
- **Requirements:** PARTY-13, SOC-01 (D016, D024).
- **Source areas:** browser `backend-functions.js:112`, `script.js`; iOS `Partynotificationsystem.swift:390,419,567`, `PartyHubiOSApp.swift:279`, `PartyDetailView.swift:339` (debug); follow routes rows 52-54.
- **Acceptance scenarios:** every client call matches a row in `api-contract-matrix.md`.
- **Dependencies:** B11 for the error handling.

### B13 Notification backend contract
- **Gaps:** G040, G041, G042, G043.
- **Requirements:** SOC-03, SOC-08-SOC-11, PARTY-15 (D020).
- **Source areas:** `notification/*`, `notificationsettings/*`, event producers in follow/invitation/party repositories, `PartyEmailDigestService`, `WelcomeEmailService`.
- **Acceptance scenarios:** SOC-03 deterministic recipients and no-op suppression; SOC-08 typed state and cancellation snapshot; SOC-09 defaults; SOC-11 bounded welcome/digest.
- **Dependencies:** B09 (event sources); migrations from B01 for schema changes.

### B14 Notification clients and push boundary
- **Gaps:** G045, G044.
- **Requirements:** SOC-08, SOC-09, SOC-10.
- **Dependencies:** B13. Push stays unsupported until a separate push decision is made.

### B15 Profile-picture consistency
- **Gaps:** G039.
- **Requirements:** SOC-07.
- **Source areas:** `UserResource` rows 45-47, `ProfilePicture`.
- **Dependencies:** B02 (authenticated reads), B01 (persistent storage).

### B16 Browser authentication robustness
- **Gaps:** G021, G022 (browser), G025.
- **Requirements:** AUTH-04, AUTH-05, AUTH-10.
- **Source areas:** `auth-service.js`, `auth/callback.html`, registration redirects.

### B17 Local realm import source of truth
- **Gaps:** G018.
- **Requirements:** ENV-09.
- **Source areas:** `Dockerfile.keycloak` (do not copy `realm-staging.json` into the image used by Compose, e.g. with a separate target), `docker-compose.yaml`.

### B18 iOS client items
- **Gaps:** G022 (native nonce), G023, G035, G055, G056, G038 (local photos).
- **Requirements:** AUTH-11, AUTH-12, RADIUS-03, PARTY-18, PARTY-19, MEDIA-02.
- **Note:** D029 keeps iOS logout unchanged; the G023 logout/Keychain aspects stay deferred, and the remaining items need an explicit go-ahead for iOS work.

### B21 Scheduled school-cloud database backups
- **Gaps:** G067.
- **Requirements:** DEPLOY-01 (D030), operational safeguard.
- **Source areas:** `k8s/` (for example a `pg_dump` CronJob for `demo` and `keycloak`), backup storage outside `postgres-pvc`, and a restore procedure in the README.
- **Dependencies:** B01.

## P3

### B19 Documentation and tooling hygiene
- **Gaps:** G063 (delete or regenerate the root `openapi.yaml`), G064 (align `AGENTS.md` with the controls that B05 actually adds), G060 (optional: make `sync-import.sh` Kubernetes targeting opt-in).
- **Also:** D027 keeps unauthenticated `POST /api/users` for testing and test data. It is currently reachable in the school cloud; restricting it to non-production profiles is optional and needs the product owner's agreement.

### B20 Optional product expansion (not scheduled)
- **Gaps:** G028 (iOS profile/social parity).
- **Note:** product choice, not a defect.

## Closed or deferred without implementation

| Gap | Disposition |
|---|---|
| G001, G004, G005, G015 | Documentation reconciled in Group 12 (README, historical banners). |
| G010, G011, G014 | Resolved in Groups 6-7. |
| G012 | Radius Purpose repaired in Group 12. |
| G016 | All discovered surfaces are covered or explicitly excluded (Groups 2-12). |
| G060 | README now documents the destructive effects; the script change is optional (B19). |
| G065 | Retention and cleanup explicitly deferred by D031. Observation retained. |
| G066 | Resolved by pinning OpenSpec CLI 1.13.2 (W022). |
