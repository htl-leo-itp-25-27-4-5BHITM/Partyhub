# Design

## Context

- Frontend: plain JavaScript multi-page app under `src/main/resources/META-INF/resources/`, one folder per page (`profile/`, `editProfile/`, `notifications/`, …), shared `auth-service.js`, `route-guard.js`, `nav.js`, `design-system.css` and `global.css`. The app is dark-only today (`color-scheme: dark`, dark `--bg-*`/`--text-*` tokens). Tokens are kept in `sessionStorage` only (spec "Browser tokens are not persisted long term").
- Own-profile actions ("Edit Account", Dashboard, Logout) are injected by `profile/profile.js`; edit form lives in `editProfile/` and calls `PUT /api/users/{id}` with `email` included.
- Notification preferences exist as `user_notification_settings` with `GET/PUT /api/users/{id}/notification-settings` but no browser UI. Notification types: `INVITATION`, `UPDATE`, `CANCELLATION`, `FOLLOW`.
- Follows: `Follow` with `FollowStatus` (pending/accepted), history in `FollowEvent`. Every follow is a request today.
- Identity: Keycloak 26.5 (`Dockerfile.keycloak`), realm `partyhub`, clients `frontend` (public, PKCE). The backend only validates tokens (SmallRye JWT) and has no Keycloak admin access. The profile e-mail is copied from the token only when a user is first linked (`CurrentUserResolver`).
- Mail: `quarkus-mailer` with Qute templates in `templates/emails/` (welcome, digest, invitation, …). Keycloak has its own SMTP config and a `partyhub` e-mail theme (`email-verification`, `password-reset`). `quarkus-scheduler` is available.
- Latest Flyway migration is `V11__follow_requested_at.sql`.

## Goals / Non-Goals

**Goals:**
- Passwords never pass through the PartyHub backend.
- One server-side source of truth for every preference; the browser cache is only a first-paint hint.
- Privacy and block rules enforced in repository queries and resource checks, not only in the UI.
- Reuse the existing notification pipeline, Qute mail templates, route guard and design tokens.

**Non-Goals:**
- No generic job/queue infrastructure; security mails use an in-process retry.
- No Keycloak SPI (custom Java provider) unless the spike in tasks 1.x proves the built-in event e-mail does not cover reset-password.
- No change to party visibility rules apart from block filtering.

## Decisions

### D1 — Settings routing: one folder, one HTML page per sub-page
`/settings/index.html` (overview) plus `appearance.html`, `profile.html`, `email.html`, `email-confirm.html`, `password.html`, `notifications.html`, `privacy.html`, `blocked.html`, `share.html` in `META-INF/resources/settings/`, sharing `settings.css` and `settings-common.js` (back header, toast, confirm dialog, optimistic toggle helper). This matches the existing one-folder-per-page structure and keeps each page small. `email-confirm.html` is the only settings page reachable without login. The overview links to the existing `/dashboard/dashboard.html`; the dashboard's back link points to `/settings/index.html`. `editProfile/editProfile.html` becomes a redirect stub to `/settings/profile.html`; its JS moves to `settings/profile.js`.
*Alternative:* one long page with anchors — rejected because sub-pages were chosen and dirty-state handling of the profile form is simpler on its own page.

### D2 — Data model (`V12__settings_privacy_blocking.sql`)
- `user_settings(user_id PK/FK users, theme varchar(10) not null default 'SYSTEM' check in ('LIGHT','DARK','SYSTEM'), updated_at timestamptz)`. Row is created lazily; a missing row means defaults (same pattern as notification settings). Language etc. can be added as columns later.
- `users.is_private boolean not null default true`, then `alter column is_private set default false` in the same migration — existing accounts become private (behaviour unchanged), new accounts are public. The `User` entity initialises the field to `false` so registration does not rely on the column default.
- `user_notification_settings` gains `all_enabled`, `invitation_responses`, `party_cancellations`, `unfollows` (boolean not null). The migration sets them from `party_invites`, `party_updates`, `follow_events` for existing rows; `all_enabled = true`.
- `user_block(blocker_id, blocked_id, created_at, PK(blocker_id, blocked_id), check blocker_id <> blocked_id)` with an index on `blocked_id` (singular table names like `follow`, `favorite`).
- `email_change_request(id, user_id unique, new_email, confirm_token_hash varchar(64) unique, cancel_token_hash varchar(64) unique, expires_at, created_at, user_agent varchar(255))`. `user_id unique` enforces one pending request; a new request replaces the row. Used/cancelled requests are deleted, which also invalidates both links.
- `email_change_attempt(user_id, attempted_at)` for the rate limit (D9).
- `users.email_changed_at` marks the last confirmed change, so tokens issued before it cannot write the old address back (D5).
- `NotificationType` gains `UNFOLLOW`; `FOLLOW` is reused for new-follower (public accounts).
No existing rows are deleted; the PR notes the new `CHECK` constraints.

