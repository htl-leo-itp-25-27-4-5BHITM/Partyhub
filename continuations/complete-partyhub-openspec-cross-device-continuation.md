# Continuation: complete the PartyHub OpenSpec baseline

Date: 2026-09-30

## Goal

Continue the documentation-only OpenSpec run in dependency order until all 12
work packages and the final acceptance gates are complete. Do not stop after a
proposal. Each completed group needs verified acceptance criteria, updated
durable records, strict validation where required, and a scoped Git commit.

Repository on the original device:

`/Users/viktoriavejmelek/Documents/HTL/4. Jahrgang/ITP/Partyhub/Partyhub`

The path may differ on the new device. Work from the repository root there.

## Cross-device start

1. Make sure the old `Create OpenSpec specification run` task is no longer
   writing to the original checkout. Avoid two writers advancing this runbook.
2. Fetch and check out the latest remote `main`, then inspect `git status`,
   `git log --oneline --decorate -12`, and the files named below.
3. Treat Git and the durable repository files as authoritative. Local
   uncommitted changes from the original device do not transfer to another
   device.
4. Read, in this order:
   - `docs/openspec-baseline/runbook.md`
   - `docs/openspec-baseline/handoff.md`
   - `openspec/changes/complete-partyhub-specification/design.md`
   - `openspec/changes/complete-partyhub-specification/tasks.md`
   - the design, tasks, delta, evidence, decisions, gaps and affected main specs
     for the first incomplete group
5. Compare the checked-out commit and checklists with the checkpoints below.
   Continue from the first incomplete acceptance gate rather than repeating
   completed work.

## Durable checkpoint

The current completed checkpoint is:

`0f2b043 docs: complete extended client feature specs`

At that commit:

- Groups 1-10 are complete and committed.
- `document-extended-client-features` is applied and synced with all 8/8 child
  tasks complete; umbrella task 10.3 is complete.
- The accepted baseline is 6 capabilities, 55 requirements and 290 scenarios,
  including PARTY-01 through PARTY-19 at 19 requirements/113 scenarios.
- Q002 is resolved through D022/PARTY-17-PARTY-19 while shared location remains
  deferred and its endpoints remain inventoried.
- Official umbrella progress is 35/46, with 11 items remaining.
- Groups 11 and 12 have not started.

Verify the checked-out `main` contains `0f2b043` before continuing. Start with
Group 11; do not repeat Group 10.

## Accepted Group 10 semantics

- Current device location may be used locally for finite distance/radius and
  explicitly enabled visit detection. It does not publish coordinates, create
  attendance, accept an invitation, authenticate a user, or grant visibility.
- Shared current/attendee location remains deferred. The exposed location
  endpoints stay inventoried until a separate proposal defines consent,
  audience, precision, freshness, revocation, deletion/retention and
  private-party behavior.
- Optional iOS visit tracking is explicitly enabled, permission-gated and
  device-local. Its intervals never mutate backend attendance.
- Optional iOS calendar export is user initiated, permission-gated and a local
  snapshot. PartyHub state never depends on EventKit success, and automatic
  synchronization or browser parity is not promised.

## Remaining work after Group 10

### Group 11: runtime and quality contracts

Complete tasks 11.1-11.5 as one bounded work package, following the umbrella
design and its completion gates:

1. Reconcile local/runtime authentication and startup documentation with
   Compose, realm files, public configuration, application profiles and
   Kubernetes manifests.
2. Document application-data, upload, profile-picture and notification-cleanup
   lifecycles, keeping unknown migration/retention behavior explicit.
3. Finish the cross-client API method/path/status/schema and validation/error
   matrix for every inventoried endpoint and client call, including README-only
   claims. Resolve Q006/Q014 only where the evidence and accepted semantics
   support a concrete answer.
4. Record accepted quality expectations and JUnit/HTTPYac/CI evidence. Treat
   test existence separately from test execution and do not invent targets.
5. Integrate any accepted runtime/API spec deltas through the normal OpenSpec
   workflow, update all durable records, validate, and create a scoped Group 11
   completion commit.

### Group 12: consolidation and final acceptance

Complete tasks 12.1-12.6:

1. Audit inventory-to-requirement-to-scenario-to-evidence coverage.
2. Recheck the named end-to-end journeys and all cross-capability access/state
   transitions.
3. Reconcile README and stale narrative documentation, repair obsolete local
   links, and replace the existing `map-radius-control` Purpose placeholder as
   the scoped baseline correction tracked by G012.
4. Run and record final strict OpenSpec validation.
5. Produce the prioritized, bounded implementation backlog from remaining
   gaps, with requirements, source areas, scenarios and dependencies.
6. Finalize runbook, coverage, decisions, gaps, checklist and handoff so all 46
   items are verifiably complete and the umbrella is archive-ready.

Do not archive the umbrella or active child changes until the final completion
gates explicitly allow it. Do not implement application fixes, deploy, reset
data, or expand this specification run into unrelated product work.

## Validation and completion protocol

For every group:

1. Inspect source evidence and current specs before changing normative text.
2. Keep observed implementation behavior separate from accepted requirements.
3. Update the relevant evidence files plus `coverage.md`, `decisions.md`,
   `gaps.md`, `inventory.md`, `runbook.md`, the umbrella checklist and
   `handoff.md`.
4. Run the relevant strict child/change and affected main-spec validation.
5. Verify the group's acceptance criteria directly; a complete proposal alone
   does not complete a group.
6. Commit only the completed group's scoped files.
7. Continue to the next dependency-ordered group. If a true fresh-context
   reset is unavailable, reread the durable handoff and runbook; do not claim
   that this simulated a reset.

Final umbrella commands from the design:

```sh
openspec validate complete-partyhub-specification --type change --strict --no-interactive
openspec validate --specs --strict --no-interactive
```

Record validation output accurately. OpenSpec validation does not prove that
application, API, UI, device, database, deployment or provider tests ran.

## Preservation rules

Do not overwrite, stage or include unrelated user edits in:

- `prompts/prompts.md`
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`

Before each commit, inspect `git status`, the staged diff and the commit diff.
Keep application source, configuration, deployment, databases and user data
unchanged throughout this documentation/specification run.

## Authorization and decisions

The user authorized continuing through the full runbook, project-local edits,
routine evidence-backed decisions, validation and scoped commits. This
authorization supersedes older one-group stopping instructions in historical
handoffs. Record the rationale for routine choices. Ask the user only when a
material product ambiguity cannot be resolved from accepted semantics or
repository evidence, or when a tool-enforced permission requires their action.

## Final report

When all 12 groups are complete, report:

- 46/46 umbrella items complete;
- the final requirement/scenario totals and integrated changes;
- strict validation results;
- the scoped completion commit history;
- any remaining implementation backlog or limitations;
- confirmation that the two unrelated user files were preserved.
