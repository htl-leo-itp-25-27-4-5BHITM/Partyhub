## Context

The user requested prevention of common exploits and unauthorized access, excluding iOS. This supersedes the initial broader field-format plan. Work is isolated on `fix/input-validation-hardening`, based on current `origin/main` (`9761c51`), because the original checkout contains unrelated untracked backend work.

### Project overview and trust boundaries

| Area | Implementation and responsibilities | Input/output boundary and disposition |
| --- | --- | --- |
| Browser application | Static HTML/JS/CSS under `src/main/resources/META-INF/resources`; map/discovery, party editor/detail, profiles, contacts, gallery, notifications, auth | Forms, URL parameters, session storage, geocoder responses and API data are untrusted. Audit all HTML sinks, href/src assignments and navigation. |
| REST/domain layer | Java 21, Quarkus 3.28.2, Jackson, Hibernate Validator; packages `user`, `party`, `bringalong`, `invitation`, `favorite`, `notification`, `notificationsettings`, `qr` | Authoritative validation at HTTP boundaries plus shared policies for non-HTTP provisioning; authorization remains separate. |
| Identity | Keycloak realm files/themes, browser PKCE, SmallRye JWT, `CurrentUserResolver`, dev header bypass | Signed claims still contain user-controlled names/email. Validate before provisioning, escape when rendering. Preserve subject identity. |
| Database | PostgreSQL, Hibernate ORM, Flyway; H2 unit/integration tests | Reviewed queries bind values; dynamic sorting uses server choices. Preserve parameters, bound searches and schema alignment. Do not HTML-encode database values globally. |
| Uploads | Gallery multipart resource/repository, profile-picture resource, shared `ImageType` | Existing signature checks, generated filenames and path checks are useful. Gallery has 5 MiB/file and 20 files/request; profile lacks an explicit per-file maximum. Signatures alone do not prove full image validity. |
| Notifications | JSON DTOs, browser notifications, Qute welcome mail, plain-text digest/notification mail, backend APNs prototype | Encode by destination; serialize push JSON through Jackson; validate recipient/header values and device-token path segment. Backend APNs stays in scope despite iOS exclusion. |
| Deployment/tooling | Docker Compose, Kubernetes ingress, application profiles, GitHub Actions, HTTPYac/JUnit/Node tests | Align aggregate request, multipart and parser limits with ingress; test direct backend requests too. CI currently runs Java/JS/HTTP tests; no SQL inspector invocation was found despite AGENTS.md's claim. |
| Pending local work | Untracked `planning/`, `live/`, `PostgresPartySearch`, V4–V6 and related tests/specs | Include conditional review/tasks if this work is retained. Do not silently add it to this change. Polls, supply lists, discussion, waitlists, statistics, recommendations and SSE expand the same boundaries. |

## Goals / Non-Goals

**Goals:** Prevent stored XSS, unsafe URL execution, SQL injection regressions, cross-user writes/private reads, identity impersonation, unsafe file delivery and request-size abuse. Prove both denied attacker actions and allowed owner/recipient actions.

**Non-Goals:** iOS edits, rich-text support, cosmetic form restrictions, a complete authentication rewrite, enabling prototypes, destructive data cleanup, or a blocking CSP rollout.

## Decisions

### Destination-specific defenses

Store ordinary text and bind query values. Use textContent for profile search/dropdowns. Allow only parsed absolute HTTP(S) website links, without credentials or controls, and suppress unsafe historical links. Keep reviewed escaped map/list templates, trusted static SVG and bring-along's published encode/decode/textContent contract. Make FreeMarker HTML autoescaping explicit; retain kcSanitize only for intended framework-formatted messages. Remove SQL-keyword blocking from bring-along: `Family reunion snacks` and apostrophes must work.

### Authorization stays on the server

Check party ownership before any edit or side effect. Only the host may create an invitation; private invitations also require accepted follows in both directions. Remove legacy guessing of swapped IDs. Validate private selected-user lists before persistence or notification dispatch. Hidden private parties return 404 from can-edit/read endpoints. Profile, settings, follows, notifications, favorites, media and invitations retain their own ownership/recipient checks and get cross-user regression coverage.

Arbitrary public profile creation is closed, rather than trusting caller-supplied identity data. Keycloak `/me` owns provisioning; PUT edits the authenticated profile. This deliberately changes the unsafe legacy POST endpoint to 401/403. HTTP test fixtures come from the dev seed. Signed claim strings still pass shared bounds before provisioning, and the exact subject remains unchanged.

Header bypass requires an explicit development/test launch mode and a marked test identity. A numeric bearer subject is not a database user ID. Staging defaults to bypass disabled, and deployed NORMAL mode ignores bypass even if configured true. Unsupported custom QR login is disabled by default; its old HMAC prototype is exercised only in explicit test configuration and is not advertised as secure authentication.

### Bounded data, safe errors and file delivery

Keep existing domain limits and add bounded JSON input (256 KiB, depth 32), aggregate multipart input (8 MiB), searches/pages and 5 MiB per image. Reject control characters and malformed input with safe JSON errors, preserving 401/403/404. Avoid returning parser/SQL/internal exception details. Do not add arbitrary country-specific phone formats or date/age product rules.

Check raster signatures, dimensions, frame/pixel budgets and actual decoding before persistence. Preserve JPEG/PNG/GIF/WebP with an explicit WebP ImageIO decoder. Legacy stored profile files are also checked before delivery; untrusted SVG cannot execute when opened directly. Keep generated filenames, real path containment and transaction cleanup. The bundled default SVG is separately trusted.

JSON is serialized through Jackson, including APNs payloads. Device tokens must be safe hexadecimal path segments. Mail recipients and header fields reject controls; plain text bodies retain line breaks. No device-token logging.

### Storage and compatibility

The existing API advertises descriptions/biographies up to 2000 characters and URLs/addresses up to 500, while some columns are 255. V12 only widens these columns to prevent accepted input causing SQL errors. No existing migration is changed and no records are rewritten. Existing response fields and bring-along encoding remain unchanged, apart from closing the arbitrary identity-creation endpoint.

## Risks / Trade-offs

- Security changes can expose fixtures that relied on missing checks: update fixtures to obey the real host/mutual-contact rules, never weaken authorization to pass them.
- Byte/dimension limits constrain unusually large photos: retain ordinary valid formats and document the aggregate cap.
- The QR prototype still contains a legacy custom signing implementation: it stays disabled by default; enabling it is unsupported and is not part of this change.
- Original untracked planning code conflicts with current main: exclude it from the PR and use an isolated worktree. Its conditional implementation tasks are not claimed complete.

## Migration Plan

1. Reproduce baseline exploits locally with real Keycloak bearer authentication and bypass disabled.
2. Implement defenses and test attacker/owner/recipient cases in JUnit and Playwright.
3. Run Node, Maven and PostgreSQL HTTP tests; verify the forward migration and valid uploads.
4. Open/link the PR and merge only after checks pass. Roll back application images for regressions; never auto-clean persistent data or undo safe rendering.

## Open Questions

No user input is required for the narrowed scope. Production bypass remains forbidden; prototype QR stays off. CSP, extra form-format changes, iOS and the unrelated planning implementation are deferred.

## References

- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
