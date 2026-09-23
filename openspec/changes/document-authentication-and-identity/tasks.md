# Tasks

This change executes **documentation/specification integration only** after a new apply request. Native/client/backend/configuration defects stay in the remediation register. Do not begin umbrella group 3 or archive the umbrella.

## 1. Confirm the bounded integration

- [x] 1.1 Read the saved group 2 handoff, this proposal/design/delta, and the full current identity spec; verify the inspected revision and refresh only source evidence changed since `9487ccb`, preserving unrelated working-tree edits.
- [x] 1.2 Validate the proposed scope against D001-D003 and the platform/access records; verify six existing requirement blocks remain unchanged, the two renames preserve bodies/scenarios, AUTH-09 retains its three original scenarios, and Q011-Q013 remain explicit unapproved policy extensions rather than new guarantees.

## 2. Integrate specification and traceability

- [x] 2.1 Run strict validation for this domain change and integrate its accepted delta using `openspec-sync-specs`; verify only `user-auth-and-identity` changes and the three added requirements, two renames and full AUTH-09 modification are present without losing existing scenarios.
- [x] 2.2 Replace the existing identity spec's Purpose directly with its integrated browser/iOS/backend intent; verify it no longer presents Keycloak as future work and leave the radius Purpose and broad historical narrative reconciliation for umbrella Step 12.
- [x] 2.3 Update coverage with stable AUTH-01-AUTH-09 rename mappings and exact AUTH-10-AUTH-12 requirement/scenario anchors; verify the resulting auth counts (expected 12/43) and whole-baseline counts (expected 40/122), keeping evidence/runtime status independent of acceptance.
- [x] 2.4 Reconcile authentication/access/environment references and decision/gap dispositions after integration; verify all 58 rows still have an intended rule or named question, native gaps remain recorded, G001 distinguishes corrected identity wording from older narrative drift, and unresolved Q011-Q013 have explicit follow-up owners and acceptance limits.

## 3. Verify and hand off

- [x] 3.1 Validate this change, the umbrella and all main specs with strict non-interactive OpenSpec checks; audit local links, scenario preservation and scoped whitespace, and verify no application/configuration files were changed. Record the known radius Purpose failure separately from any new error and state that runtime tests were not run.
- [x] 3.2 Record integration and validation in runbook, coverage and handoff; mark umbrella 2.4 complete only after its integration criteria pass, otherwise record the precise remainder. Verify the handoff states all outstanding policy/gap limits, supplies the next permitted prompt and leaves group 3 untouched in this execution.
