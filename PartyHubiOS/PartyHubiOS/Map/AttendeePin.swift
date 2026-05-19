import SwiftUI

// MARK: - Attendee Pin
struct AttendeePin: View {
    let isAtParty: Bool
    let isSelf: Bool
    let userId: Int?

    private var pinColor: Color { isAtParty ? .green : .secondary }

    var body: some View {
        ZStack {
            // Äußerer Glow / Ring im Apple-Stil
            Circle()
                .fill(pinColor.opacity(0.15))
                .frame(width: 54, height: 54)
            
            // Haupt-Pin
            Circle()
                .fill(pinColor)
                .frame(width: 44, height: 44)
                .shadow(color: Color.black.opacity(0.15), radius: 4, y: 2)

            // Inhalt
            if let userId = userId {
                UserProfileImageView(userId: userId, size: 38, showBorder: false)
                    .clipShape(Circle())
            } else {
                Image(systemName: isSelf ? "person.circle.fill" : "person.fill")
                    .font(.system(size: isSelf ? 24 : 18))
                    .foregroundStyle(.white)
            }
        }
    }
}

// MARK: - Party Pin
struct PartyPin: View {
    let isActive: Bool
    let isHostedByFriend: Bool
    let isInvited: Bool

    private var accessibilitySummary: String {
        var parts: [String] = []
        if isInvited { parts.append("Invited") }
        if isHostedByFriend { parts.append("From a friend") }
        if isActive { parts.append("active") }
        return parts.isEmpty ? "Party" : "Party, " + parts.joined(separator: ", ")
    }

    private var activePartyFillColor: Color {
        isHostedByFriend ? Color("primary pink") : .green
    }

    private var invitedRingColor: Color {
        Color("primary yellow")
    }

    var body: some View {
        Group {
            if isActive {
                activePartyPin
            } else {
                neutralPartyPin
            }
        }
        .accessibilityLabel(accessibilitySummary)
    }

    private var activePartyPin: some View {
        ZStack {
            if isInvited {
                Circle()
                    .stroke(invitedRingColor, lineWidth: 3)
                    .background(Circle().fill(invitedRingColor.opacity(0.12)))
                    .frame(width: 54, height: 54)
            } else {
                Circle()
                    .fill(activePartyFillColor.opacity(0.15))
                    .frame(width: 50, height: 50)
            }

            Circle()
                .fill(activePartyFillColor)
                .frame(width: 40, height: 40)
                .shadow(color: Color.black.opacity(0.15), radius: 4, y: 2)

            Image(systemName: "party.popper.fill")
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(.white)
        }
    }

    private var neutralPartyPin: some View {
        ZStack {
            // Apple nutzt für inaktive/neutrale Orte oft System-Grautöne mit feinem Kontrast
            Circle()
                .fill(Color(.systemGray6))
                .frame(width: 48, height: 48)
                .shadow(color: Color.black.opacity(0.1), radius: 3, y: 1)

            Circle()
                .fill(Color(.systemGray2))
                .frame(width: 38, height: 38)

            Image(systemName: "party.popper.fill")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(.white)
        }
    }
}

extension PartyPin {
    init(isActive: Bool) {
        self.isActive = isActive
        self.isHostedByFriend = false
        self.isInvited = false
    }
}

// MARK: - Attendee Cluster Pin
struct AttendeeClusterPin: View {
    let count: Int

    private var badgePink: Color {
        Color("primary pink")
    }

    var body: some View {
        ZStack {
            // Basis-Kreis (Analog zu Apples System-Cluster-Visualisierung)
            Circle()
                .fill(Color(.systemGray6))
                .frame(width: 48, height: 48)
                .shadow(color: Color.black.opacity(0.12), radius: 4, y: 2)

            Circle()
                .fill(Color(.systemGray))
                .frame(width: 38, height: 38)

            Image(systemName: "person.2.fill")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white)
        }
        // Native Apple-Methode für Badges: .overlay mit Alignment
        .overlay(alignment: .topTrailing) {
            Text("\(count)")
                .font(.footnote) // Dynamic Type konform
                .bold()
                .foregroundStyle(.white)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(badgePink)
                .clipShape(Capsule())
                .shadow(color: Color.black.opacity(0.15), radius: 2, y: 1)
                // Schiebt das Badge elegant leicht nach rechts oben über den Rand
                .offset(x: 8, y: -6)
        }
        .accessibilityLabel("\(count) Participants")
    }
}
