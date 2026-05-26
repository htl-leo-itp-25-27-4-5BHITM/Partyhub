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

enum PartyMapDistanceFilter: CaseIterable {
    case fiveKilometers
    case tenKilometers
    case twentyFiveKilometers
    case fiftyKilometers
    case oneHundredKilometers
    case twoHundredFiftyKilometers
    case fiveHundredKilometers
    case oneThousandKilometers
    case unlimited

    var systemImage: String {
        "location.fill"
    }

    var displayLabel: String {
        switch self {
        case .fiveKilometers: return "5 km"
        case .tenKilometers: return "10 km"
        case .twentyFiveKilometers: return "25 km"
        case .fiftyKilometers: return "50 km"
        case .oneHundredKilometers: return "100 km"
        case .twoHundredFiftyKilometers: return "250 km"
        case .fiveHundredKilometers: return "500 km"
        case .oneThousandKilometers: return "1000 km"
        case .unlimited: return "∞"
        }
    }

    var distanceInMeters: Double? {
        switch self {
        case .fiveKilometers: return 5_000
        case .tenKilometers: return 10_000
        case .twentyFiveKilometers: return 25_000
        case .fiftyKilometers: return 50_000
        case .oneHundredKilometers: return 100_000
        case .twoHundredFiftyKilometers: return 250_000
        case .fiveHundredKilometers: return 500_000
        case .oneThousandKilometers: return 1_000_000
        case .unlimited: return nil
        }
    }

    var summaryLabel: String? {
        switch self {
        case .unlimited: return nil
        default: return displayLabel
        }
    }

    var sliderIndex: Double {
        Double(Self.allCases.firstIndex(of: self) ?? 0)
    }

    static func filter(for sliderValue: Double) -> PartyMapDistanceFilter {
        let rawIndex = Int(sliderValue.rounded())
        let clampedIndex = min(max(rawIndex, 0), allCases.count - 1)
        return allCases[clampedIndex]
    }
}

struct PartyMapFilterState {
    var timeFilter: PartyMapTimeFilter = .anytime
    var selectedThemes: Set<String> = []
    var distanceFilter: PartyMapDistanceFilter = .unlimited
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
        distanceFilter != .unlimited ||
        minimumAge != nil ||
        maximumAge != nil ||
        feeFilter != .all ||
        !trimmedSearchText.isEmpty
    }

    mutating func reset() {
        self = PartyMapFilterState()
    }
}
