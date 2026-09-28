# Media and profile-picture completion handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`). Group 7 items 7.1-7.3 are complete. Umbrella progress is **26/46 complete, 20 remaining**. Group 8 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. Group 7 started from repository commit `2870e2c9d996b5f3bd7940e9cca7909ef220078f`. No application source, configuration, database, deployment or uploaded data was changed.
- Child change: [document-media-and-profile-pictures](../../openspec/changes/document-media-and-profile-pictures/proposal.md), applied and synced with **9/9 tasks complete**. Its [design](../../openspec/changes/document-media-and-profile-pictures/design.md), [media delta](../../openspec/changes/document-media-and-profile-pictures/specs/party-media-gallery/spec.md), [social delta](../../openspec/changes/document-media-and-profile-pictures/specs/social-and-notifications/spec.md) and [tasks](../../openspec/changes/document-media-and-profile-pictures/tasks.md) remain active and unarchived.
- The scoped completion commit uses message `docs: complete media and profile pictures specification`; use `git log -1` for its immutable SHA.

## Delivered Group 7 result

| Item | Delivered result |
|---|---|
| 7.1 | [media-and-profile-pictures.md](media-and-profile-pictures.md), MEDIA-01-MEDIA-03 and SOC-07 distinguish server-backed gallery media, iOS local-only photos, browser/iOS profile-picture consumers, target upload controls and current support without imposing UI parity. |
| 7.2 | D019, [access rows 26, 29, 45-47 and 57](access-matrix.md#access-matrix) and G036-G039 establish Viewer access, authenticated upload, JPEG/PNG/GIF/WebP up to 5 MiB, safe references, empty/error states, logical replacement and failure preservation. Physical deletion, retention and orphan cleanup remain Q006/Step 11. |
| 7.3 | Both deltas are synced into the existing main capabilities. `party-media-gallery` is 3 requirements/20 scenarios; `social-and-notifications` is 7/43. Accepted total coverage is **48 requirements/235 scenarios**. The child and both main specs pass strict validation. |

D019 resolves Q005: anonymous callers may view media for a public party, but every upload requires token-derived authenticated Viewer identity. Gallery lists, individual media and user-media projections preserve the owning party's Viewer predicate. Shared gallery state is server-backed; local-only iOS files are not represented as uploaded media.

SOC-07 makes profile pictures authenticated profile content and Self-managed. It accepts a stable placeholder/reference, non-empty JPEG/PNG/GIF/WebP up to 5 MiB, one current logical picture after success, prior-picture preservation on replacement failure and client cache refresh. G039 records current open reads, validation, replacement and client fallback differences.

## Evidence and limitations

- Backend sources reviewed: `PartyResource`, `MediaRepository`, `UserResource`, media/profile entities and configured/legacy upload paths.
- Browser sources reviewed: gallery HTML/JS and profile edit/picture loading. The gallery is server-backed and read-only in inspected source; no upload control was found, and its `/api/media/{id}` URL has no inventoried Java REST resource.
- iOS sources reviewed: `PartyBilderView`, `PhotosSection`, party detail photos, `ProfileView`, `UserProfileImageView` and `ApiService`. Party photos are local document files; profile uploads/reads are server consumers with bearer/fallback/cache mismatches recorded in G038-G039.
- Tests/HTTPYac were inspected, not run. No application, API, browser, iOS, Keycloak, database or deployment test was executed. Existing repository list tests and media HTTP requests do not prove normal-JWT Viewer authorization, item serving, upload atomicity or profile replacement behavior.
- G036-G039 are implementation/client gaps, not application fixes performed here. Q006 retains physical lifecycle policy; Q014 retains exact route/status/envelope compatibility.

## Validation record

| Check | Result |
|---|---|
| Child change | `openspec validate document-media-and-profile-pictures --strict --no-interactive` passes; 9/9 tasks complete. |
| Main media spec | `openspec validate party-media-gallery --type spec --strict --no-interactive` passes at 3 requirements/20 scenarios. |
| Main social spec | `openspec validate social-and-notifications --type spec --strict --no-interactive` passes at 7 requirements/43 scenarios, with the existing informational long-requirement note. |
| Umbrella | `openspec validate complete-partyhub-specification --type change --strict --no-interactive` passes; `skip_specs: true` is informational and progress is 26/46. |
| All main specs | Six of six pass non-strict validation. Strict validation remains 5/6 solely because [G012](gaps.md#g012-radius-purpose-placeholder) leaves the pre-existing radius Purpose placeholder for Step 12. |
| Links/access | All 1,296 checked local file/heading links across 22 baseline, umbrella and Group 7 Markdown files resolve; all 58 access-matrix rows remain present. |
| Preservation | The six main specs were unchanged before sync except the two selected targets; auth, party, radius and environment specs remain byte-identical. Source/configuration and the two unrelated working-tree files remain unstaged and unchanged. |

## Working-tree preservation

Do not include or overwrite these unrelated user edits:

- `prompts/prompts.md`, preserved SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`, preserved SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`

Before Group 8, compare current hashes and source/configuration state to this handoff. Do not archive the umbrella or any active child while later groups remain.

## Exact next prompt

```text
Use openspec-apply-change for complete-partyhub-specification.
Execute only task group 8: Notifications and preferences (8.1-8.3).

Read docs/openspec-baseline/handoff.md and runbook.md first, then the umbrella
design/tasks, accepted social/party/auth specs, notification source/tests,
coverage, decisions, gaps, inventory and access matrix.

Complete documentation/specification work only; do not implement application
fixes. Build the event-recipient-channel matrix, notification/settings state
contract and client/backend evidence. If a main-spec delta is needed, create a
separate bounded proposal and follow the OpenSpec proposal/apply/sync boundary.

Update the checklist, coverage, decisions, gaps, inventory, runbook and handoff
before stopping. Preserve the application-source snapshot and unrelated dirty
files. Do not start Group 9 and do not archive the umbrella change.
```
