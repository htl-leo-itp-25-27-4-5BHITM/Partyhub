# Group 11 completion handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`). Groups 1-11 are complete at **40/46 checklist items, 6 remaining** (12.1-12.6). Group 12 was not started.
- Device and revision: Group 11 ran on a second device (repository `/Users/carla/Documents/PartyHub`), starting from `3a3f6ed` on `main`, which contains checkpoint `0f2b043`. Proposal checkpoint: `4c55180 docs: propose runtime and quality contracts`. Application source, configuration, manifests, workflows, scripts and realm files are unchanged since `9487ccb` (empty `git diff --stat 9487ccb HEAD` over those paths).
- Working tree: clean at start. `3a3f6ed` (made by the user) committed the formerly protected `prompts/prompts.md` and `PartyHubiOS/.../UserInterfaceState.xcuserstate` edits, so the old SHA-1 preservation checks no longer apply. Neither file was touched or staged in Group 11.
- [document-runtime-and-quality-contracts](../../openspec/changes/document-runtime-and-quality-contracts/proposal.md) is applied and synced with **6/6 tasks**. It adds ENV-08-ENV-11 (13 scenarios): local runtime issuer binding, a single local realm source (`realm-dev.json`), the native `partyhub-ios` client and a non-authoritative `X-User-Id` bypass. `local-keycloak-environment` is **11/35**; accepted totals are **59 requirements/303 scenarios**.
- Evidence: [runtime-environments.md](runtime-environments.md) (11.1), [data-lifecycle.md](data-lifecycle.md) (11.2), [api-contract-matrix.md](api-contract-matrix.md) (11.3: all 58 endpoints, every browser/iOS call site, README routes, static OpenAPI) and [quality-evidence.md](quality-evidence.md) (11.4).
- Decisions: D023 (environment roles, realm source of truth), D024 (partial Q014: plural routes canonical; unmatched client calls are client gaps, no redirects), D025 (Q006 closed as a mapping; no retention/availability/accessibility/performance target is accepted). Q014 is narrowed (PUT semantics, error envelope). New Q015 (deploy durability), Q016 (retention/deletion), Q017 (accessibility), Q018 (operational reliability).
- New gaps: G057 (every deploy drops the shared `demo` schema, including Keycloak data), G058 (gallery files outside the PVC, classpath serving), G059 (no migrations), G060 (destructive seed/reset scripts), G061 (deploy not gated on success; no real-JWT tests), G062 (inconsistent error bodies), G063 (stale unserved `openapi.yaml`), G064 (`AGENTS.md` validation/encoding/SQL-inspector claims), G065 (no file/record cleanup), G066 (OpenSpec CLI version difference). G005/G013/G015/G018 received Group 11 updates.

## Validation and evidence record

OpenSpec CLI on this device: `1.3.1` (`/opt/homebrew/bin/openspec`).

| Check | Result |
|---|---|
| Child strict validation | `openspec validate document-runtime-and-quality-contracts --type change --strict --no-interactive` → valid. |
| Affected main spec | `openspec validate local-keycloak-environment --type spec --strict --no-interactive` → valid at 11 requirements/35 scenarios. |
| Main specs aggregate | `openspec validate --specs --strict --no-interactive` → 6 passed, 0 failed. Note: this CLI does **not** flag the `map-radius-control` placeholder Purpose, which is still present (G012 stays Step 12). |
| Umbrella strict validation | `openspec validate complete-partyhub-specification --type change --strict --no-interactive` → **fails** with "Change must have at least one delta" because CLI 1.3.1 ignores `skip_specs` during validation (it only uses `skipSpecs` at archive). Nothing in the umbrella changed except the checklist. On the original device the same command passed in Group 10. Recorded as G066 for Step 12.4; no artificial delta was added. |
| Umbrella progress | `openspec list --json`: 40/46; child 6/6. |
| Runtime evidence | No application, JUnit, HTTPYac, browser, iOS, Keycloak, database, CI or deployment command was executed. Destructive scripts (`deploy-local.sh`, `sync-import.sh`, the deploy workflow) were read only. |

## Remaining work (Group 12)

12.1 coverage audit; 12.2 journey review; 12.3 README/narrative reconciliation (including G004/G005/G015/G060/G063/G064 documentation items and the G012 Purpose repair); 12.4 final strict validation with an explicit G066 disposition; 12.5 prioritized implementation backlog from G001-G066 and Q004/Q011-Q018; 12.6 final records. Q004 and Q011-Q013 need an explicit decision or deferral before final acceptance. Q014-Q018 do not block accepted requirements but must appear in the backlog.

## Exact next prompt

```text
Use openspec-apply-change for complete-partyhub-specification.
Execute only task group 12: Consolidation and acceptance (12.1-12.6).

Read docs/openspec-baseline/handoff.md, runbook.md, inventory.md,
coverage.md, decisions.md, gaps.md, access-matrix.md and the Group 11
records (runtime-environments.md, data-lifecycle.md, api-contract-matrix.md,
quality-evidence.md) first, then the umbrella design/tasks and all six main
specs.

Documentation/specification work only; do not implement application fixes,
deploy, reset data or run destructive scripts. Repair the map-radius-control
Purpose directly as the scoped G012 correction. Record the OpenSpec CLI
version with every validation result and give G066 an explicit disposition
without adding artificial product deltas to the umbrella. Obtain or explicitly
defer Q004 and Q011-Q013 before claiming final acceptance. Produce the
prioritized bounded backlog from G001-G066 and Q014-Q018. Do not archive the
umbrella or child changes unless the final gates explicitly allow it.
```
