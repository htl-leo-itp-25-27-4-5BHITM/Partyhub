## 1. Data and filter model

- [x] 1.1 Add a persisted displayable theme or category label to the iOS `Party` model in addition to existing filterable metadata
- [x] 1.2 Populate the new theme/category label during party sync from the most appropriate backend payload field
- [x] 1.3 Introduce a dedicated regular-map filter state model and helper enums or value types for time, theme, distance, age, free, and search criteria

## 2. Party map filtering logic

- [x] 2.1 Diagnose why the existing `MapView` filters do not reliably update the visible party result set
- [x] 2.2 Refactor `MapView` to evaluate parties through the new combined filter state instead of scattered booleans
- [x] 2.3 Implement within-two-weeks, distance, age-range, free-only, and text-search predicates with explicit missing-data behavior
- [x] 2.4 Implement theme filtering and theme-aware search using the persisted displayable theme/category label
- [x] 2.5 Recompute displayed annotations and clusters from the filtered party set whenever filter state changes

## 3. Filter UI alignment

- [x] 3.1 Replace the current regular-map filter sheet layout with an attendee-map-inspired sheet flow and active-state affordance
- [x] 3.2 Add a compact active-filter summary overlay for the regular map that reflects the current filtered result set
- [x] 3.3 Add clear default and reset behavior so users can return to the unfiltered regular map in one action
- [x] 3.4 Disable or clearly mark distance filtering as unavailable when no current user location is present

## 4. Verification

- [ ] 4.1 Verify that each already-supported regular map filter now changes the visible party set correctly
- [ ] 4.2 Verify the regular map filter combinations against representative party data, including missing fee, missing age, and missing theme cases
- [ ] 4.3 Verify theme options, summary state, and map clustering update correctly after sync and filter changes
- [ ] 4.4 Run the relevant iOS build or test workflow used for `PartyHubiOS` and fix any regressions introduced by the filter refactor
