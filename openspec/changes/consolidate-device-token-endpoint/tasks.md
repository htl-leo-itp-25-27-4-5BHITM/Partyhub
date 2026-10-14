# Tasks

## 1. Remove dead push code

- [ ] 1.1 Delete `PushNotificationService.java`, `PushNotificationServiceTest.java` and `MockPushService.java`. Verify that `grep -rn "PushNotificationService\|MockPushService" src` finds nothing and `./mvnw test-compile` succeeds.

## 2. One device-token route

- [ ] 2.1 Remove `PartyResource.updateToken` and its two `PartyResourceTest` cases, along with any `/api/parties/device-token` request in `api/*.http`. Verify that `grep -rn "parties/device-token" src api` finds nothing.
- [ ] 2.2 Change `UserResource.updateDeviceToken` to an entity update with `@NotBlank`/`@Size(max=255)` on the query parameter (both with `message`). Add or extend `UserResourceTest` cases: anonymous → 401; blank token → 400; 256 chars → 400; a valid token is stored on the caller's `User` row and no other row changes. Verify with `./mvnw test -Dtest=UserResourceTest`, and confirm that `grep -rn createNativeQuery src/main` finds nothing.

## 3. Unsupported channels default off

- [ ] 3.1 Set `pushEnabled = false` and `smsEnabled = false` in `UserNotificationSettings`, and check whatever builds the "missing row" effective defaults so it uses the same values. Add a `UserNotificationSettingsResourceTest` case: a new user's settings report push and SMS as `false`, and in-app, email and the three categories as `true`. Verify with `./mvnw test -Dtest=UserNotificationSettingsResourceTest`.

## 4. Integration and docs

- [ ] 4.1 Run `./mvnw clean test` (record count and failures) and the HTTP tests. Do a real Keycloak PKCE login as a demo user, `PUT /api/users/device-token?token=abc` → 200, and `PUT /api/parties/device-token` → 404.
- [ ] 4.2 Update `docs/cleanup-audit.md` items 1.2 and 1.3 and the section 2/3 rows that mention push or native queries, plus `api-contract-matrix.md` row 19 and `inventory.md` rows 19 and the `PushNotificationService` entry. Add the PR link.