### D3 — API (all `@Authenticated`, caller from `CurrentUserResolver`, no path user IDs)
| Method | Path | Purpose |
|---|---|---|
| GET/PUT | `/api/me/settings` | theme (+ future prefs) |
| GET/PUT | `/api/me/notification-settings` | full state incl. master (existing `/api/users/{id}/notification-settings` stays as alias with the caller check) |
| PUT | `/api/me/privacy` `{private, acceptPendingRequests}` | switch; going public requires `acceptPendingRequests=true` |
| GET | `/api/me/email-change` | pending state (masked target, created/expiry) |
| POST | `/api/me/email-change` `{newEmail}` | create/replace; 401 `{code:"REAUTH_REQUIRED"}` when `auth_time` > 5 min |
| POST | `/api/me/email-change/resend` | new confirm token, rate-limited |
| DELETE | `/api/me/email-change` | cancel |
| POST | `/api/email-change/confirm` `{token}` | public, confirms |
| POST | `/api/email-change/not-me` `{token}` | public, cancels and returns the Keycloak reset URL |
| GET | `/api/me/blocks` | list |
| PUT/DELETE | `/api/me/blocks/{userId}` | block / unblock (idempotent) |
| DELETE | `/api/users/{id}/profile-picture` | remove own picture |
DTOs are records with `@Valid`, messages on every constraint, `@NoHtml`/`@SafeText` on free text, `@Email` + `@Size(max=254)` on `newEmail`. `PUT /api/users/{id}` ignores `email`; `UserCreateDto` keeps the field for registration only. The API contract matrix is updated.

### D4 — Re-authentication for e-mail change uses `auth_time`
The e-mail page calls `POST /api/me/email-change`. If the token's `auth_time` claim is older than 5 minutes the backend answers `401 REAUTH_REQUIRED`; the browser stores the typed address in `sessionStorage`, starts the normal PKCE login with `prompt=login&max_age=0` and returns to `email.html`, which resubmits. Keycloak checks the password; the backend never sees it.
*Alternative:* backend verifies the password via a direct-access grant — rejected: passwords would cross the backend and direct grants would have to be enabled.

### D5 — E-mail change is orchestrated by the backend, applied in Keycloak
On confirm, inside `@Transactional`: load request by `sha256(token)`, check expiry, re-check uniqueness (DB + Keycloak `users?email=…&exact=true`), call Keycloak Admin API `PUT /users/{kcId}` with `email`, `emailVerified=true`, then set `users.email` and delete the request. If Keycloak fails the transaction rolls back (spec: stays pending). Mails are triggered after commit (`TransactionPhase.AFTER_SUCCESS` observer).
The backend calls the Keycloak Admin REST API with the JDK `HttpClient` (client-credentials token, two endpoints — no extra dependency) through a new confidential client `partyhub-backend-admin` (service account, client-credentials, realm role mapping `realm-management: manage-users, view-users` only). Secret via `KEYCLOAK_ADMIN_CLIENT_SECRET`. Dev realm gets the client in `realm-dev.json`; production is configured by `scripts/keycloak-configure-settings.sh` (D15).
`CurrentUserResolver` additionally syncs `users.email` from the token's `email` claim when they differ (covers admin changes).
*Alternative:* Keycloak's own `UPDATE_EMAIL` required action — rejected: it has no pending state, resend/cancel, "this wasn't me" or old-address notice without a custom SPI.

### D6 — Password change uses Keycloak's application-initiated action
`password.html` starts the PKCE login with `kc_action=UPDATE_PASSWORD` and `redirect_uri=/settings/password.html?kc_action_status=…`. The `UPDATE_PASSWORD` required action is configured with *max auth age 0* so Keycloak always asks for the current password first. Realm `passwordPolicy`: `length(8) and notUsername and passwordHistory(1)`. The PartyHub login theme gets a small script on `login-update-password.ftl` for live rule feedback and match check. The callback page reads `kc_action_status=success|cancelled|error` to show the result. Keycloak keeps the current session, so the user stays logged in.

