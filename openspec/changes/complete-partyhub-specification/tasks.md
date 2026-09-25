# Tasks

This is a documentation-only execution checklist. Follow [design.md](design.md) for source entry points, scope, dependencies, evidence rules, and restart prompts. Each numbered group is a bounded work package; a group may need separate proposal and execution tasks. All items remain open until their actual outputs meet the stated verification. Application fixes belong in separate changes.

For every domain completion item below, record the change name and its strict validation result, integrate accepted deltas through the normal sync/archive workflow, and update `coverage.md`, `gaps.md`, `runbook.md`, and `handoff.md`. If no delta is needed, record the existing requirements/scenarios that fully cover the domain and the reason. Do not treat a draft proposal as integrated coverage.

## 1. Baseline and durable handoff package

- [x] 1.1 Create `docs/openspec-baseline/runbook.md`, `inventory.md`, `coverage.md`, `decisions.md`, `gaps.md`, and `handoff.md` with the structures in the design; verify all six files exist and the entry point links the umbrella design/checklist.
- [x] 1.2 Populate the inventory from README, the six main specs, archived decisions, REST resources, browser pages, iOS screens/services and test suites; verify each discovered surface has platform scope, a capability owner and a numbered work package, with no unassigned entries.
- [x] 1.3 Capture the glossary, entity relationships, existing 37-requirement coverage and already approved product decisions; verify each accepted decision has an existing spec/archive reference and observations are separate from intended behavior.
- [x] 1.4 Seed the contradiction/gap register using the design's named findings; verify each entry identifies evidence, expected/observed behavior or the precise decision needed, and an owner step.
- [x] 1.5 Record the inspected revision, relevant working-tree state, initial strict-validation result and unrun-test limitation; verify the handoff contains a self-contained prompt for Step 2 and Step 1 completion status.

## 2. Authentication and identity

- [x] 2.1 Write the browser/iOS identity contract covering login, callbacks, token storage/refresh, logout, user linking and onboarding; verify each flow has platform-specific source evidence and success/failure scenarios tied to `user-auth-and-identity`.
- [x] 2.2 Build the endpoint access matrix using route annotations, caller resolution and repository checks; verify every inventoried endpoint has observed and intended anonymous/authenticated/same-user/host access, or a named unresolved decision.
- [x] 2.3 Document normal JWT identity and environment-dependent bypass separately, including the Kubernetes override; verify configuration observations are not presented as accepted policy or live deployment verification.
- [x] 2.4 Complete the bounded authentication specification update and handoff; verify accepted requirements are integrated, remaining implementation mismatches have gap IDs, and the completion record follows the domain protocol.

## 3. Profiles and social relationships

- [x] 3.1 Document profile fields, editing, identifiers, search and profile-party visibility across both clients; verify same-user/cross-user permissions and field evidence are mapped to requirements or explicit decisions.
- [x] 3.2 Write follow-request, acceptance, removal, duplicate-action and mutual-contact scenarios; verify a transition table preserves one-way acceptance and two-way mutual-contact semantics.
- [x] 3.3 Complete the social/profile specification update using existing capability paths where appropriate; verify accepted deltas are integrated and the handoff includes evidence, validation and remaining gaps.

## 4. Party lifecycle

- [ ] 4.1 Capture create/read/update/delete ownership and visibility contracts; verify host, invitee, attendee, unrelated-user and anonymous cases are represented and the observed update-ownership gap is recorded separately.
- [ ] 4.2 Document party DTO/model fields, location/theme/time/fee/age/capacity constraints and validation failures; verify stored metadata is distinguished from enforced admission rules and unsupported assumptions have decision IDs.
- [ ] 4.3 Compare browser/iOS party methods, routes and payloads with backend resource contracts; verify stale singular routes or wrong methods are recorded with exact call-site evidence and bounded remediation scope.
- [ ] 4.4 Complete the party-lifecycle specification update and handoff; verify accepted requirements are integrated into `party-discovery-and-management` and the evidence/access matrix reflects the final contract.

## 5. Invitations and attendance

- [ ] 5.1 Document invitation selection, creation, retention/removal, recipient eligibility and relevant visibility effects; verify private invitations preserve backend-enforced mutual-contact intent and removal/reinvite edge cases have explicit dispositions.
- [ ] 5.2 Produce invitation/attendance transitions for accept, decline, join, leave and repeated actions; verify each row identifies prior/next state, actor, permissions and membership effect, preserving acceptance-through-attendance semantics.
- [ ] 5.3 Map transition side effects to notification events and member/statistics views; verify each event has an originating action and intended recipients for Step 8 to reuse.
- [ ] 5.4 Complete the invitation/attendance specification update and handoff; verify accepted rules are integrated, edge-case decisions are linked, and source gaps remain separate from normative scenarios.

## 6. Discovery and maps

- [ ] 6.1 Document visible-party queries, search, pagination, filter combination and time/metadata boundaries; verify client/server responsibility and public/private result eligibility are explicit for browser and iOS.
- [ ] 6.2 Reconcile iOS filter/radius controls with archived decisions and current main specs; verify platform scope, finite/unlimited radius, unavailable location and filter-reset scenarios are defined without imposing iOS UI mechanics on the browser.
- [ ] 6.3 Complete discovery and radius requirement updates and handoff; verify accepted deltas are integrated, conflicting filter wording has been resolved, and the separate main-spec Purpose repair remains tracked for Step 12.

