## Why

The regular party map currently offers only a limited set of filters, and the already-implemented filter behavior is not working reliably. Fixing the existing filter flow while expanding it to match the richer, easier-to-scan attendee-map experience improves party discovery consistency, restores trust in the filter UI, and helps users narrow crowded map results faster.

## What Changes

- Add a dedicated filter model for the regular party map that supports:
- within-two-weeks filtering
- party-theme filtering
- distance filtering
- minimum-age and maximum-age filtering
- free-parties filtering
- text search across party fields
- Fix the already-implemented regular map filters so active selections reliably change the visible party result set.
- Update the regular party map filter sheet to follow the attendee map interaction style, including compact active-filter feedback and a clearer selection flow.
- Rework party filtering logic so multiple filters can be combined predictably and reflected in the visible map annotations and counts.
- Preserve existing party visibility rules and discovery scope while changing only the client-side filter experience for already-visible parties.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `party-discovery-and-management`: define reliable and richer client-side filtering for the home party map, including fixing current filter behavior and supporting time, theme, distance, age, free/paid, and text-based narrowing of already-visible parties

## Impact

- Affected code: `PartyHubiOS/PartyHubiOS/Map/MapView.swift` and supporting iOS map/filter UI types extracted as part of the change
- Affected behavior: party discovery UI on the regular map for authenticated and anonymous users
- No backend API contract changes expected if theme, fee, age, and searchable party fields are already present in loaded party data
