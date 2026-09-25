# Design

## Context

See [proposal.md](proposal.md) for the motivation. The backend currently selects among separate default, legacy-filter, new-filter, and sort branches. Only the default and new-filter branches apply the viewer predicate, while query composition, ordering, and pagination differ by branch. The browser fetches an authorized list and narrows it locally for its list and map experiences. The iOS map also narrows locally, using the archived filter and radius behavior now represented by PARTY-08 through PARTY-11 and RADIUS-01 through RADIUS-03.

The archived filter proposal is explicitly client-side and iOS-specific. Its radius follow-up adds a SwiftUI map overlay and an unlimited state. D010 still excludes live location and mandatory nearby filtering from the shared core baseline. The existing `map-radius-control` Purpose placeholder remains reserved for umbrella Step 12.

## Goals / Non-Goals

**Goals:**

- Give every server query branch one visibility-first composition model and stable page boundaries.
- Separate shared backend authorization/query behavior from browser-local narrowing and iOS-only map controls.
- Define iOS filter boundaries precisely enough to test combinations, missing metadata, reset, and location transitions.
- Keep radius selection, map visualization, filter state, and results synchronized.

**Non-Goals:**

- Implement backend or client changes in this documentation change.
- Require the browser to reproduce the iOS filter sheet, slider, active summary, or MapKit visualization.
- Make live attendee/current-user location part of core discovery or decide the Step 10 extension scope.
- Choose final HTTP response envelopes, error statuses, default page-size limits, or legacy-route migration owned by Step 11 and Q014.
- Repair the main `map-radius-control` Purpose before Step 12.

## Decisions

### Decision: Build every server query from a viewer-eligible candidate set

The eventual backend implementation should construct one candidate set using the PARTY-04 viewer predicate and add supported predicates to that set. Search, theme, date, age, fee, distance, sort, limit, and offset must not select a branch that bypasses visibility.

This makes query composition independent of caller type and prevents pagination from leaking counts or rows from private parties. Retaining separate legacy branches was rejected because those branches already omit visibility and make combined criteria unpredictable.

### Decision: Apply query predicates with AND and page only after stable sorting

All supplied server predicates match conjunctively. Visibility and filters run before ordering; ordering runs before offset and limit. A stable party identifier resolves equal primary sort values so repeated pages over unchanged data have deterministic boundaries.

Applying pagination before in-memory distance filtering was rejected because it can return short or inconsistent pages and can skip matching parties outside the pre-filtered slice. Leaving tie order unspecified was rejected because offset pagination then cannot provide a stable observable contract.

### Decision: Keep server search narrower than client presentation search

The shared server `q` contract covers title, description, and displayable theme metadata. The iOS local map search may additionally use location and host display name because those fields are already present in its authorized party projection. Browser local controls may likewise narrow fields already received.

Requiring every client-local search field in the server query was rejected because it would enlarge the shared API contract beyond the archived behavior and blur projection ownership. Client narrowing can remove authorized rows but can never restore a party omitted by the backend.

### Decision: Use explicit inclusive time and metadata boundaries

A valid server time range includes both endpoints. The iOS two-week filter includes starts from the evaluation instant through the corresponding instant 14 calendar days later. Parties without a usable start time do not match that active filter. Missing age bounds are open, a selected age interval matches an overlapping party interval, and missing or zero fee counts as free. Parties without coordinates do not match a finite-distance predicate.

These rules make boundary tests possible and preserve the archived filter intent. Treating missing data as an automatic match for an active criterion was rejected because it undermines AND composition.

### Decision: Resolve Q008 in favor of strict AND composition

When at least one theme is selected, a party must have non-blank displayable theme metadata matching a selected value. Passing time, distance, age, fee, or text predicates cannot compensate for a missing or non-matching theme.

The archived phrase allowing another non-theme filter to include the party was rejected because it contradicts the existing all-active-criteria scenario and produces an implicit OR path for one missing field.

### Decision: Model radius as finite values plus an explicit unlimited default

The iOS control uses a single radius state shared by filtering, the slider, active summary, and visualization. Finite values require current user location and include parties at or inside the threshold. Unlimited applies no distance predicate and renders no radius circle. Reset selects unlimited. If location becomes unavailable, the client normalizes any finite state to unlimited and updates every dependent surface together.

Keeping a finite value active without location was rejected because it either empties results silently or displays a radius that cannot be evaluated. Mapping unlimited to an arbitrary large circle was rejected because it misrepresents the absence of a distance predicate.

### Decision: State iOS scope in every map-control requirement

PARTY-08 through PARTY-11 and the radius requirements name the iOS home map or SwiftUI surface directly. Shared visibility and server query behavior remain platform-neutral. Browser UI parity remains optional under PARTY-13.

Relying only on archive history or implementation names to convey scope was rejected because durable requirements must remain unambiguous without reading historical changes.

## Risks / Trade-offs

- [Existing clients depend on branch-specific query behavior] → Preserve exact wire migration for Step 11, but make the target visibility and composition behavior uniform before implementation.
- [Offset pages can still shift when data changes between requests] → Guarantee deterministic ordering over unchanged data; cursor pagination is outside this change.
- [Client and server clocks can disagree] → State which clock evaluates each filter and test the inclusive boundaries independently.
- [Location permission can change while the map is open] → Normalize finite radius to unlimited as one state transition and recompute UI/results from that state.
- [Theme labels can differ by case or whitespace] → Compare normalized display labels while retaining user-facing metadata; exact normalization implementation remains internal.
- [The main radius spec still fails strict overview validation] → Keep G012 and the Step 12 repair visible in every validation record instead of widening this change.

## Migration Plan

1. Apply and sync this documentation delta through the normal OpenSpec workflow; do not edit the main Purpose during this step.
2. In separate implementation changes, consolidate server party queries behind the accepted viewer predicate and stable post-filter pagination.
3. Reconcile browser callers with the authoritative visible result set without adding iOS-specific controls.
4. Reconcile iOS filter and radius state transitions, then add targeted query, filter-combination, missing-metadata, boundary, location-loss, reset, and visualization tests.
5. Repair the existing radius Purpose during umbrella Step 12 and run full strict validation there.

Rollback of a later implementation should preserve the accepted visibility predicate. Client UI changes can be reverted independently, while any query-path rollback must not reintroduce private-party leakage.
