# Tasks

## 1. Keycloak spike and local infrastructure

- [x] 1.1 Spike: in the local Keycloak 26.5 realm enable events with the `email` listener and confirm that both the `kc_action=UPDATE_PASSWORD` action and the "Forgot password?" reset produce an `UPDATE_PASSWORD` event mail; record the result in design.md D7 (choose the SPI fallback if the reset does not)
- [x] 1.2 Add Mailpit to `docker-compose.yaml`, point `%dev` Quarkus mailer and `realm-dev.json` `smtpServer` at it; verify a welcome mail shows up at `http://localhost:8025`
- [x] 1.3 Add `partyhub-backend-admin` confidential client (service account, client credentials only, `manage-users` + `view-users`), password policy `length(8) and notUsername and passwordHistory(1)`, events + `email` listener and `UPDATE_PASSWORD` max auth age 0 to `keycloak/realm-dev.json` and `realm-staging.json`; verify after a fresh local realm import (ask before running `./deploy-local.sh`) that a client-credentials token can be fetched
- [x] 1.4 Add the Keycloak admin client config (`KEYCLOAK_ADMIN_CLIENT_SECRET`, dev default from realm-dev) and verify `./mvnw clean test` still passes
- [x] 1.5 Write idempotent `scripts/keycloak-configure-settings.sh` (`kcadm.sh` via `kubectl exec`, `--local` and `--dry-run`, create/update only) for client, service-account roles, password policy, events, `UPDATE_PASSWORD` max auth age and e-mail theme; verify that running it twice against the local Keycloak gives the same result and `--dry-run` reports no differences afterwards
- [ ] 1.6 Run the script with `--dry-run` against production, show the output to the user, and run it for real only after the user confirms; store the client secret in a k8s secret wired into `k8s/quarkus.yaml` and verify a client-credentials token can be fetched from production Keycloak

## 2. Database migration

- [x] 2.1 Create `V12__settings_privacy_blocking.sql` (`user_settings`, `users.is_private` (existing rows true, column default false afterwards), new notification-settings columns filled from existing categories, `user_blocks`, `email_change_requests`, `email_change_attempts`, indexes, checks) and verify `./mvnw clean test` migrates cleanly on H2 and a local Postgres start applies it
- [x] 2.2 Extend `db/dev-seed/afterMigrate.sql` with one public demo user, one block and one pending follow request; verify the seed runs on dev start

## 3. Settings persistence and theme (backend)

- [x] 3.1 Add `UserSettings` entity/repository and `GET/PUT /api/me/settings` (record DTO, enum theme, `@Valid`, `@Authenticated`, `@Transactional`); verify with tests for defaults without a row, update, invalid value → 400, anonymous → 401
- [x] 3.2 Add `api/settings.http` for read/update and verify `./run-http-tests.sh` passes

## 4. Settings shell, theme and navigation (frontend)

- [x] 4.1 Add light token overrides under `:root[data-theme="light"]` in `design-system.css` and `global.css`; verify home, party list, profile, notifications and dashboard are readable in both themes
- [x] 4.2 Add `theme-boot.js` as first head script of every page and `settings-store.js` (load server value, rewrite per-user cache, `storage` and `matchMedia` listeners); verify no dark flash when the cache is light, live OS switch with System, and server value overriding a stale cache
- [x] 4.3 Create `settings/index.html`, `settings.css`, `settings-common.js` (back header, confirm dialog, toast, optimistic toggle with rollback) behind `route-guard.js`; verify logged-out access redirects to login and returns
- [x] 4.4 Build `settings/appearance.html` (Light/Dark/System radio group, accessible labels); verify the theme switches without reload and survives logout + login in another browser
- [x] 4.5 On the own profile replace "Edit Account", "Dashboard" and "Logout" with a top-right gear icon (`aria-label="Settings"`), hide the gear on foreign profiles, add a "Dashboard" entry to the settings overview and point the dashboard's back link to the overview; verify all three in the browser
- [x] 4.6 Add "Log out" with confirm dialog to the overview using `authService.logout()`; verify session storage is cleared and the login page is shown, and that cancel keeps the user logged in

## 5. Profile edit in settings

- [x] 5.1 Backend: `PUT /api/users/{id}` ignores `email`; add handle validation (3–30, `[A-Za-z0-9._]`, only when changed) and `DELETE /api/users/{id}/profile-picture` (own only); verify tests for e-mail ignored, handle rules, conflict, remove own/other picture
- [x] 5.2 Move `editProfile` into `settings/profile.html`/`profile.js`; read-only e-mail with link to the e-mail sub-page, dirty-aware save button, inline errors, loading/success/error feedback, `beforeunload` + in-app back guard, remove-picture with confirm; replace `editProfile/editProfile.html` with a redirect; verify in the browser with a real Keycloak login
- [x] 5.3 Update `api/user.http` and `profilePicture.http` for the new behaviour and verify `./run-http-tests.sh` passes

## 6. E-mail change

