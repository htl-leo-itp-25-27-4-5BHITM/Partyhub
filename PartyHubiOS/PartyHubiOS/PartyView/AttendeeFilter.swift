enum AttendeeFilter: String, CaseIterable {
    case all = "All"
    case atParty = "At the Party"
    case invited = "Invited"
    case accepted = "Confirmed"
    case pending = "Pending"
    case friends = "Friends"

    var systemImage: String {
        switch self {
        case .all: return "person.3.fill"
        case .atParty: return "location.fill"
        case .invited: return "envelope.fill"
        case .accepted: return "checkmark.circle.fill"
        case .pending: return "clock.fill"
        case .friends: return "heart.fill"
        }
    }
}
