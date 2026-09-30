# Discovery and maps review

Group 6 review and integration, 2026-09-25, against application-source snapshot `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, started from repository checkpoint `5287ac8e4a4d54b0e50c528689ceea1b48eab07f`. This record separates accepted D001-D018 behavior from observed source. `document-discovery-and-maps` is applied and synced. No application, API, browser, iOS, database, deployment, or runtime test was executed.

## Scope and authorities

- PARTY-01/PARTY-04 and D007/D016/D017 already establish the shared viewer floor: anonymous callers see public parties; authenticated callers may additionally see parties they host, have a pending invitation to, or have joined. Every list/search/filter/sort branch must apply the same predicate.
- D010 excludes mandatory nearby filtering and live attendee/current-user location from core discovery. It does not remove the accepted optional iOS filters.
- D011 and the archived `add-party-map-filters` and `integrate-map-distance-slider` changes establish iOS scope for PARTY-08-PARTY-11 and RADIUS-01-RADIUS-03. They do not require browser control parity.
- D018 and resolved Q008 apply strict AND composition: a party without matching displayable theme metadata cannot pass an active theme filter.
- G012 and W003 reserve the existing `map-radius-control` Purpose placeholder for Step 12. The child delta does not contain or alter a Purpose section.

## Shared query ownership

| Concern | Accepted contract | Observed source | Disposition |
|---|---|---|---|
| Viewer eligibility | Build one server-authorized candidate set before every query operation. Anonymous is public-only; an authenticated viewer adds host, pending-invitee, and joined roles. | `PartyRepository.getPartiesByUser` and `findWithFilters` contain a viewer predicate. Legacy text/theme/date methods and `sortParty` query all parties. | PARTY-16 reuses PARTY-04. G009 remains the visibility implementation gap; G034 records branch composition. |
| Predicate composition | Every supplied supported predicate is combined with AND. Client filters may only remove rows from the authorized server result. | `PartyResource.getParties` selects mutually exclusive new-filter, legacy-filter, sort, or default branches. Legacy filters use `else if`; combinations can be ignored. | Consolidate only in a later application change. Exact wire migration remains Q014/Step 11. |
| Shared text search | Case-insensitive title, description, or displayable theme match. | New-filter repository code searches those three fields. Legacy `q` searches title/description only. Browser local search additionally uses location/visibility; iOS additionally uses location/host/theme. | PARTY-16 defines the server floor; client-only extra fields remain local and cannot expand visibility. |
| Time | A supplied server start range is complete, ordered, and inclusive. The optional iOS two-week filter uses the client evaluation instant through the same instant 14 calendar days later, inclusive. | Legacy date range requires both endpoints and uses `BETWEEN`; new filters always add now-to-14-days even when the caller selected only age/fee/location. Browser home map applies a local day-normalized 14-day window by default. | Proposed contract removes implicit server time filtering from unrelated criteria and preserves D010. Browser presentation remains independent of iOS controls. |
| Age | A party's admission interval overlaps the selected interval; absent bounds are open. A shared single-age query matches inside the party's open/closed bounds. | Backend single-age query treats missing bounds as open. iOS minimum/maximum predicates implement interval overlap. | PARTY-10 and PARTY-16 state both responsibilities; admission enforcement remains Q004. |
| Fee | Missing or zero fee is free; a positive fee is paid. | Backend and iOS use the same classification. Browser local list treats missing fee as zero. | Proposed behavior follows existing accepted filter intent without making fee an attendance rule. |
| Distance | A finite query requires a complete caller coordinate pair and positive threshold; parties without coordinates do not match. Unlimited applies no distance predicate. | Backend validates coordinate pairing and distance, filters after fetching, then slices. iOS finite values require location and unlimited is `nil`. | PARTY-16 owns server composition; PARTY-10 and radius specs own the iOS state. Live attendee location remains Step 10. |
| Sort and pagination | Apply deterministic sort after visibility/filtering, then non-negative offset and positive limit. Resolve equal primary values with a stable party identifier. | Pagination is only honored by `findWithFilters`, after its in-memory distance filter, with default 50/0. Other branches ignore `limit`/`offset`; sort does not compose with filters and equal-value ordering is unspecified. | PARTY-16 defines observable stable pages; default/max sizes and exact errors remain Step 11. G034 retains source mismatch. |

## Browser and iOS responsibilities

| Surface | Observed behavior | Accepted boundary |
|---|---|---|
| Browser home map | Fetches `GET /api/parties`, then locally shows parties in a next-14-days window and renders markers. It has no iOS-style filter sheet or radius control. | It consumes the server-authorized visible set. Its presentation may narrow that set; PARTY-08-PARTY-11 and radius-control UI do not create browser parity requirements. |
| Browser party list | Fetches the visible list once, then locally filters public/private/invited/hosted/free, searches several displayed fields, and sorts. Shared helpers also expose server sort/search calls, including an observed wrong-method search path owned by G006/Q014. | Local filtering never restores server-excluded rows. Shared server query behavior is PARTY-16; exact route/method migration remains Step 11. |
| iOS party sync/map | The map filters its locally loaded party collection. Party list loading is currently unauthenticated and can remove private local rows missing from the response, already tracked by G030. | Viewer-dependent loading must carry usable bearer identity under PARTY-13. Local filter and radius state operate only on the authorized response. |
| iOS filter UI | Dedicated state covers time, themes, finite/unlimited distance, age interval, all/free/paid fee state, and text. Predicates are evaluated sequentially as AND; reset reconstructs default state. | PARTY-08-PARTY-11 name iOS scope, define boundaries and synchronize annotations, clusters, counts, summary, and controls. The accepted free-filter requirement does not add a shared paid-filter mandate. |

## iOS filter boundary matrix

| Filter state | Match rule | Missing-data rule | Reset state |
|---|---|---|---|
| Time | Start is from evaluation time through +14 calendar days, inclusive. | Missing/unusable start does not match while active. | Any time. |
| Theme | Non-blank normalized theme matches one selected theme. Multiple selected themes are alternatives inside the theme dimension; the dimension remains AND with all others. | Missing/non-matching theme does not match; no other filter overrides it. | No selected themes. |
| Distance | Finite: coordinates at or within selected threshold. Unlimited: no distance predicate. | Missing user location resets finite to unlimited; missing party coordinates do not match a finite radius. | Unlimited. |
| Age | Party age interval overlaps selected interval; absent party or selected bound is open. | No party bounds means an open interval. | Both selected bounds unset. |
| Free | Missing or zero fee matches free. | Missing fee is free. | All fees. |
| Text | Trimmed, case-insensitive substring of name, description, location, host display name, or theme. | An absent individual field contributes no match; another listed field may match within the same text dimension. | Empty text. |

All active dimensions combine with AND. D018 and the synced PARTY-08/PARTY-11 wording resolve Q008 with this rule.

## Radius state transitions

| Prior state / trigger | Next state | Results | Slider/summary/circle/camera |
|---|---|---|---|
| Default or reset | Unlimited | No distance predicate. | Slider and summary show unlimited; no circle; no radius camera focus. |
| Unlimited to finite with location | Selected finite threshold | Only parties with coordinates at or inside threshold remain. | Slider/filter state synchronize; matching finite circle is shown; camera fits the circle. |
| Finite to another finite value | New finite threshold | Recompute from the authorized visible set. | Circle and camera update without reopening the map. |
| Finite to unlimited | Unlimited | Restore parties excluded only by distance. | Remove circle and active distance summary. |
| Finite while user location becomes unavailable | Unlimited | Do not evaluate an invalid predicate or silently empty results. | Disable or mark finite control unavailable; synchronize slider, summary and circle. |
| Unlimited while location is unavailable | Unlimited | Preserve otherwise matching authorized parties. | Finite selection unavailable; no misleading circle. |

The current iOS source already resets finite state when location is absent and disables the slider. It intentionally suppresses circle and radius-camera behavior for the 5 km finite option, which conflicts with the existing all-finite radius wording and is recorded as G035. No UI behavior was executed.

## Integrated child change and coverage

The [proposal](../../openspec/changes/archive/2026-09-30-document-discovery-and-maps/proposal.md), [design](../../openspec/changes/archive/2026-09-30-document-discovery-and-maps/design.md), [party delta](../../openspec/changes/archive/2026-09-30-document-discovery-and-maps/specs/party-discovery-and-management/spec.md), [radius delta](../../openspec/changes/archive/2026-09-30-document-discovery-and-maps/specs/map-radius-control/spec.md), and [tasks](../../openspec/changes/archive/2026-09-30-document-discovery-and-maps/tasks.md) are applied, synced and complete.

- PARTY-16 adds 8 scenarios for visibility-first query composition, search, time/metadata validation, deterministic pagination, and client responsibility.
- PARTY-08/PARTY-09 retain 5/4 scenarios with explicit iOS scope and synchronized reset/result behavior.
- PARTY-10 expands from 7 to 8 scenarios by making unlimited distance explicit while preserving all existing scenario names.
- PARTY-11 retains 2 scenarios and resolves the missing-theme wording in favor of strict AND composition.
- RADIUS-01 expands from 2 to 3 scenarios, RADIUS-02 retains 1, and RADIUS-03 expands from 4 to 6.
- At the Step 6 checkpoint, the party capability was **16 requirements/97 scenarios**, radius was **3 requirements/10 scenarios**, and the full baseline was **47 requirements/212 scenarios**. Group 7 later extends the total to 48/235 without changing these blocks.

At the Step 6 checkpoint, accepted coverage was **6 capabilities, 47 requirements and 212 scenarios**. D018/PARTY-16 and the reviewed filter/radius wording are integrated; Group 7 later adds SOC-07 and expands MEDIA-01-MEDIA-03 without changing these discovery/radius requirements.

## Remaining work

- Keep G009/G030/G034/G035 as implementation/client gaps after documentation integration.
- Keep G012 and the radius Purpose correction assigned to Step 12.
- Keep exact HTTP methods, statuses, envelopes, default/max page size, and compatibility behavior in Step 11/Q014.
- Start Group 7 only in a separate bounded task; do not implement application fixes as part of this documentation checkpoint.
