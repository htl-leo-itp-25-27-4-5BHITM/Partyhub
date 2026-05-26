import Foundation

enum PartyMapTimeFilter: String, CaseIterable {
    case anytime = "Any Time"
    case withinTwoWeeks = "Within 2 Weeks"

    var systemImage: String {
        switch self {
        case .anytime: return "calendar"
        case .withinTwoWeeks: return "calendar.badge.clock"
        }
    }
}

enum PartyMapFeeFilter: String, CaseIterable {
    case all = "All"
    case freeOnly = "Free"
    case paidOnly = "Paid"

    var systemImage: String {
        switch self {
        case .all: return "banknote"
        case .freeOnly: return "banknote.fill"
        case .paidOnly: return "creditcard.fill"
        }
    }

    var summaryLabel: String? {
        switch self {
        case .all: return nil
        case .freeOnly: return "free"
        case .paidOnly: return "paid"
        }
    }
}

enum PartyMapDistanceFilter: String, CaseIterable {
    case anyDistance = "Any Distance"
    case fiveKilometers = "Within 5 km"
    case twentyKilometers = "Within 20 km"
    case fiftyKilometers = "Within 50 km"

    var systemImage: String {
        "location.fill"
    }

    var distanceInMeters: Double? {
        switch self {
        case .anyDistance: return nil
        case .fiveKilometers: return 5_000
        case .twentyKilometers: return 20_000
        case .fiftyKilometers: return 50_000
        }
    }

    var summaryLabel: String? {
        switch self {
        case .anyDistance: return nil
        case .fiveKilometers: return "5 km"
        case .twentyKilometers: return "20 km"
        case .fiftyKilometers: return "50 km"
        }
    }
}

struct PartyMapFilterState {
    var timeFilter: PartyMapTimeFilter = .anytime
    var selectedThemes: Set<String> = []
    var distanceFilter: PartyMapDistanceFilter = .anyDistance
    var minimumAge: Int? = nil
    var maximumAge: Int? = nil
    var feeFilter: PartyMapFeeFilter = .all
    var searchText: String = ""

    var trimmedSearchText: String {
        searchText.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var isActive: Bool {
        timeFilter != .anytime ||
        !selectedThemes.isEmpty ||
        distanceFilter != .anyDistance ||
        minimumAge != nil ||
        maximumAge != nil ||
        feeFilter != .all ||
        !trimmedSearchText.isEmpty
    }

    mutating func reset() {
        self = PartyMapFilterState()
    }
}
