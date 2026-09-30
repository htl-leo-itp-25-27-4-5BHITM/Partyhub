# Tasks

## 1. Party-media access and serving

- [x] 1.1 Review the complete gallery list, item-serving and user-media projection rules against D007, D009, D017, PARTY-04, PARTY-14 and access rows 26, 29 and 57; verify anonymous public access and every private-party denial case use one Viewer predicate.
- [x] 1.2 Sync the three modified `party-media-gallery` requirements into the main capability without changing unrelated authentication, party, radius, environment or social requirements; verify retained scenario names and all new list/item/projection scenarios pass strict validation.

## 2. Client gallery state

- [x] 2.1 Reconcile browser server-backed gallery behavior and iOS local-only party photos against the proposed shared-gallery boundary; verify each platform's current support and empty/load-failure behavior remain evidence rather than an implementation claim.
- [x] 2.2 Record the accepted client boundary in coverage, inventory and gaps after the media delta is synced; verify no requirement implies that local iOS files are already uploaded or that both clients expose identical controls.

## 3. Gallery upload validation and consistency

- [x] 3.1 Review authenticated Viewer upload, Q005, the 5 MiB JPEG/PNG/GIF/WebP boundary, safe server references and storage/persistence failures; verify anonymous public viewers and authenticated non-Viewers cannot upload and failed storage does not expose a usable record.
- [x] 3.2 Update the access and lifecycle evidence after acceptance while leaving physical deletion, retention and orphan cleanup with Q006/Step 11; verify no deletion endpoint or cleanup guarantee is invented.

## 4. Profile-picture contract

- [x] 4.1 Review the added profile-picture requirement against D001, D015, SOC-05, SOC-06 and access rows 45-47; verify authenticated viewing, trusted placeholder behavior, self-only upload, validation, logical replacement, refresh and failure preservation are complete.
- [x] 4.2 Sync the new requirement into `social-and-notifications` while preserving SOC-01 through SOC-06; verify strict validation passes and direct unauthenticated client image loads remain an implementation gap rather than accepted behavior.

## 5. Completion records

- [x] 5.1 Update the umbrella checklist, coverage totals, decision/question status, stable gap records, runbook and handoff after both deltas are accepted; verify main-spec coverage becomes 48 requirements/235 scenarios, all links resolve, source/unrelated files remain unchanged and Group 8 is not started.
