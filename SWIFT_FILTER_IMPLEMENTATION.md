# Party Map Filter Implementation in Swift

## Files Created/Modified

### NEW FILES
- **PartyMapFilter.swift** - Enum defining all 6 party discovery filters with icons and descriptions

### MODIFIED FILES
- **MapView.swift** - Complete integration of party discovery filters

## Features Implemented

### 1. Party Filter Enum (PartyMapFilter)
```swift
enum PartyMapFilter: String, CaseIterable {
    case all = "All Parties"
    case freeOnly = "Free Parties"
    case paidOnly = "Paid Parties"
    case within2Weeks = "Within 2 Weeks"
    case nearMe = "Near Me"
    case myAge = "My Age"
}
```

Each filter has:
- `systemImage` - SF Symbol for UI
- `description` - User-friendly explanation

### 2. MapView State Management
Added new `@State` variables:
```swift
@State private var activePartyFilters: Set<PartyMapFilter> = [.all]
@State private var showPartyFilterSheet = false
@State private var userAge: Int? = nil
@State private var userLocation: CLLocationCoordinate2D? = nil
```

### 3. Filter Logic in `filteredParties`
Intelligent filtering that:
- Supports free/paid parties (based on Party.fee field)
- Age filtering (matches user age against minAge/maxAge)
- Distance filtering (5km radius from current location)
- Maintains existing invited/friends filters

### 4. UI Implementation
**Two-button toolbar:**
- Star icon → Opens party discovery filters (new)
- Filter icon → Opens attendee filters (existing)

**Party Filter Sheet:**
- Bottom sheet (medium detent)
- List of 6 filter options
- Toggle-style selection (multiple filters supported)
- Visual feedback (checkmarks, highlight color)
- Count display for each filter
- "Done" button to close

### 5. Filter Behavior
- Click "All Parties" → Clears all other filters
- Click other filters → Adds to active set (AND logic)
- Filter state persists while on map
- Changes trigger automatic map re-clustering

## Technical Details

### Distance Calculation
Uses built-in CLLocation distance method:
```swift
let distance = CLLocation(latitude: location.latitude, longitude: location.longitude)
    .distance(from: CLLocation(latitude: party.latitude, longitude: party.longitude))
return distance <= 5000 // 5km in meters
```

### Age Filtering
Handles NULL values gracefully:
```swift
let minMatch = party.minAge == nil || party.minAge! <= age
let maxMatch = party.maxAge == nil || party.maxAge! >= age
return minMatch && maxMatch
```

### Fee Filtering
```swift
if activePartyFilters.contains(.freeOnly) {
    result = result.filter { $0.fee == nil || $0.fee == 0 }
}
if activePartyFilters.contains(.paidOnly) {
    result = result.filter { $0.fee != nil && $0.fee! > 0 }
}
```

## Backend Integration

The filters work with local Party data from SwiftData, but can be easily extended to fetch filtered data directly from the backend API:

```swift
// Example: Could fetch directly from API with filters
let urlString = """
\(Config.backendURL)/api/parties?free=true&user_age=25&user_latitude=\(userLat)&user_longitude=\(userLon)&distance=5
"""
```

## User Flows

### 1. Filter by Price
1. Tap star icon → Shows party filters
2. Tap "Free Parties" or "Paid Parties"
3. Map updates to show only matching parties
4. Tap "Done"

### 2. Filter by Age
1. Tap star icon
2. Tap "My Age"
3. Map filters to parties matching user's age range
4. Tap "Done"

### 3. Filter by Proximity
1. Tap star icon
2. Tap "Near Me"
3. Map shows only parties within 5km of current location
4. Tap "Done"

### 4. Combined Filters
1. Tap star icon
2. Select multiple filters (e.g., "Free Parties" + "Near Me" + "My Age")
3. Map shows parties matching ALL selected filters
4. Tap "Done"

## Testing in Xcode

### Simulator
1. Open PartyHubiOS project in Xcode
2. Select iPhone simulator as target
3. Build & Run (Cmd + R)
4. Navigate to the Map tab
5. Tap the ⭐ icon (new star button)
6. Try selecting different filters
7. Watch map update in real-time

### Live Testing
- The PartyMapFilter sheet uses the same design pattern as PartyAttendeeMapView
- Filters update `filteredParties` which triggers map re-clustering via `onChange` modifiers
- Multiple filters work together with AND logic
- Empty filter results still show the map

## Styling

Uses existing PartyHub design system:
- Primary pink color: `Color("primary pink")`
- System colors for secondary text
- SF Symbols for consistent iconography
- Standard SwiftUI List + NavigationStack patterns

## Future Enhancements

1. **Backend sync** - Fetch filtered data directly from `/api/parties` with filter params
2. **Text search** - Add search box to filter by party name/description
3. **Theme filtering** - Add party theme selection
4. **Saved filters** - Store user's favorite filter combinations
5. **Filter persistence** - Remember last selected filters between app sessions
6. **Search radius** - Make 5km distance user-configurable

## Compatibility

- iOS 16+ (MapKit 2.0)
- SwiftUI 4.0+
- Requires LocationManager for distance filtering

