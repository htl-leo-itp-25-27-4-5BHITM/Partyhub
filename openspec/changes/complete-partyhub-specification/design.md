# Design and execution runbook

## Context

See [proposal.md](proposal.md) for motivation and scope. This design is included because the work crosses backend, browser, iOS, data, authentication, and deployment boundaries and must remain coherent across separate tasks.

The initial assessment inspected repository commit `8964f3b8bce559657347a7d11d59c22a1dc059cd` on 2026-09-21. Inputs were the README, all six current capability specs, relevant archived changes, `docs/intent.md`, `docs/functional-spec-codex.md`, and a GPT-5.5 subagent's read-only source assessment. Application tests were not run; source/test inspection is not runtime verification. Each later task must record its own inspected revision and relevant working-tree differences.

Observed architecture:

- Quarkus 3.28.2 / Java 21 backend under `src/main/java/at/htl/`, PostgreSQL for development/production, and H2 test configuration.
- Browser pages and shared JavaScript under `src/main/resources/META-INF/resources/`.
- Swift client under `PartyHubiOS/PartyHubiOS/`, including Keycloak login, maps, party management, and extended location/calendar surfaces.
- `api/` contains HTTPYac tests, not another application service. JUnit/RestAssured tests live under `src/test/`.
- Compose supplies Postgres and Keycloak; Kubernetes manifests additionally describe the deployed application. Configuration files are evidence of declared configuration, not proof of live deployment state.

The starting baseline has 37 requirements across `user-auth-and-identity`, `social-and-notifications`, `party-discovery-and-management`, `map-radius-control`, `party-media-gallery`, and `local-keycloak-environment`. Strict validation passes five specs and fails `map-radius-control` because its Purpose is a placeholder.

### Initial evidence and contradictions

These findings seed the later gap register; they are not product decisions or an exhaustive audit.

| Finding | Evidence to revisit | Owner step |
|---|---|---|
| The narrative functional document describes browser-stored numeric identity and future Keycloak work, while both current clients contain Keycloak flows. | `docs/functional-spec-codex.md:26`, browser `auth-service.js`, iOS `KeycloakAuthService.swift`, backend `auth/CurrentUserResolver.java` | 2, 12 |
| The Kubernetes application manifest enables an authentication bypass despite selecting the production profile. | `k8s/quarkus.yaml:33`, `auth/XUserIdAuthFilter.java`, `src/main/resources/application.properties` | 2, 11 |
| The inspected update endpoint authenticates a caller, but its repository path changes the party host without first checking existing ownership. | `party/PartyResource.java:158`, `party/PartyRepository.java:147` | 4 |
| README route/package descriptions and the Keycloak realm filename differ from source/configuration. | `README.md`, REST resource annotations, `docker-compose.yaml:28` | 1, 11, 12 |
| Some browser/iOS calls use stale singular party routes or mismatched methods. | Browser `backend-functions.js`, iOS `Partynotificationsystem.swift` and `PartyDetailView.swift`, `party/PartyResource.java` | 4, 8, 12 |
| QR generation and exchange appear to describe different flows, and a verification path uses a hardcoded signing secret. | `qr/QrResource.java`, `qr/QrService.java`, QR resource/service/repository tests | 9 |
| Private-party access rules need explicit comparison across details, media, profile lists, and attendee locations. | Party/media/user resources and repositories; both clients | 4, 6, 7, 10 |
| Later map-filter and radius changes are explicitly iOS-focused, but parts of the durable wording read as platform-neutral. | Archived `add-party-map-filters` and `integrate-map-distance-slider` proposals; both map clients | 6 |

Java paths abbreviated above are relative to `src/main/java/at/htl/`; browser paths are relative to `src/main/resources/META-INF/resources/`; iOS paths are relative to `PartyHubiOS/PartyHubiOS/`.

## Goals / Non-Goals

**Goals:**

- Produce an accepted, usable specification baseline with explicit platform scope, requirements, scenarios, and evidence.
- Make each work package resumable without conversation history.
- Preserve approved rules and distinguish their implementation status from their validity as requirements.
- Finish each domain with concrete specification/reference outputs and bounded remediation items, not another generic discovery plan.

**Non-Goals:**

- Treating every code branch or implementation defect as desired product behavior.
- Requiring identical browser and iOS UX where no shared requirement exists.
- Implementing or deploying fixes, changing application configuration, or running seed/deployment scripts as part of documentation work.
- Adding arbitrary performance numbers, retention periods, or access policies unsupported by an existing decision.

## Decisions

### 1. Use a documentation-only umbrella and bounded domain changes

