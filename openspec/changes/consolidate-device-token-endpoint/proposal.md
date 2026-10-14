# Proposal

## Why

Audit items 1.2 and 1.3 and baseline gap G044:
- `PushNotificationService` is a raw APNs-sandbox helper that no production code calls.
- Two identical device-token routes (`PUT /api/parties/device-token` and `PUT /api/users/device-token`) each write the token with a native `UPDATE` query.
- New users get push and SMS enabled by default.

The accepted spec (`social-and-notifications`, "Notification delivery is channel-honest and failure-tolerant" and "Notification preferences are same-user and independently effective") says push and SMS are unsupported channels that SHALL default disabled. So the code should match that, not pretend push exists.

## What Changes

- Delete `PushNotificationService`, `PushNotificationServiceTest` and `MockPushService`. This removes the only `System.out`/`printStackTrace` use and one native query.
- **BREAKING** Remove `PUT /api/parties/device-token`. No client calls it (both iOS call sites use a different route; see design).
- `PUT /api/users/device-token` stays as the single caller-derived token route. It sets the token through the `User` entity instead of a native `UPDATE`, rejects a blank token with 400, and caps length at 255 (the column size).
- New notification settings default `pushEnabled` and `smsEnabled` to `false`, as the spec requires. Existing rows are not changed.

## Capabilities

### New Capabilities

### Modified Capabilities

None. The change brings the code in line with the existing `social-and-notifications` requirements. `.openspec.yaml` sets `skip_specs: true`.

## Impact

- Code: delete `at/htl/PushNotificationService.java`. Change `PartyResource` (remove `updateToken`), `UserResource.updateDeviceToken` and `UserNotificationSettings` defaults.
- Tests: remove the push tests and the `/api/parties/device-token` cases in `PartyResourceTest`, and extend `UserResourceTest`.
- API docs: `docs/openspec-baseline/api-contract-matrix.md` row 19 and `inventory.md` row 19.
- No schema change. No remaining `createNativeQuery` calls, so no raw-SQL PR note is needed beyond saying that the three native queries were removed.
