## 1. Radius State

- [x] 1.1 Add a `@State` search radius value to `MapView`.
- [x] 1.2 Synchronize radius state with existing `PartyMapFilterState.distanceFilter`.
- [x] 1.3 Ensure unavailable user location disables or resets finite distance selection consistently.

## 2. Map Overlay

- [x] 2.1 Add a `MapCircle` centered on current user location for finite radius values.
- [x] 2.2 Style the circle with visible stroke and subtle fill without obscuring party annotations.
- [x] 2.3 Verify circle radius updates immediately when slider state changes.
- [x] 2.4 Adjust map camera to keep the finite radius circle visible.

## 3. Vertical Slider UI

- [x] 3.1 Move or extract the distance slider from the filter sheet into an in-map trailing overlay.
- [x] 3.2 Rotate the SwiftUI `Slider` vertically using `.rotationEffect`.
- [x] 3.3 Add radius label and disabled styling for unavailable current location.
- [x] 3.4 Keep the slider aligned on the right side of the map from top to bottom.

## 4. Verification

- [x] 4.1 Verify finite radius selections filter visible parties by distance.
- [x] 4.2 Verify unlimited or unavailable-location states do not render a misleading circle.
- [x] 4.3 Run the relevant iOS build or local SwiftUI verification if available.
