# Design

## Context

- Both backend routes are `PUT` with a `?token=` query parameter, `@Authenticated @Transactional`, and they derive the user from the caller.
- Both iOS call sites (`Partynotificationsystem.swift:567`, `PartyHubiOSApp.swift:279`) `POST` JSON to `/api/users/{id}/device-token`, a route that doesn't exist. So no client has ever stored a token through either backend route (G044, D024 in `docs/openspec-baseline/decisions.md`).
- `UserNotificationSettings` initializes `pushEnabled = true` and `smsEnabled = true`. The spec requires `false` while the channels are unsupported.

## Goals / Non-Goals

**Goals:** one token route, no dead push code, and settings defaults that match the spec.

**Non-Goals:**
- Implementing push delivery. That needs an accepted adapter and a client contract, which would be a spec change (`/opsx:propose`).
- Changing the iOS client. Its call stays broken, as it is today. Because push is unsupported, no user-visible behaviour depends on it. Fixing the iOS route belongs with the future push change, which will define the wire contract (Q014).
- Rewriting existing settings rows. Push and SMS aren't delivered regardless of the stored flag, and an `UPDATE` across user data needs a migration and a PR note for little benefit.

## Decisions

- **Delete instead of wire in.** The spec explicitly keeps push unsupported. Wiring in an unauthenticated sandbox APNs call would contradict it. Git history keeps the class if push is designed later.
- **Keep `/api/users/device-token`.** The token belongs to the user, not to parties, and the audit recommends it.
- **Entity update:** `userRepository` (or `em.find(User.class, id)`) followed by `setDeviceToken(token)` inside the existing `@Transactional`. No native SQL.
- **Validation:** `@QueryParam("token") @NotBlank(message=...) @Size(max=255, message=...)`. Quarkus validates resource method parameters when `hibernate-validator` is present, so a separate DTO isn't needed for a query parameter. The `@Valid` rule only applies to request bodies.

## Risks / Trade-offs

- [An unknown external client calls `/api/parties/device-token`] → the source scan found none, and the API contract matrix already marks it "No client". The route will return 404 after this change.
- [Removing `MockPushService` breaks a test that injects it] → the scan found no other references. The test suite confirms it.
