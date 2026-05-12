enum AttendeeFilter: String, CaseIterable {
    case all = "Alle"
    case atParty = "Auf der Party"
    case invited = "Eingeladen"
    case accepted = "Zugesagt"
    case pending = "Ausstehend"
    case friends = "Freunde"

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