- [x] 6.1 `KeycloakAccountService` (find by e-mail, update e-mail + verified) using the admin client; verify with a test using a mocked admin client
- [x] 6.2 Token utility (32 random bytes, base64url, SHA-256) and rate limiter on `email_change_attempts`; verify unit tests for hashing, uniqueness and the 6th attempt → 429
- [x] 6.3 `POST/GET/DELETE /api/me/email-change` and `/resend` with `auth_time` check (401 `REAUTH_REQUIRED`), format/same/taken checks, single pending request replacement; verify tests for every spec scenario of the request phase
- [x] 6.4 Public `POST /api/email-change/confirm` and `/not-me`: expiry, single use, re-check uniqueness, Keycloak update in the transaction, rollback on Keycloak failure, not-me returns reset URL; verify tests for valid, expired, used, replaced, cancelled, taken-meanwhile and Keycloak-failure cases
- [x] 6.5 `CurrentUserResolver` syncs profile e-mail from the token claim; verify with `CurrentUserResolverTest`
- [x] 6.6 `SecurityMailService` with Qute layout and four templates (html + text), masked address, user-agent summary, after-commit sending via `ReactiveMailer` with 3 retries, token-free logging; verify with `MockMailbox` that the confirm mail goes only to the new address, the notice only to the old one, both success mails to the right addresses, and that mails are sent with every notification switch off
- [x] 6.7 Frontend `settings/email.html` (form, re-auth round trip with `prompt=login&max_age=0`, pending state with resend/cancel) and `settings/email-confirm.html` (confirm, not-me, clear error states with link to request a new one); verify the whole flow with a real login and Mailpit
- [x] 6.8 Add `api/email-change.http` and update `docs/openspec-baseline/api-contract-matrix.md`; verify `./run-http-tests.sh` passes

## 7. Password change

- [x] 7.1 `settings/password.html` starting `kc_action=UPDATE_PASSWORD` and showing `kc_action_status` results plus a "Forgot password?" link; verify success, cancel and wrong-current-password with a real login
- [x] 7.2 Login theme: style `login-update-password.ftl` and add live rule/match feedback script using `--ph-*` tokens in `styles.css`; verify the rules are shown and update while typing
- [x] 7.3 E-mail theme: `event-update_password.ftl` html + text with time, IP and "This wasn't me" reset link (or SPI fallback from 1.1); verify in Mailpit that a settings change and a forgot-password reset both send it

## 8. Notification settings

- [x] 8.1 Extend `UserNotificationSettings`/DTO with master and new categories, add `/api/me/notification-settings`, map every event to its category and gate in-app/email/digest with `allEnabled && channel && category`; verify tests for master off, master back on keeps values, each category, legacy defaults and pending actions still visible
- [x] 8.2 Add `UNFOLLOW` notification in the follower-unfollows path only (not remove-follower, decline, cancel or block) with English message and e-mail template; verify tests for each path
- [x] 8.3 Frontend `settings/notifications.html` with master switch, channel and category switches (disabled but keeping values while master is off), optimistic save with rollback and the security-mail hint; show the unfollow type on the notifications page; verify in the browser
- [x] 8.4 Update `api/notification.http` and verify `./run-http-tests.sh` passes

## 9. Account privacy

- [x] 9.1 New users start public (`User.isPrivate = false`); direct follow for public accounts (accepted + history + new-follower notification), `isPrivate` in the cross-user projection, `PUT /api/me/privacy` accepting all pending requests in one transaction when going public; verify tests for new user public / migrated user private, both follow paths and the switch with and without open requests
- [x] 9.2 `ProfileAccessService.canSeeContent` and 403 on followers, following, profile parties, favourites and media for non-followers of private accounts; verify tests for owner, follower, non-follower, public account
- [x] 9.3 Frontend: `settings/privacy.html` (switch, confirm dialog when going public, pending-request count linking to notifications) and private-profile view with "This account is private"; verify in the browser with two demo users
- [x] 9.4 Update `api/follow.http` for direct follow and privacy and verify `./run-http-tests.sh` passes

## 10. Blocking

- [x] 10.1 `UserBlock` entity, `PUT/DELETE/GET /api/me/blocks` with self-block rejection and idempotency; block transaction removes follows both ways (history, no unfollow notification) and withdraws pending invitations; verify tests
- [x] 10.2 Apply block filters to profile read (404), search, follower/following lists, friends-attending, party discovery/map, follow requests and private-party invitations; verify a test per surface in both directions
- [x] 10.3 Frontend: "…" menu with "Block" + confirm on foreign profiles, `settings/blocked.html` list with avatar, name, handle, unblock + confirm and empty state, "profile not available" view; verify in the browser that unblocking does not restore follows
- [x] 10.4 Add `api/block.http` and verify `./run-http-tests.sh` passes

## 11. Share profile

- [x] 11.1 `settings/share.html` with `navigator.share` and clipboard fallback + "Link copied" toast using `?handle=`; verify in a browser with and without Web Share, and that a logged-out visitor lands on the profile after login and a blocked user sees "not available"

## 12. Integration checks

- [x] 12.1 Run `./mvnw clean test` and `./run-http-tests.sh` and verify both pass
- [x] 12.2 Walk through the spec edge cases with real Keycloak logins (demo users, password = username) and Mailpit: setting → logout → login in another browser; two accounts with different themes; e-mail change request/confirm/expired/used/not-me; wrong current password for e-mail and password; password changed mail; all notifications off still sending security mails; private → public with open requests; blocked user opening a shared link; and record the results in the pull request
- [x] 12.3 Run `openspec validate add-settings-page --strict` and verify it reports the change as valid
