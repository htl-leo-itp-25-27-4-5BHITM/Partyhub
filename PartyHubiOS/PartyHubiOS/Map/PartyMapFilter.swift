enum PartyMapFilter: String, CaseIterable {
    case all = "All Parties"
    case freeOnly = "Free Parties"
    case paidOnly = "Paid Parties"
    case within2Weeks = "Within 2 Weeks"
    case nearMe = "Near Me"
    case myAge = "My Age"

    var systemImage: String {
        switch self {
        case .all: return "map.fill"
        case .freeOnly: return "banknote.fill"
        case .paidOnly: return "creditcard.fill"
        case .within2Weeks: return "calendar"
        case .nearMe: return "location.fill"
        case .myAge: return "person.fill"
        }
    }

    var description: String {
        switch self {
        case .all: return "Show all parties"
        case .freeOnly: return "Free parties only"
        case .paidOnly: return "Paid parties only"
        case .within2Weeks: return "Parties in the next 2 weeks"
        case .nearMe: return "Parties within 5km"
        case .myAge: return "Parties for my age"
        }
    }
}