This change uses `skip_specs: true` because capturing a runbook does not change product requirements. Its proposal, this design, and its checklist coordinate the work. Actual additions or changes to product requirements belong in focused domain changes, scaffolded with the OpenSpec CLI and using its current artifact instructions.

Reuse existing capability paths and requirement identities whenever their meaning remains the same. A new capability is justified by a distinct, previously uncovered contract, not merely by a new source folder. Record any deliberate split or rename so traceability survives it. Completed domain deltas are reviewed and integrated using the normal sync/archive workflow; the umbrella remains open until all work packages meet their completion gates.

Alternative considered: one giant product delta written immediately. Rejected because it would either invent unresolved rules or recreate the context-size problem. Inventing a process capability only to satisfy validation is also unnecessary because the CLI supports documentation-only changes.

### 2. Keep intended behavior and implementation evidence separate

Use accepted main specs and later explicitly approved decisions for intended behavior; use archived decisions to clarify their provenance and scope. README and intent narratives are additional inputs, not automatic overrides. Use source and tests to establish observed behavior, limitations, and evidence. When these disagree, preserve the conflict until its disposition is explicit.

In the evidence matrix, track two independent dimensions:

- Requirement disposition: accepted, proposed, decision-needed, or explicitly excluded/deferred.
- Implementation evidence: source-observed, test-present-but-not-run, runtime-verified, conflicting, missing, or unverified.

Normative requirements describe accepted behavior. Defects and uncertain observations go in the gap/decision registers, with links from the relevant requirement evidence. Do not weaken a requirement merely because the current code violates it or label an unrun test as verification.

Preserve already approved semantics: accepted follows are one-way; mutual contacts require both directions; private invitations require mutual contacts; invitation acceptance is tied to attendance; leaving changes an accepted invitation to declined; party viewers may upload gallery photos at any time. The archived baseline excludes live-location features from core discovery; later iOS distance-filter requirements do not silently authorize every live-location extension.

Alternative considered: declare the source the sole authority. Rejected because the observed ownership/authentication mismatches would become accepted behavior and prior product decisions would be lost.

### 3. Store progress and evidence in the repository

During Step 1, create the following files under `docs/openspec-baseline/`. They are execution deliverables, not files created by this proposal-writing task.

| File | Contents |
|---|---|
| `runbook.md` | Entry point linking this design, the umbrella checklist and domain changes; per-step status and next action. Avoid duplicating the full design. |
| `inventory.md` | Capability register, glossary, endpoint/screen/service inventory, entities and relationships, platform/environment scope, and owner step for every surface. |
| `coverage.md` | Capability and requirement/scenario anchors, platform, source/test references, inspected revision, evidence status, and linked decision/gap IDs. |
| `decisions.md` | Stable decision IDs, question, evidence, confirmed answer or unresolved state, affected steps, and next action. Exclusions need an explicit reason and decision reference. |
| `gaps.md` | Stable gap IDs, expected vs observed behavior, source/client/spec/doc discrepancy, affected requirement, priority, disposition, and bounded remediation scope. |
| `handoff.md` | Completed and remaining checklist items, changed files, latest inspected revision, validation results, blockers, active domain change, and exact next-task prompt. |

Keep file paths repository-relative in these documents. Track endpoints even when a feature is excluded, so an exposed surface does not disappear from the access review. A missing test is an evidence gap; it does not prevent truthful documentation of a requirement.

Alternative considered: carry forward chat summaries. Rejected because new tasks cannot reliably recover the evidence, decisions, and completion state from prior conversation history.

### 4. Execute twelve bounded work packages

The default sequence is 1 through 12. The table states the minimum dependencies; independent reading may run in parallel after those dependencies are met. Serialize writes to shared specs and registers. A work package can occupy more than one task when a proposal/review/apply transition or unresolved decision requires it; do not force unfinished work into a single task.

