# Design

## Context

See [proposal.md](proposal.md) for motivation and [spec delta](specs/user-auth-and-identity/spec.md) for proposed behavior. This design is needed because authentication crosses browser, native client, backend identity, environment declarations and the umbrella's staged integration protocol.

Step 2 source review is complete at `9487ccb90bb438e24b3cfab547a5dc900b11aecb` (2026-09-23). Its evidence is [authentication.md](../../../docs/openspec-baseline/authentication.md), [access-matrix.md](../../../docs/openspec-baseline/access-matrix.md), and [auth-environments.md](../../../docs/openspec-baseline/auth-environments.md). All 58 custom routes were traced through annotations, resolver calls and repository predicates. Browser uses tab-session storage and provider logout; native uses Keychain and local logout. Tests were inspected only: synthetic resolver identities and JWT-disabled/bypass-enabled test configuration cannot establish real-token compliance.

The existing main capability has nine requirements/27 scenarios. The proposal adds three requirements/15 scenarios and one scenario to an existing requirement, resulting in twelve requirements/43 scenarios after integration. Counts must be recomputed from the actual files at integration, not trusted if concurrent changes occur.

## Goals / Non-Goals

**Goals:** Integrate a scoped authentication contract without losing existing scenarios, preserve requirement identity through explicit rename mappings, and make source conflicts and unapproved policy visible to future tasks. Completion means documentation integration and traceability, not application conformance.

**Non-Goals:** No client/backend/configuration fixes, deployment, token probes, data resets, full security audit, or profile/social implementation. No new policy for public user fields, QR credentials, invitation rosters, live locations, ambiguous account linking or provider-wide native logout. Those are identified decisions, not implicit permissions.

## Decisions

### Preserve one capability and stable coverage identities

Use `user-auth-and-identity`, because both clients share the same backend token-to-user contract. Splitting native authentication into a duplicate capability would separate identity invariants from their consumers. Keep AUTH-01–AUTH-09 stable; map AUTH-02 and AUTH-03 to their renamed headings and preserve their complete bodies/scenarios. AUTH-09 is a full MODIFIED block with all previous scenarios and an explicit domain-authorization scenario.

Assign AUTH-10 to public configuration, AUTH-11 to native login, and AUTH-12 to native session management only after sync. Add their exact requirement/scenario anchors to coverage then. Before sync they remain proposed entries, excluded from accepted totals.

### Preserve platform differences and state the proposed minimum

Browser storage/provider logout stays unchanged. Proposed native requirements explicitly use platform credential storage, callback transaction binding, bearer `/me` resolution and local logout, matching the discovered architecture while keeping gaps visible. Requiring browser storage mechanics on iOS was rejected because the existing browser rule has browser scope. Requiring provider-wide native logout or revocation was rejected as an unsupported extension (Q013); the proposed local guarantee does not forbid later strengthening.

Native nonce binding and usable-session restoration are proposed requirements whose source mismatches are G022/G023, not assertions of current compliance. No application tasks are created here to repair those gaps. Temporary network failure recovery and exact status/schema details remain documented evidence limits; no numerical retry/retention guarantees are invented.

### Keep accepted identity and object authorization separate

Existing D001–D003 remain in force. Environment bypass, numeric-subject precedence and object-check omissions do not become compatibility requirements. The matrix's intended column cites accepted rules or Q IDs; it does not upgrade observed public access to policy. AUTH-09 requires domain checks where a capability already requires them, without deciding which additional profile/settings/roster endpoints should be public or self-only.

Retain existing one-unlinked-match and create-or-onboard alternatives unchanged. Q011 (local creation), Q012 (ambiguous/untrusted claim matching) and Q013 (remote native logout) are explicitly outside this delta's added guarantees. Their unresolved status and owner must survive integration and must be addressed before the overall baseline claims full scope coverage. Inventing a recovery policy from the first-result query was rejected. If later review requires changing those guarantees, revise the proposal before integration rather than silently broadening it.

### Use a later requested documentation execution for integration

This proposal stops at planning as required by `openspec-propose`. The next explicit apply request authorizes executing this change's documentation checklist and normal `openspec-sync-specs` integration; it does not authorize code fixes. Sync the delta through the supported skill, preserving six unaffected existing requirement blocks, both renamed bodies and all old scenario identities.

After sync, directly replace only the identity spec's Purpose with a current browser/iOS/backend scope summary. OpenSpec's specs instructions explicitly state that an existing capability's Purpose is edited directly and a delta Purpose would be ignored. Do not repair the separate radius Purpose; that remains umbrella Step 12/G012. Broad README/older narrative correction also remains Step 12, with G001 split between identity wording resolved here and historical documentation outstanding.

The umbrella's 2.4 remains unchecked until this integration and its traceability/validation record exist. The domain change remains open unless separately finalized through the archive workflow; neither proposal existence nor application source presence proves completion.

## Risks / Trade-offs

- [Native requirements mistaken for implemented behavior] → Keep proposed/accepted status separate from observed/conflicting/runtime-unverified evidence and retain G022/G023 after integration.
- [Rename or partial modification loses old scenarios] → Compare all nine original requirement blocks and 27 scenario labels, allowing only declared renames and AUTH-09 changes; recompute final counts.
- [Open endpoint policy hidden behind an authentication claim] → Keep Q001–Q013 and all 58 matrix entries; accepted token identity is not blanket host/self/public authorization.
- [Known baseline validation failure hides new errors] → Validate this child and umbrella independently, then main specs; only the existing radius Purpose failure is tolerated before Step 12.
- [Unrelated working-tree edits included or overwritten] → Limit writes to this child, identity spec/Purpose, supporting baseline Markdown and umbrella checklist. Preserve prompts and Xcode user-state changes.

## Migration Plan

There is no runtime rollout. A later apply execution reads these artifacts and the saved handoff, confirms unchanged evidence or refreshes specifically changed paths, validates the delta, syncs the accepted changes, updates identity Purpose and coverage/registers, and verifies links/counts/strict validation. It records group 2 completion or any remaining decision/integration blocker and stops before group 3.

If documentation integration needs reversal, restore only this domain's spec/coverage/checklist edits while retaining evidence of application gaps and unrelated working-tree changes. The umbrella remains active for groups 3–12.
