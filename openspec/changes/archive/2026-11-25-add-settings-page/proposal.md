# Proposal

## Why

Account-related controls are scattered or missing: "Edit Account" and "Logout" sit as buttons on the own profile page, notification preferences have a backend API but no browser UI, the app only exists in a dark look, and there is no way to change the password or the login e-mail, to choose who may follow you, or to block someone. A central settings area (reachable from the own profile, Instagram-style) gives these controls one home, and makes every choice persist on the account so it survives logout, reload and other browsers.

## What Changes

- New browser **settings area** `/settings/` with an overview page and one sub-page per section, reachable only through a gear icon on the **own** profile (top right) and only for logged-in users.
- **Profile editing moves into settings.** The "Edit Account", "Dashboard" and "Logout" buttons are removed from the profile page and offered in settings; the old `editProfile/editProfile.html` URL redirects to the new settings sub-page.
- **Appearance:** Light / Dark / System theme, applied app-wide without reload and without a flash of the wrong theme. Default System. A light colour palette is added to the design tokens.
- **Settings persistence:** account-level preferences (theme, notification preferences, privacy) are stored server-side per user; the browser only caches the theme to avoid flicker, and the server value always wins.
- **Profile edit:** dirty-aware save button, inline field errors, unsaved-changes guard, remove profile picture. **BREAKING (API):** the profile update no longer changes the e-mail address.
- **E-mail change via Keycloak-connected flow:** requires a fresh Keycloak re-authentication (current password), sends a single-use, 24 h confirmation link to the new address and a "this wasn't me" notice to the old address, keeps the old address valid until confirmation, shows "change pending" with resend/cancel, and updates the Keycloak account and the PartyHub profile on confirmation, with success mails to both addresses.
- **Password change via Keycloak:** started from settings as a Keycloak application-initiated action (current password re-entered, new password twice, realm password policy). Every password change, including "forgot password" resets, sends a "your password was changed" mail with a "this wasn't me" link.
- **Security e-mails are always sent**, independent of notification preferences.
- **Notification settings UI** with a master switch and per-category switches for invitations, invitation responses, party updates, party cancellations, follow events and unfollows. The master switch keeps the individual values. New **unfollow notification** for the followed user.
- **Private / public account. BREAKING (behaviour):** public accounts can be followed directly; private accounts keep today's request model and hide their profile content from non-followers. Switching to private keeps existing followers; switching to public accepts all open requests after a confirmation. Existing accounts start as private so nothing changes for them until they opt in; accounts created after this change start public.
- **Blocking:** block from another user's profile, list and unblock in settings. Blocking removes follows in both directions, hides profiles, search results and hosted parties in both directions, and prevents follow requests and private-party invitations between the two users.
- **Share profile:** Web Share API with copy-link fallback; logged-out visitors are sent through login and then land on the profile.
- **Logout** moves into settings with a confirmation dialog.
- **Out of scope / later:** account switching (conflicts with the session-only token requirement), two-factor authentication, active sessions/devices, muted accounts, interaction limits (messages/mentions/comments do not exist), activity status, app language, data export, account deactivation/deletion, website link on profile, profile QR code, help/legal info pages, iOS app.

## Capabilities

### New Capabilities
- `user-settings`: settings area structure and navigation, server-side persistence and caching of account preferences, theme selection, and logout from settings.
- `account-security`: Keycloak-connected e-mail change and password change, security e-mails and their tokens, rate limits and delivery failure handling.
- `account-privacy-and-blocking`: private/public accounts, blocking and unblocking, and profile sharing.

### Modified Capabilities
- `social-and-notifications`: follow model gains direct follows for public accounts; profile reads respect privacy and blocks; profile editing moves to settings and no longer changes the e-mail; profile picture can be removed; notification preferences gain a master switch and finer categories; new unfollow notification.
- `user-auth-and-identity`: the PartyHub profile e-mail follows the Keycloak account e-mail; the backend may use a Keycloak service account to update the user's e-mail.

## Impact

- **Backend (Quarkus):** new packages `at.htl.settings`, `at.htl.security` (e-mail change, Keycloak admin client), `at.htl.block`; changes in `UserResource`, `FollowRepository`, `PartyRepository` (discovery filters), `NotificationType`, `OutOfAppNotificationService`, `notificationsettings`. Keycloak Admin REST calls via the JDK HTTP client (no new dependency).
- **Database:** Flyway migration `V12__settings_privacy_blocking.sql` (`user_settings`, `user_blocks`, `email_change_requests`, new notification-settings columns, `users.is_private`). No row deletion of existing data.
- **Keycloak:** new confidential service-account client for the backend (`manage-users` limited to the realm), events with the `email` listener, password policy, PartyHub e-mail theme templates for the password-changed mail. Local: `keycloak/realm-dev.json`; production: an idempotent configuration script (`scripts/keycloak-configure-settings.sh`, `kcadm.sh` inside the Keycloak pod via `kubectl exec`) that the developer runs, since the team has no Admin Console access; `realm-staging.json` for fresh installs.
- **Frontend:** new `settings/` pages, `theme-boot.js` in every page head, light palette in `design-system.css`/`global.css`, profile page header changes, block menu on foreign profiles.
- **Local environment:** Mailpit container in `docker-compose.yaml` for dev mail testing.
- **API contract:** new `/api/me/...` settings, e-mail change and block endpoints; `PUT /api/users/{id}` ignores `email`. `docs/openspec-baseline/api-contract-matrix.md` is updated.