## 7. Media and profile pictures

- [ ] 7.1 Document gallery/profile-picture viewing, upload and client support; verify accepted gallery rules allow party viewers to upload at any time and actual UI support is evidenced separately for each client.
- [ ] 7.2 Capture upload validation, access to media URLs, storage paths, replacement/deletion behavior and empty/error states; verify private-party authorization and file-size/type discrepancies have evidence and dispositions.
- [ ] 7.3 Complete media/profile-picture specification updates and handoff; verify accepted deltas are integrated and the access matrix plus data-lifecycle records cover upload, serving and removal paths.

## 8. Notifications and preferences

- [ ] 8.1 Build the event-recipient-channel matrix for follows, invitations, attendance, party changes/cancellation, welcome messages and digests; verify events trace to Steps 3-5 and implemented delivery adapters are distinguished from stubs or unsupported channels.
- [ ] 8.2 Document list/filter/read/delete behavior, same-user settings, preference effects, delivery failures and notification cleanup; verify browser/iOS/device-token contracts and failure scenarios are linked to source evidence.
- [ ] 8.3 Complete notification/settings specification updates and handoff; verify accepted deltas are integrated and no event has contradictory recipients or state transitions across the social and party capabilities.

## 9. QR login

- [ ] 9.1 Compare generation, image/status, exchange and mobile identity paths with QR tests and consumers; verify the evidence record identifies payload format, storage, expiry, reuse and acting-user derivation, including generation/exchange inconsistencies.
- [ ] 9.2 Establish the retained QR contract or record an explicit retirement/defer decision; verify public/protected access and signing/identity gaps have dispositions without preserving unsafe source behavior as intended policy.
- [ ] 9.3 Complete the QR specification or exclusion record and handoff; verify accepted deltas are integrated when applicable, exposed endpoints remain inventoried, and remediation items are bounded.

## 10. Extended client features

- [ ] 10.1 Classify live/current location, attendee locations, visit/time tracking and calendar integration as retained, optional or excluded; verify each classification has source evidence and a decision reference consistent with the existing core-discovery exclusion.
- [ ] 10.2 Document retained feature contracts for permission/consent, visibility, update/storage lifecycle and missing-permission/service failures; verify private-party and user-location cases agree with the access matrix and no unsupported retention policy is invented.
- [ ] 10.3 Complete retained-feature specification updates or explicit exclusion records and handoff; verify each inventoried extension is accounted for and accepted deltas are integrated where applicable.

## 11. Runtime and quality contracts

- [ ] 11.1 Reconcile local/runtime authentication and startup documentation with Compose, realm files, public configuration, app profiles and Kubernetes manifests; verify ports, realm import paths, bypass differences and dependencies have evidence in `local-keycloak-environment` or appropriate supporting contracts.
- [ ] 11.2 Document persistence and storage lifecycles for application data, uploads, profile pictures and notification cleanup; verify environment differences and unknown migration/retention behavior have explicit records rather than inferred guarantees.
- [ ] 11.3 Complete the cross-client API method/path/status/schema and validation/error matrix from domain evidence; verify every inventoried endpoint and client call is matched or assigned a compatibility gap, including README-only endpoint claims.
- [ ] 11.4 Record accepted quality expectations and the JUnit/HTTPYac/CI evidence map, including authentication test configuration; verify every normative quality requirement cites an accepted requirement or explicit product decision, test existence is distinguished from execution, and missing accessibility/privacy/reliability decisions have concrete next actions without invented targets.
- [ ] 11.5 Complete runtime/API contract updates and handoff; verify accepted deltas are integrated, references to Steps 2-10 are consistent, and outstanding code/runtime discrepancies remain in the remediation backlog.

## 12. Consolidation and acceptance

- [ ] 12.1 Audit inventory-to-requirement-to-scenario-to-evidence coverage; verify every discovered surface is covered or explicitly excluded, every accepted requirement has platform scope, and no blocking in-scope decision remains unresolved.
- [ ] 12.2 Review the login/profile, discovery/detail, follow/mutual-invite, invitation/attendance, party-edit/cancellation-notification and gallery-access journeys, plus retained QR/extensions; verify access, state transitions and client differences agree across all participating specs.
- [ ] 12.3 Reconcile README and outdated narrative documentation, repair obsolete local-machine links, and directly replace the existing main `map-radius-control` Purpose placeholder as the scoped baseline documentation correction; verify links resolve, the Purpose describes already accepted behavior without changing requirements, and current documentation no longer contradicts accepted specifications.
- [ ] 12.4 Validate the umbrella and all integrated main specs with strict non-interactive OpenSpec validation; verify both commands in the design pass and their results are recorded without implying application test success.
- [ ] 12.5 Produce a prioritized backlog of bounded implementation changes from the remaining gaps; verify each item names affected requirements, source areas, acceptance scenarios and dependencies rather than requesting another generic planning phase.
- [ ] 12.6 Finalize the runbook, coverage, decisions and handoff records; verify all prior checkboxes reflect delivered outputs, domain changes are integrated or explicitly accounted for, and all links remain valid when the completed umbrella is archived through the standard workflow.