| Step | Dependencies | Source focus | Concrete output and completion gate |
|---|---|---|---|
| 1. Baseline | None | README; six main specs and relevant archives; backend routes/entities; browser pages; iOS screens/services; JUnit/HTTPYac test inventory | Create the six support files; map every README claim, exposed endpoint, client surface and service to a capability and owner step; seed glossary, platform matrix and known contradictions. No unassigned surface remains. |
| 2. Authentication and identity | 1 | `auth/`, `user/UserResource.java`, `config/PublicConfigResource.java`, browser auth/guard code, iOS Keycloak/Keychain/API client, realm and bypass config | Reconcile `user-auth-and-identity`; define login, callback, refresh, logout, identity linking and failure cases per client; create an access matrix including anonymous, authenticated, same-user and host-only actions; classify environment bypass behavior. |
| 3. Profiles and social relationships | 2 | `user/`, `follow/`, browser profiles/search, iOS profile/API code | Document profile fields/editing/discovery, follow request/accept/remove states, duplicate requests and mutual contacts; extend `social-and-notifications`, separating a profile capability only if justified. Cross-user visibility is explicit. |
| 4. Party lifecycle | 2 | `party/`, `location/`, party DTO validators, browser creation/detail helpers, iOS party forms/details | Reconcile creation/update/deletion/ownership, public/private access, location/theme/time/fee/age/capacity fields and errors in `party-discovery-and-management`; distinguish metadata from enforced admission rules; record ownership and stale-client route gaps. |
| 5. Invitations and attendance | 3, 4 | `invitation/`, party join/leave/member/statistics paths, invite selectors and notification actions | Produce a transition table for invite/add/remove/accept/decline/join/leave/retry; map effects on attendance, visibility and notification events; preserve mutual-contact and attendance semantics; resolve or explicitly track edge cases such as revoked/declined invitations. |
| 6. Discovery and maps | 2, 4 | Party list/filter code, browser `index.js`, iOS `Map/`, archived filter/radius changes | Reconcile discovery and `map-radius-control`: client/server filter ownership, combination rules, search/pagination, radius/location fallback, and selection/detail navigation. Label iOS-only controls and cover missing metadata and time boundaries. |
| 7. Media and profile pictures | 2, 4, 5 | `media/`, party/user upload and serving paths, browser gallery, iOS photo/profile image flows | Reconcile `party-media-gallery` and profile-image requirements: view/upload permissions, per-client support, file constraints, storage/serving/deletion lifecycle, empty/error states, and private-party access. Preserve upload-at-any-time intent and record actual gaps. |
| 8. Notifications and preferences | 3, 4, 5 | `notification/`, `notificationsettings/`, push/welcome-email services, browser notifications, iOS notification/device-token paths | Produce an event-recipient-channel matrix and requirements for read/delete, preferences, welcome/digest/out-of-app delivery, cleanup and failure behavior. Link events to domain transitions; distinguish implemented adapters from stubs and unsupported channels. |
| 9. QR login | 2 | `qr/`, QR tests and client/deep-link consumers | Specify retained generation, payload, exchange, expiry, reuse and identity rules, or record an explicit retirement/defer decision. Compare user-ID QR and stored-token exchange paths; document signing-secret and public-endpoint gaps without accepting them as policy. |
| 10. Extended client features | 2, 5, 6 | `user_location/`, attendee-location endpoints, iOS `GeoTimeTracking/`, attendee maps and `CalendarService.swift`, browser location behavior | Inventory current/live location, visit/time tracking and calendar integration; record retained/optional/excluded scope for each. For retained features, specify consent/permission, visibility, lifecycle and failure behavior based on evidence and decisions. Do not expand core discovery by inference. |
| 11. Runtime and quality contracts | 2-10 | App/test config, Compose, Keycloak, Kubernetes/storage, CI, validators and test harnesses | Reconcile `local-keycloak-environment`; complete API method/path/status/schema compatibility, validation/error, persistence/storage, external-service and environment contracts. Capture accessibility/privacy/reliability requirements only from accepted requirements or explicit product decisions; otherwise record source observations and concrete decision gaps. Do not invent numerical targets. |
| 12. Consolidation and acceptance | 1-11 | All domain outputs, coverage/decision/gap registers, README and older narrative docs | Integrate accepted domain deltas, reconcile documentation and cross-platform journeys, repair the main radius-spec Purpose, pass strict validation, and produce prioritized bounded implementation work. No in-scope requirement remains silently unresolved. |

### 5. Apply a repeatable domain completion protocol

For each domain, read the handoff and affected main specs including scenarios, inspect the table's specific source/test entry points, and update evidence only for the domain being handled. Recheck changed source since the recorded revision. Resolve a product decision only when the available approved artifacts do not already answer it; otherwise reuse that decision.

Write concrete requirements and scenarios for normal behavior, authorization denial, invalid input, boundaries, missing data, repeated actions and state transitions as relevant. The access matrix and data lifecycle are cross-cutting references, not duplicate definitions with competing rules. Every requirement has an explicit backend/browser/iOS/environment scope.

When a domain needs a new change, use `openspec new change` and the current `status`/`instructions` workflow or the corresponding proposal skill. Existing capability requirements need proper modification deltas rather than a near-duplicate capability. A domain requiring no delta can close with a documented coverage review, provided all its behaviors are already covered. Follow skill boundaries: a proposal-writing task stops after planning artifacts; the next requested task performs any remaining documentation execution and accepted integration.

Validate each domain change before integration. Mark its umbrella checklist items complete only when their stated outputs exist, conflicts have dispositions, and accepted specification updates are integrated. A draft proposal alone does not complete a domain. Application fixes remain separate backlog items and are not prerequisites for documenting their expected behavior.

