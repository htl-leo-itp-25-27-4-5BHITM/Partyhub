## Context

PartyHub already implements a broad set of product flows across Quarkus backend resources and a browser-based frontend under `META-INF/resources`. The repository does not currently contain active OpenSpec capability specs, which makes it easy for future work to mix verified behavior with intended behavior from `docs/intent.md`.

This design is documentation-first rather than code-first. The goal is to introduce a stable OpenSpec package that converts the validated functional analysis into capability-level requirements. That package must help Codex work safely in a brownfield system where:

- the current login model is browser-stored user identity,
- Keycloak is the planned future authentication direction,
- invitation acceptance is tied to party attendance,
- private-party invitees are restricted to mutual contacts,
- gallery viewing is implemented but gallery upload is only partially represented.

## Goals / Non-Goals

**Goals:**

- Create an OpenSpec proposal, design, tasks file, and capability specs that reflect the clarified product rules.
- Separate verified brownfield behavior from target behavior where those differ.
- Keep the package implementation-neutral enough to guide future work without forcing premature code changes.
- Provide a baseline that can later be archived into long-lived specs after the team accepts it.

**Non-Goals:**

- Implement any product changes in backend or frontend code.
- Resolve unresolved product questions that are still open.
- Replace the richer narrative in `docs/functional-spec-codex.md`; this change complements it with structured OpenSpec artifacts.

## Decisions

### 1. Model the package as four capabilities

The change is split into four capability specs:

- `user-auth-and-identity`
- `party-discovery-and-management`
- `social-and-notifications`
- `party-media-gallery`

This is preferred over a single monolithic capability because future work is likely to touch these areas independently. It also aligns with how the codebase is already organized into user, party, invitation, notification, and media concerns.

Alternative considered:

- A single `partyhub-core-experience` capability. Rejected because it would make future deltas too broad and harder to archive cleanly.

### 2. Treat current behavior and target behavior as separate requirement layers

The specs use normative requirements for the current required system behavior, while the proposal and design capture the major target-direction gaps. This avoids overstating planned behavior as already implemented.

Alternative considered:

- Write requirements only for the target system. Rejected because it would not be truthful to the brownfield implementation Codex is working against today.

### 3. Preserve clarified business semantics exactly

The package codifies the following resolved rules without reinterpretation:

- current browser-stored user ID is the active login model,
- Keycloak is the planned future auth target,
- follow requests are the intended social model,
- invitation acceptance happens through joining/attending the party,
- private invites are limited to mutual contacts,
- gallery UI upload is target behavior unless implemented later.

Alternative considered:

- Normalize these into more generic social or auth language. Rejected because the clarified semantics are the most valuable part of this package.

### 4. Leave unresolved items as explicit open questions

Questions such as post-party upload enforcement, next-14-days filtering as product rule versus implementation detail, and compatibility strategy during Keycloak migration stay open in design rather than being silently embedded in requirements.

Alternative considered:

- Guess likely answers from code. Rejected because the user explicitly asked not to make assumptions.

## Risks / Trade-offs

- [Risk] Future implementation may drift from these new specs if the package is not referenced during feature work. → Mitigation: keep the capabilities narrowly scoped and use them as the baseline for subsequent change proposals.
- [Risk] Some current brownfield behaviors are implementation details rather than intended long-term product rules. → Mitigation: record them truthfully now and isolate uncertain items in open questions.
- [Risk] The absence of existing long-lived `openspec/specs/` means this package starts as a change-local baseline only. → Mitigation: archive it later once the team is satisfied with the structure and wording.

## Migration Plan

1. Add the OpenSpec change package under `openspec/changes/capture-partyhub-functional-spec/`.
2. Validate the package with `openspec validate --type change capture-partyhub-functional-spec`.
3. Use the package as the reference point for future product and implementation changes.
4. Archive the change into long-lived specs once the team confirms the capabilities and wording.

Rollback strategy:

- Remove the change directory if the package structure or wording is not accepted.

## Open Questions

1. Should gallery upload be allowed only after the party end time, or is “after the party” purely a UX expectation?
2. Is the current next-14-days filter on the home map a real product requirement or only a current implementation choice?
3. Should attendee and live user location remain supported as optional extensions, or be explicitly excluded from the default experience?
4. During Keycloak adoption, should `X-User-Id` compatibility remain temporarily for brownfield clients?
