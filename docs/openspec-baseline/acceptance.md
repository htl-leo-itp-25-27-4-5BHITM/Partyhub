# Final acceptance review

Group 12, 2026-09-30, on the second device, starting from `76972ed` (Group 11 completion). Tooling: OpenSpec CLI `1.13.2` (W022). Application source, configuration, manifests, workflows and scripts are unchanged since `9487ccb`. This review checks the **specifications and records**. It does not verify application behaviour, and no application, API, UI, device, database or deployment test was run.

## 12.1 Coverage audit

| Check | Method | Result |
|---|---|---|
| Every main-spec requirement has a coverage entry | Script comparing `### Requirement:` headings in all `openspec/specs/*/spec.md` with the requirement anchors in [coverage.md](coverage.md) | 61/61 present |
| Every scenario is anchored | Same script for `#### Scenario:` headings | 313/313 present |
| Every accepted requirement has platform scope | Count of `Platform scope:` lines vs coverage IDs | 61 = 61 |
| Every discovered surface is owned, covered or explicitly excluded | [inventory.md](inventory.md) owner columns; the 58 endpoint rows in [access-matrix.md](access-matrix.md) and [api-contract-matrix.md](api-contract-matrix.md); client call sites; README/OpenAPI claims | No unassigned surface. Excluded or deferred surfaces carry decisions: QR (D021), shared location (D022/PARTY-17), retention/accessibility/operations (D031). |
| No blocking in-scope decision remains | [decisions.md](decisions.md) open questions | Only Q014 remains open (wire envelope and PUT semantics). No accepted requirement depends on it (D024). |

Accepted baseline: **7 capabilities, 61 requirements, 313 scenarios**. By capability: AUTH 12/45, SOC 11/82, PARTY 19/113, MEDIA 3/20, RADIUS 3/10, ENV 11/35, DEPLOY 2/8.

## 12.2 Journey and cross-capability review

Method: for each journey, read the participating requirements end to end, compare actors and access with [access-matrix.md](access-matrix.md), and check state transitions against the domain evidence files. **Consistent** means the specs do not contradict each other. It does not mean the implementation conforms; implementation mismatches are backlog items.

| Journey | Requirements | Access and state agreement | Client differences | Finding |
|---|---|---|---|---|
| Login → profile | AUTH-01-AUTH-12, ENV-07-ENV-11, SOC-04-SOC-07, D027/D028 | Validated bearer identity only; first login always ends linked to exactly one user (the AUTH-08 no-match alternative was aligned in Group 12); seed data stays unlinked until a unique match; `POST /api/users` never creates identity | Browser PKCE/sessionStorage vs iOS Keychain; iOS self-profile minimum (SOC-04) | Consistent. AUTH-12 still handles an onboarding outcome the backend no longer returns; this is harmless defensive client behaviour, left unchanged under D029. |
| Discover → detail | PARTY-01-PARTY-04, PARTY-08-PARTY-11, PARTY-16, PARTY-17, RADIUS-01-RADIUS-03, MEDIA-01 | Public parties are anonymous; private parties are visible to Viewers (host, pending invitee, joined). Filters AND-combine after visibility. Location stays local. | iOS map filters/radius only; browser list/map without parity | Consistent. |
| Follow → mutual invite | SOC-01, SOC-02, SOC-05, PARTY-06 | One-way accepted follows; mutual contact = both directions; host-only private invite checked at issue/renew | Browser has social actions; iOS minimum lacks follow controls (G028, optional) | Consistent (SOC-02 and PARTY-06 state the same rule from both capabilities). |
| Invitation → attendance | PARTY-07, PARTY-14, PARTY-15, SOC-03, SOC-08 | Acceptance happens through joining; leave → declined; declined/withdrawn give no visibility; one event per recipient per committed transition | Different client payload/state models (G033) | Consistent. SOC-04's profile list of "private parties to which the viewing user was invited" is read with the D017 current-invitation floor (Q003 resolution) and grants no extra access. Wording tightening is optional editorial work. |
| Party edit/cancel → notification | PARTY-05, PARTY-12, PARTY-13, PARTY-15, SOC-03, SOC-08-SOC-11 | Only the stored host edits/deletes; update/cancellation events go to deterministic recipients; the cancellation snapshot outlives the party; preferences gate in-app/email independently; delivery failure never rolls back | Push/SMS unsupported (D020) | Consistent. |
| Party access → gallery | MEDIA-01-MEDIA-03, SOC-07, PARTY-04, DEPLOY-01 | Anonymous view of public galleries; upload only by an authenticated Viewer; profile pictures authenticated; uploaded files must persist | Browser gallery view without upload UI; iOS photos local (G038) | Consistent. |
| QR login (deferred) | D021, AUTH-02 | No QR, deep-link or mobile token authenticates | Legacy consumers inventoried (G049) | Consistent exclusion; containment is B10. |
| Extensions | PARTY-17-PARTY-19, D022 | Location is private; visit history is device-local and never attendance; calendar export is a snapshot | iOS only | Consistent. |
| Environment | ENV-01-ENV-11 (local), DEPLOY-01/DEPLOY-02 (school cloud) | Local realm recreation (ENV-09) vs deployed realm preservation (DEPLOY-02) apply to different environments; the bypass is non-authoritative everywhere | — | Consistent. |

Public and protected access across profiles/social, party/media/location and QR surfaces matches the access matrix. Every row whose source behaviour differs is linked to a gap and a backlog item.

## 12.3 Documentation reconciliation

- README: features, auth stack, setup (`deploy-local.sh` with its destructive effects), `sync-import.sh` warning, realm file and demo credentials, deployment note (G057), project structure and API routes now match the repository and specs (G004, G005, G015, G060).
- `docs/functional-spec-codex.md`: 39 absolute `/Users/carla/...` links replaced with repository-relative links, plus a historical banner that corrects the stale authentication narrative (G001).
- Historical banners added to `docs/intent.md`, `docs/keycloak-merge-summary.md`, `SWIFT_FILTER_IMPLEMENTATION.md` and `SwiftVertiefungREADME.md`.
- `map-radius-control` Purpose replaced as the scoped G012 correction; no requirement changed.
- Not changed: archived change artifacts (history), `AGENTS.md` (repository instructions; G064 is backlog B19), `continuations/` handoffs (history), and the root `openapi.yaml` (B19).

## 12.4 Final strict validation

OpenSpec CLI `1.13.2`:

| Command | Result |
|---|---|
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive` | valid (`skip_specs`: zero deltas accepted) |
| `openspec validate --specs --strict --no-interactive` | 7 passed, 0 failed |
| `openspec validate --changes --strict --no-interactive` | 11 passed, 0 failed |

These results show that the specifications are syntactically and structurally valid. They do not show that the application, its tests or the deployment behave as specified.
