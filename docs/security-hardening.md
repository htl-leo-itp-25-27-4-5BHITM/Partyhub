# Practical exploit prevention

Scope: Quarkus APIs, browser pages, Keycloak templates, database queries, uploads and notifications. iOS source is excluded. This change focuses on injection and unauthorized access, not broad form-format preferences.

## Changes and review coverage

| Boundary | Defense and verification |
| --- | --- |
| SQL/JPQL search, filters and writes | Bound values, server-owned ordering, bounded results. Tests submit `OR 1=1`, `UNION SELECT` and `DROP TABLE` strings and verify private records stay hidden and the database remains intact. Keywords/apostrophes are accepted as text. |
| Profile search and username menu | Fixed DOM nodes and textContent; historical HTML-shaped names are inert. |
| Party links, map/list cards and drafts | HTTP(S) link validation; escaped text/encoded internal URL segments. Visibility CSS class is selected from fixed values. Local drafts populate text/value properties. |
| Party edit/delete and can-edit | Stored host authorizes writes; hidden private parties return 404 on read/can-edit. The edit route previously lacked the host check. |
| Invitations | Stored host only; mutual accepted follows for private invitees. Never guess swapped party/user IDs. Validate selected private invitees before any persistence/notification. |
| Profiles/settings | Owner only; other users receive public DTO fields without email, phone or demographics. Arbitrary account creation is closed. |
| Follows, notifications and favorites | Caller participates in follow changes; only recipient acts on their notifications/invitations; saved parties are scoped to the caller. |
| Private galleries and uploads | Existing party visibility/membership checks retained; only host/uploader deletes. Real decoded raster checks, bounded dimensions/frames/bytes, generated names and contained paths. Legacy profile files are rechecked; untrusted SVG is not served as active content. |
| JWT/header identity | Normal bearer validation; dev/test bypass identities carry an explicit marker. A numeric token subject cannot impersonate the same numeric local ID. Deployed mode ignores the bypass flag. |
| Deferred QR prototype | Off by default. It is not a supported authentication method and must not be enabled on public deployments. The legacy custom signing implementation is not represented as secure login. |
| Keycloak/Qute HTML | Explicit FreeMarker HTML autoescaping; no raw user name interpolation. Qute HTML name/attribute escaping is tested. |
| Email/push/error output | Structured JSON, constrained device-token path segments, safe mail recipients/headers and generic parser errors. No device-token logging. |
| Request budgets | JSON 256 KiB/depth 32, multipart 8 MiB aggregate, 5 MiB/image, at most 20 gallery files. Supported raster types remain JPEG, PNG, GIF and WebP. |

The upload count and aggregate limits are separate: 20 small files can fit; 20 files of 5 MiB cannot. Proxy and backend enforce the same 8 MiB aggregate cap. Gallery/member visibility rules remain the accepted product behavior.

## Compatibility

`POST /api/users` now returns 401 anonymously and 403 for authenticated callers. Accounts are provisioned from Keycloak through authenticated `/api/users/me`; profile changes use PUT for the caller's own ID. No browser flow needs arbitrary account creation. API fixtures are seeded locally instead of using an unsafe public account endpoint.

Private invitations that bypassed the host/mutual-contact rules are now rejected. Existing records are not rewritten; unsafe historical text/links/files are guarded when rendered or served. V12 only widens text columns to match existing advertised DTO limits; it neither deletes nor normalizes stored values. Bring-along's encoded JSON text remains unchanged.

## Checks

```bash
mvn clean test
node --test scripts/tests/*.test.cjs src/test/js/*.test.cjs
npm --prefix scripts/browser ci
npx --prefix scripts/browser playwright install chromium
npm --prefix scripts/browser test
```

The Playwright script requires a disposable local server on port 8080, the dev seed, and a local Keycloak realm with the demo users. It performs real PKCE login and bearer-authenticated API requests. It refuses non-loopback destinations. With system Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. Set `EXPECT_AUTH_BYPASS_DISABLED=false` only for the separate HTTPYac dev fixture server; the normal browser security run requires bypass disabled.

Use a dedicated PostgreSQL database such as `partyhub_validation`; do not run dev-mode clean/seed against persistent data. Set `partyhub.auth.bypass-enabled=false` and `quarkus.mailer.mock=true` for browser checks. The host JDK must support the Quarkus version; newer JDKs may need `JAVA_TOOL_OPTIONS='--add-opens=java.base/java.lang=ALL-UNNAMED'` for the local server.

Attacker/owner/recipient coverage lives in `AccessControlResourceTest`, `AuthenticationBoundaryTest`, `DisabledQrResourceTest` and `scripts/browser/input-validation.cjs`. Other suites cover upload transaction cleanup and image spoofing, malformed input, template escaping and outbound serialization. Source review and regression tests do not establish that every possible vulnerability is absent.

## Deployment and follow-up

Deploy through the gated pipeline. Leave bypass and QR disabled. Roll back an application image only for a verified regression; do not clean production databases or bulk-escape old records. The widening migration is forward-only and safe for the previous application to read.

No blocking CSP, additional cosmetic format rules, iOS changes or unrelated planning/live backend code is included. A future CSP rollout needs its own compatibility test for Leaflet, CDNs, inline scripts, map tiles and Keycloak. Existing identity-to-seed linking behavior remains unchanged except numeric subject interpretation; larger identity migration changes need a separate design.

References: [OWASP SQL injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), [authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [XSS prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).
