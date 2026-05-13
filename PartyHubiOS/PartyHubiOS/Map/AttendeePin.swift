import SwiftUI

struct AttendeePin: View {
    let isAtParty: Bool
    let isSelf: Bool
    let userId: Int?

    private var color: Color { isAtParty ? .green : .gray }

    var body: some View {
        ZStack {
            Circle()
                .fill(color.opacity(0.25))
                .frame(width: 56, height: 56)
            Circle()
                .fill(color)
                .frame(width: 46, height: 46)
                .shadow(color: color.opacity(0.5), radius: 8)

            if let userId = userId {
                UserProfileImageView(userId: userId, size: 40, showBorder: false)
            } else {
                Image(systemName: isSelf ? "person.circle.fill" : "person.fill")
                    .resizable()
                    .foregroundStyle(.white)
                    .frame(width: isSelf ? 36 : 26, height: isSelf ? 36 : 26)
            }
        }
    }
}

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

    /// Nur für die aktuelle Party: klassisches farbiges Pin-Design (unverändert zur früheren Logik).
    private var activePartyFillColor: Color {
        if isHostedByFriend {
            return Color("primary pink")
        }
        return .green
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
                    .fill(invitedRingColor.opacity(0.15))
                    .frame(width: 56, height: 56)
                    .overlay(
                        Circle()
                            .stroke(invitedRingColor, lineWidth: 3)
                            .frame(width: 54, height: 54)
                    )
            } else {
                Circle()
                    .fill(activePartyFillColor.opacity(0.2))
                    .frame(width: 52, height: 52)
            }

            Circle()
                .fill(activePartyFillColor)
                .frame(width: 42, height: 42)
                .shadow(color: activePartyFillColor.opacity(0.5), radius: 8)

            Image(systemName: "party.popper.fill")
                .resizable()
                .foregroundStyle(.white)
                .frame(width: 22, height: 22)
        }
    }

    private var neutralPartyPin: some View {
        ZStack {
            Circle()
                .fill(Color(uiColor: .systemGray5))
                .frame(width: 64, height: 64)

            Circle()
                .fill(Color(uiColor: .systemGray))
                .frame(width: 50, height: 50)
                .shadow(color: Color.black.opacity(0.22), radius: 6, y: 2)

            Image(systemName: "party.popper.fill")
                .font(.system(size: 20, weight: .semibold))
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

// MARK: - Attendee Cluster Pin (Teilnehmer-Karte)

struct AttendeeClusterPin: View {
    let count: Int

    private var badgePink: Color {
        Color("primary pink")
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(Color(uiColor: .systemGray5))
                .frame(width: 64, height: 64)

            Circle()
                .fill(Color(uiColor: .systemGray))
                .frame(width: 50, height: 50)
                .shadow(color: Color.black.opacity(0.22), radius: 6, y: 2)

            Image(systemName: "person.2.fill")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.white)

            VStack {
                HStack {
                    Spacer()

                    Text("\(count)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(minWidth: 22)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(badgePink)
                        .clipShape(Capsule())
                        .offset(x: 8, y: -8)
                }

                Spacer()
            }
            .frame(width: 50, height: 50)
        }
        .accessibilityLabel("\(count) Participants")
    }
}
