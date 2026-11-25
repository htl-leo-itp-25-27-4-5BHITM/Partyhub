# Continuation: settings page (OpenSpec change `add-settings-page`)

Last update: 2026-11-25

## Status

- Implemented, committed and pushed on branch `carla/settings`; **PR #228** to `main` is open (not merged).
- The OpenSpec change is **archived on the branch**: `openspec/changes/archive/2026-11-25-add-settings-page/`. Its delta specs are synced into `openspec/specs/` (new: `user-settings`, `account-security`, `account-privacy-and-blocking`; updated: `social-and-notifications`, `user-auth-and-identity`). `openspec validate --specs --strict` passes.
- Task **1.6 (production Keycloak) is still open** on purpose: it is a handover in the PR body for someone with production access (the user decided this).
- Light mode was reworked after the PR was opened (see "Light mode" below); those commits are on the same branch.

## Next Steps

1. Wait for CI and review on PR #228, then merge (merge via PR only; a push to `main` deploys to production).
2. Someone with production access does the Keycloak handover from the PR body (task 1.6). Until then, e-mail change in production returns 503; everything else works.
3. Open user question: pink text links (`#e72561`) are 3.6–4.3:1 on light backgrounds, just under WCAG AA 4.5:1. Possible fix with palette colours only: navy text with pink underline. Not decided; don't change without asking.

## Light Mode (current rules)

- Overrides live in `src/main/resources/META-INF/resources/theme-light.css` (hand-maintained, rules in its header); light tokens are in the `:root[data-theme="light"]` block of `design-system.css`.
- **Only predefined palette colours** (user requirement): `#1a1040`, `#4f3b9a`, `#ff2e63` / `#e72561`, `#56f27c`, `#3ec1f3`, `#ffd166`, white and navy tints. Never invent darker shades for contrast; keep the palette colour as fill/border and switch text/icon to `#1a1040` or `#fff`.
- Cards are white (`--bg-surface`); areas nested in a card use `--bg-primary`, not translucent dark tints. Text on pink is white; text/icons on green `#56f27c` are navy.
- Every rule must start with `:root[data-theme="light"]` so dark mode is untouched. Bump the `?v=` cache tag of `theme-light.css` / `design-system.css` on all pages after changes.
- `notifications.css` and `advancedPartyInfos.css` both define `--accent` / `--danger` on `:root` with different meanings. Light overrides for the notifications page are scoped to `.notifications-page`.
- Verification method used: a Playwright script that logs in (carla_dimmler), saves theme LIGHT via `window.partyhubTheme.save`, and checks every visible text node's contrast against its composited background on all pages plus opened states (follow menu, search dropdown, "…" menu, map date hover, party details, errors). Result: 0 issues except the pink case in Next Step 3. The script lived in the scratchpad and is gone; rebuild it if needed (Playwright 1.63, see below).

## Decisions (don't re-ask)

- Web only, no iOS. Keycloak handles e-mail and password.
- Existing accounts are private, new accounts public; public accounts are followed directly.
- No account switching. Dashboard, Edit and Logout live in settings. Sub-pages, not one long page.
- Out of scope: mute, interactions, activity status, language, data export, account deletion, QR, 2FA, sessions.

## Where Things Are

- **Backend:** `at.htl.settings` (theme `/api/me/settings`, privacy `/api/me/privacy`), `at.htl.security` (e-mail change, `KeycloakAccountService`, `ReauthPolicy` auth_time ≤ 5 min, `SecurityMailService`), `at.htl.block` (`/api/me/blocks`), `at.htl.user.ProfileAccessService`, `NotificationCategory`, `MyNotificationSettingsResource`, `GET /api/users/{id}/parties`. `users.email_changed_at` stops old tokens from syncing the old e-mail back.
- **Migration:** `V12__settings_privacy_blocking.sql`. Dev seed sets everyone except mia (7) private and adds the block nina(9)→elias(10).
- **Frontend:** `settings/*.html|js`, `settings-common.js`, `settings.css`, `theme-boot.js` (first script in every `<head>`), `theme-light.css`. `editProfile.html` only redirects.
- **Keycloak:** `scripts/keycloak-configure-settings.sh` (idempotent, `--local`, `--dry-run`, `KUBE_NAMESPACE`), `Dockerfile.keycloak` (`KC_SPI_EVENTS_LISTENER__EMAIL__INCLUDE_EVENTS=UPDATE_PASSWORD`), login/e-mail theme templates, realm files with admin client `partyhub-backend-admin`.
- **Config:** `partyhub.keycloak.admin.*` in `application.properties`; `k8s/quarkus.yaml` reads `KEYCLOAK_ADMIN_CLIENT_SECRET` from secret `partyhub-keycloak-admin`; Mailpit in `docker-compose.yaml` (UI http://localhost:8025).
- **Docs:** rows 70–77 and 12/13 in `docs/openspec-baseline/api-contract-matrix.md`.

## Established Facts

- Local Keycloak user is `viki_dji`. Demo users: password = username (carla_dimmler=2 … elias_berger=10).
- The local realm exists in the volume; realm-file changes are applied with `scripts/keycloak-configure-settings.sh --local`.
- Tests use H2 `drop-and-create`; seed `follow_status` in tests and clean up with `TestCleanup.removeUsers` in `@AfterEach`.
- Browser tests: install Playwright **1.63** in the scratchpad (matches the cached Chromium).
- HTTP tests: restart dev (re-seeds), then `cd api && npx httpyac --all *.http`, once per seed.
- E-mail change rate limit: 5/hour; locally clear with `delete from email_change_attempt`.
- Last verification: `./mvnw clean test` 479/479 after merging `main`; `api/*.http` 371/371; browser E2E ~60 checks; light-mode contrast audit as above.
- Dev server was left running; Docker containers (postgres, keycloak, keycloak-db, mailpit) are running.

## Guardrails

- Never run `./sync-import.sh` without `--local-only`. Ask before `./deploy-local.sh`.
- No `kubectl` writes and no production Keycloak Admin API calls (not even read-only) without asking. Never run the configure script against a cluster without `--dry-run` unless the user confirms.
- Commit only when asked; Conventional Commits; work through the PR.