### D7 — Password-changed mail via Keycloak's built-in `email` event listener
Enable realm events with listeners `jboss-logging` and `email`. The built-in listener mails the user on `UPDATE_PASSWORD` (fired both by the application-initiated action and by the reset-credentials flow). Override `event-update_password.ftl` (html + text) in `keycloak/themes/partyhub/email/` with PartyHub styling, the time, IP address and a "This wasn't me" link to `/realms/partyhub/login-actions/reset-credentials?client_id=frontend`. Keycloak does not know PartyHub notification settings, so the mail is always sent. Keycloak events carry no user agent; the mail shows IP only (spec allows "approximate").
*Spike result (task 1.1, Keycloak 26.5 locally):* the forgot-password reset fires `UPDATE_PASSWORD` and the built-in listener mails it, so no SPI is needed. The same change also fires `UPDATE_CREDENTIAL`, which the listener mails as a second "Update credential" message, and `LOGIN_ERROR` would mail users on failed logins. `Dockerfile.keycloak` therefore sets `KC_SPI_EVENTS_LISTENER__EMAIL__INCLUDE_EVENTS=UPDATE_PASSWORD`; afterwards a reset produces exactly one "Update password" mail.
The local realm also had `UPDATE_PASSWORD` unregistered (realm files listed only `VERIFY_EMAIL`, which replaces Keycloak's defaults on import); the configuration script registers it and the realm files now list the default required actions.

### D8 — Security mail sending in the backend
`SecurityMailService` renders Qute templates `templates/emails/security/{email-change-confirm,email-change-requested,email-change-done-new,email-change-done-old}.{html,txt}` with a shared PartyHub layout and sends `Mail.withHtml(...).setText(...)` via `ReactiveMailer` with 3 attempts (1 s, 5 s, 30 s backoff). It bypasses `UserNotificationSettings` by design. Logs contain user ID, template name and outcome — never the link or token. User agent is parsed into "Browser on OS" with a small allow-list parser (no new dependency). Mails go to the default language (English) since app language is out of scope.
*Alternative:* persistent outbox table with scheduler — rejected because the rendered mail would store the link token in plain text; losing an in-flight mail on restart is acceptable because the user can resend.

### D9 — Tokens and rate limits
Tokens: 32 random bytes from `SecureRandom`, base64url in the link, SHA-256 hex in the DB, compared by hash lookup. Confirm link `/settings/email-confirm.html#token=…` (fragment so the token is not in server access logs); the page POSTs the token. Not-me link the same with `#cancel=…`. Rate limit: 5 create/resend per user per rolling hour stored in the table `email_change_attempt(user_id, attempted_at)` (DB so it survives restarts and multiple pods); answer `429`.

### D10 — Privacy and block enforcement
- `FollowRepository.follow(a, b)`: reject if blocked either way; create `ACCEPTED` + `FollowEvent STARTED` + `FOLLOW` notification when `b.isPrivate == false`, otherwise today's pending flow.
- `PUT /api/me/privacy` to public: in one transaction accept all pending incoming follows, record history, emit follow-accepted notifications.
- `ProfileAccessService.canSeeContent(viewer, owner)` = owner == viewer, or not blocked and (public or accepted follower). Used by followers/following, profile parties, favourites and media endpoints (403). `isBlockedEitherWay(a, b)` makes profile reads 404.
- Search, follow lists, friends-attending and party discovery queries add `not exists (select 1 from UserBlock …)` in HQL with bound parameters.
- Block: `@Transactional` insert block, delete follows both ways (ended accepted ones get `FollowEvent ENDED`, no `UNFOLLOW` notification), withdraw pending invitations between them silently.
- Unfollow notification: only in the "follower removes own follow" path.

### D11 — Notification gating
`UserNotificationSettings` gets `isCategoryEnabled(NotificationCategory)`, and a category is mapped from each event (`INVITATION`→partyInvites, invitation responses→invitationResponses, `UPDATE`→partyUpdates, `CANCELLATION`→partyCancellations, `FOLLOW`→followEvents, `UNFOLLOW`→unfollows). Effective = `allEnabled && channel && category`. The digest checks `allEnabled && email && partyUpdates`. Pending actionable items (invitations/follow requests read from domain tables) are unaffected.

### D12 — Theme handling
- Tokens: `design-system.css` keeps dark values on `:root`, adds `:root[data-theme="light"]` overrides (`color-scheme: light`, light `--bg-*`, `--text-*`, `--border-soft`, `--shadow-soft`; accent colours stay). `global.css` dark legacy variables get the same light overrides. Hard-coded colours on pages are replaced with tokens as the light theme is verified page by page.
- `theme-boot.js` (tiny, synchronous, first `<script>` in every page `<head>`): reads `localStorage["partyhub_theme"]` (`{userId, theme}`), resolves System through `matchMedia('(prefers-color-scheme: dark)')`, sets `document.documentElement.dataset.theme` before first paint, listens to `matchMedia` changes and `storage` events (other tabs update live).
- `settings-store.js`: after auth, `GET /api/me/settings`; if the result differs from the cache, apply and rewrite the cache with the current user ID. On login of another user the cache is overwritten by that user's server value; on logout the cache is kept (it holds no personal data, only a theme hint). Only the theme is cached.

### D13 — Profile share link
Link format `${origin}/profile/profile.html?handle=<distinctName>` (already supported by `profile.js`). `route-guard.js` already returns to the requested URL after login. `navigator.share` with fallback `navigator.clipboard.writeText` + toast.

### D14 — Local mail testing
Add `mailpit` to `docker-compose.yaml` (SMTP 1025, UI 8025). `%dev.quarkus.mailer.host=localhost`, port 1025, no TLS/login; `realm-dev.json` `smtpServer` → `mailpit:1025`. Tests use `quarkus-mailer` `MockMailbox` (`%test.quarkus.mailer.mock=true`) to assert recipients.

### D15 — Keycloak configuration script for production
Nobody on the team has Admin Console access, but the cluster runs Keycloak with `KC_BOOTSTRAP_ADMIN_*` from `keycloak-database-secret`. `scripts/keycloak-configure-settings.sh` runs `kubectl exec` into the Keycloak pod and uses `/opt/keycloak/bin/kcadm.sh` (login with the bootstrap admin via `--password` read from the secret, never echoed) to idempotently: create or update the `partyhub-backend-admin` client and its service-account role mapping, print the client secret once for the k8s secret, set the password policy, enable events with `jboss-logging` + `email`, set `UPDATE_PASSWORD` max auth age 0, and set the realm e-mail theme to `partyhub`. It supports `--local` (docker-compose Keycloak), `--dry-run` (shows the differences only) and `KUBE_NAMESPACE`. It only creates or updates — no deletes or realm re-imports. The same settings are mirrored in `realm-dev.json`/`realm-staging.json`.
*Finding during implementation:* the current kubectl context is the personal namespace `student-it220214`, which runs a plain `quay.io/keycloak/keycloak:26.5.0` without the `partyhub` realm; production (`it220274…`) is another namespace. The script therefore skips the e-mail listener and e-mail theme unless the container runs the PartyHub image (theme present and `KC_SPI_EVENTS_LISTENER__EMAIL__INCLUDE_EVENTS=UPDATE_PASSWORD`), and the password-mail reset link comes from `PARTYHUB_RESET_URL` (default: the production URL) instead of `KC_HOSTNAME`.
*Alternative:* asking a teacher for Admin Console access — still possible, the script steps double as documentation.

## Risks / Trade-offs

- [Reset-password flow may not emit `UPDATE_PASSWORD`] → spike first (task 1.1); fallback SPI (D7).
- [Production Keycloak is not re-imported from `realm-staging.json`, and the team has no Admin Console access] → idempotent `kcadm.sh` script (D15), first run against the local realm, then against production only after explicit confirmation; it reads current values before changing them and never deletes realm objects.
- [Service account with `manage-users` is powerful] → separate client, only client-credentials grant, secret in Kubernetes secret, used only by `KeycloakAccountService.updateEmail`.
- [Light theme exposes hard-coded dark colours on many pages] → token audit per page; pages not yet verified keep working because dark stays the default token set.
- [Existing accounts private, new accounts public — two populations behave differently] → intended to avoid silently exposing existing users; the privacy sub-page explains the option.
- [In-process retry loses mails on restart] → user can resend; failure is logged.
- [Block filters add subqueries to discovery] → index on `user_blocks(blocked_id)` and PK on `(blocker_id, blocked_id)`.
- [`auth_time` missing in tokens] → ensure the `frontend` client includes it (default in Keycloak); treat missing as stale.

## Migration Plan

1. Merge with V12; Flyway runs on deploy. Defaults keep behaviour (private, all categories as before).
2. Before the backend deploy: run `scripts/keycloak-configure-settings.sh` against production (after confirmation), store the generated client secret as `KEYCLOAK_ADMIN_CLIENT_SECRET` in a k8s secret referenced by `k8s/quarkus.yaml`, and roll out the Keycloak image with the new e-mail templates.
3. Rollback: redeploy the previous backend; V12 only adds tables/columns, so the old code still runs. Keycloak changes can stay.

## Open Questions

- Exact text of support/recovery hints in the mails (support address) — can be filled in during implementation.