Alternative considered: close a group after writing its next proposal. Rejected because the umbrella would finish without a usable durable specification baseline.

### 6. Use explicit validation and handoff gates

For this umbrella proposal:

```sh
openspec validate complete-partyhub-specification --type change --strict --no-interactive
```

For an individual domain, use its real change name with `openspec validate --type change --strict --no-interactive`. After integration, run:

```sh
openspec validate --specs --strict --no-interactive
```

Record the initial radius-Purpose failure separately from any new change failures until Step 12 repairs it directly in the main spec. This is an explicitly scoped baseline documentation correction: replace the placeholder with a description of the capability's already accepted purpose without changing its requirements. Requirement changes still use domain deltas. A delta Purpose cannot replace an existing capability's Purpose. Syntax validation is necessary but not a semantic review or evidence that application tests pass.

Final acceptance requires complete inventory ownership, traceable requirements/scenarios, coherent access and state-transition rules, documented platform differences, resolved or explicitly approved exclusions, and no blocking product decision for an in-scope requirement. Review at least login-to-profile, discover-to-detail, follow-to-mutual-invite, invite-to-attendance, edit/cancel-to-notification, and party-access-to-gallery journeys. Cover retained QR/extended flows as well. Review public and protected access across profiles/social, party/media/location, and QR surfaces against the access matrix.

Application test execution is optional for this documentation change; if used to resolve a specific uncertainty, record the command/environment/result and avoid destructive seed or deployment flows. Strict OpenSpec validation and evidence review are the completion checks. Missing runtime coverage and actual code defects remain visible in the remediation backlog.

Use this handoff template at every stop:

```text
Step and status:
Repository revision and relevant working-tree differences:
Completed checklist items and files:
Domain change and integration status:
Requirements/scenarios covered:
Source and test evidence, including what was not run:
Confirmed decisions:
Open questions and implementation gaps:
Validation command and result:
Remaining work in this step:
Exact next-task prompt:
```

## Risks / Trade-offs

- [Source is mistaken for policy] -> Keep requirement disposition and implementation evidence separate; record defects in `gaps.md`.
- [Main specs or clients change between tasks] -> Record revisions and affected working-tree changes, then refresh only affected evidence before continuing.
- [Shared capabilities receive conflicting edits] -> Serialize specification integration and track domain change names in the runbook.
- [Scope silently grows into feature work] -> Keep tasks documentation-only; move remediation to bounded implementation changes with their own authorization.
- [Older documents override later approved decisions] -> Trace decisions through main specs and archives; reconcile obsolete narrative wording at acceptance.
- [Known conflicts turn into endless investigation] -> Give each a specific owner step and decision/evidence needed for closure. Defer only explicitly; unresolved in-scope policy blocks that requirement's acceptance.
- [The runbook is treated as the finished specification] -> Keep all execution checklist items open until actual deliverables and integrations meet their gates.

## Migration Plan

1. Review this proposal, design and checklist. This proposal-writing task creates only the umbrella planning artifacts.
2. Start execution in a new task with the Step 1 prompt below. Create the support package and evidence baseline.
3. Complete the numbered work packages using their dependencies, updating the handoff and checklist at each stop. A context limit or required workflow transition creates a handoff, not a completed checkbox.
4. Integrate accepted domain specification changes as they are completed; preserve archived history and reusable requirement identities.
5. Complete Step 12, verify the durable specification set and supporting documents, and archive the umbrella through the standard archive workflow only when its documentation tasks are complete.

There is no runtime rollout or data migration. If a documentation integration must be reverted, revert only its reviewed documentation changes and restore the relevant checklist/coverage state; preserve unrelated working-tree edits and evidence about existing application behavior.

### First execution prompt

```text
Use openspec-apply-change for complete-partyhub-specification.
Execute only task group 1 (Baseline and durable handoff package).
Read the change's proposal.md, design.md and tasks.md from the current
repository before acting. Create the documentation package described in
the design, grounded in the existing specs and named source evidence.
This task is documentation-only. Preserve unrelated working-tree edits.
Record the inspected revision, evidence limits and next-task prompt.
Stop after group 1; do not begin group 2.
```

### Subsequent execution prompt

```text
Continue complete-partyhub-specification, task group <N> only.
Read its design.md and tasks.md plus docs/openspec-baseline/runbook.md
and handoff.md. Resume the named domain change if one already exists.
Follow the domain's required proposal/review/execution stage and skill
boundary. Deliver the concrete documentation/specification outputs,
record gaps separately from accepted behavior, and update the handoff.
Stop at this group's completion gate or a required workflow transition;
do not start the next group or implement application fixes.
```
