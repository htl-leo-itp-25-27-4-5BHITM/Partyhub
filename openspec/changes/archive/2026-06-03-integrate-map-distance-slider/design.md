## Context

`MapView.swift` currently supports distance filtering through a horizontal `Slider` inside the filter sheet. The map itself shows party annotations and clusters but does not expose the selected search radius visually. The requested change brings distance adjustment into the map surface and links the same radius value to both filtering and a visible `MapCircle` overlay.

## Goals / Non-Goals

**Goals:**
- Place a vertical distance slider directly on the right side of the SwiftUI map.
- Bind the control to `@State`-managed search radius state so map UI updates immediately.
- Render a `MapCircle` centered on the current user location and sized from the selected radius.
- Keep the implementation local to the iOS map UI unless existing filter-state synchronization requires a small model helper.

**Non-Goals:**
- Redesign all map filters or remove the existing filter sheet.
- Change backend party discovery APIs or persisted party data.
- Add new map clustering behavior beyond reacting to the existing filtered result set.

## Decisions

- Use an in-map overlay for the slider instead of a toolbar item.
  - Rationale: the control needs to be spatially connected to the map and remain visible while the user pans or reviews party markers.
  - Alternative considered: keeping distance only in the filter sheet; rejected because it does not satisfy immediate in-map adjustment.
- Use a standard SwiftUI `Slider` rotated with `.rotationEffect` for vertical orientation.
  - Rationale: this follows the requested SwiftUI modifier approach and avoids introducing a custom control.
  - Alternative considered: building a custom vertical slider; rejected as unnecessary complexity.
- Keep radius state in `MapView` and synchronize it with existing `PartyMapFilterState.distanceFilter`.
  - Rationale: `@State` makes the slider binding explicit while preserving existing filter behavior and summary state.
  - Alternative considered: binding the slider directly to the existing enum index only; rejected because the requested overlay needs a radius-oriented state value.
- Use `MapCircle` map content for the radius overlay.
  - Rationale: `MapCircle` is native to SwiftUI MapKit and updates declaratively when the bound radius changes.
  - Alternative considered: drawing a screen-space circle overlay; rejected because map projection and zoom would make geographic radius inaccurate.

## Risks / Trade-offs

- Rotated slider layout can be awkward to size → Constrain it with a fixed frame before rotation and place it in a trailing overlay with padding.
- Unlimited distance has no finite circle radius → Hide the circle for unlimited selection or map it only to finite radius options while keeping the UI label clear.
- User location may be unavailable → Disable or de-emphasize the in-map distance control and skip the `MapCircle` until a current location exists.
- Existing filter sheet may duplicate distance controls → Either keep it synchronized with the map slider or remove only the sheet distance slider if the implementation goal is full extraction.

## Migration Plan

No data migration is required. Implement and verify the iOS map UI locally, then rollback by removing the in-map slider overlay, `MapCircle`, and radius state synchronization if needed.
