## 1. Review and reproduce

- [x] 1.1 Review all non-iOS input/permission boundaries on current main and isolate unrelated local work.
- [x] 1.2 Reproduce baseline stored XSS, unsafe URL storage, and validation gaps through real-login local Playwright.
- [x] 1.3 Narrow the original plan to practical exploit prevention following the user's clarification.

## 2. Injection and unsafe output

- [x] 2.1 Replace profile name HTML interpolation, constrain link protocols and guard historical stored values.
- [x] 2.2 Retain parameterized queries and remove SQL-word blacklists from legitimate bring-along text.
- [x] 2.3 Serialize outbound JSON, constrain mail headers/device tokens and explicitly enable template autoescaping.
- [ ] 2.4 Verify stored XSS, HTML templates, SQL payloads and ordinary text with regression tests and local Playwright.

## 3. Identity and object access

- [x] 3.1 Require host ownership for party edits and invitations; enforce mutual private-invite eligibility before side effects.
- [x] 3.2 Close arbitrary identity creation, forbid deployed header bypass and distinguish test IDs from bearer subjects.
- [x] 3.3 Disable unsupported QR login by default and prevent private-party disclosure through can-edit.
- [ ] 3.4 Verify denied cross-user profile/settings/follow/invitation/notification/media/party actions and allowed owner/recipient actions.

## 4. Request and file safety

- [x] 4.1 Bound bodies, parser depth, collections/searches and pages; return safe malformed-input errors.
- [x] 4.2 Validate bounded raster contents/dimensions, generated paths and legacy file delivery while preserving supported formats.
- [ ] 4.3 Verify upload spoofing, size limits, traversal, failed-write side effects and forward-only PostgreSQL migration.

## 5. Deliver

- [ ] 5.1 Update security guidance, scope/compatibility notes and HTTP test fixtures.
- [ ] 5.2 Run full Maven/Node/PostgreSQL HTTP/Playwright checks; include reproducible evidence.
- [ ] 5.3 Open and link the implementation PR, verify remote checks, then merge under the user's authorization.
