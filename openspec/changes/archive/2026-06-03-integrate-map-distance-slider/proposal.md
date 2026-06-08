## Why

The map currently hides distance selection inside the filter sheet, making radius adjustment indirect while users are visually exploring nearby parties. Moving the distance control into the map interface lets users tune search radius in context and immediately understand the visible search area.

## What Changes

- Add an in-map vertical distance slider aligned on the right side of `MapView`.
- Bind the slider to a `@State`-managed search radius value used by map filtering and display.
- Render a `MapCircle` overlay centered on the current user location.
- Update the overlay radius dynamically as the slider value changes.
- Keep the slider visually vertical using SwiftUI modifiers such as `.rotationEffect`.
- Preserve existing map annotations, clustering, and filter-sheet behavior unrelated to distance.

## Capabilities

### New Capabilities
- `map-radius-control`: Covers in-map distance radius adjustment and visual radius feedback on the SwiftUI map.

### Modified Capabilities
- `party-discovery-and-management`: Distance-based party discovery gains direct map interaction and visual radius feedback.

## Impact

- Affects `PartyHubiOS/PartyHubiOS/Map/MapView.swift`.
- May affect `PartyMapFilter` distance state if the radius binding needs to synchronize with the existing filter model.
- No backend API, database, authentication, or Keycloak theme changes are expected.
