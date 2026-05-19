import Foundation
import SwiftUI
import MapKit

// MARK: - Unified Map Badge System

/// Unified badge component for displaying single map pins (parties or attendees)
struct MapBadge: View {
    enum BadgeType {
        case party(isActive: Bool, isHostedByFriend: Bool, isInvited: Bool)
        case attendee(isAtParty: Bool, isSelf: Bool, userId: Int?)
    }

    let type: BadgeType

    var body: some View {
        switch type {
        case .party(let isActive, let isHostedByFriend, let isInvited):
            partyBadge(isActive: isActive, isHostedByFriend: isHostedByFriend, isInvited: isInvited)
        case .attendee(let isAtParty, let isSelf, let userId):
            attendeeBadge(isAtParty: isAtParty, isSelf: isSelf, userId: userId)
        }
    }

    private func partyBadge(isActive: Bool, isHostedByFriend: Bool, isInvited: Bool) -> some View {
        let accessibilitySummary = {
            var parts: [String] = []
            if isInvited { parts.append("Invited") }
            if isHostedByFriend { parts.append("From a friend") }
            if isActive { parts.append("active") }
            return parts.isEmpty ? "Party" : "Party, " + parts.joined(separator: ", ")
        }()

        return Group {
            if isActive {
                activePartyBadge(isHostedByFriend: isHostedByFriend, isInvited: isInvited)
            } else {
                neutralPartyBadge
            }
        }
        .accessibilityLabel(accessibilitySummary)
    }

    private func activePartyBadge(isHostedByFriend: Bool, isInvited: Bool) -> some View {
        let fillColor = isHostedByFriend ? Color("primary pink") : .green
        let invitedRingColor = Color("primary yellow")

        return ZStack {
            if isInvited {
                Circle()
                    .stroke(invitedRingColor, lineWidth: 2)
                    .frame(width: 48, height: 48)
            }

            Circle()
                .fill(fillColor)
                .frame(width: 40, height: 40)
                .shadow(color: Color.black.opacity(0.2), radius: 3, y: 1)

            Image(systemName: "party.popper.fill")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(.white)
        }
    }

    private var neutralPartyBadge: some View {
        ZStack {
            Circle()
                .fill(Color(.systemGray4))
                .frame(width: 40, height: 40)
                .shadow(color: Color.black.opacity(0.2), radius: 3, y: 1)

            Image(systemName: "party.popper.fill")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(.white)
        }
    }

    private func attendeeBadge(isAtParty: Bool, isSelf: Bool, userId: Int?) -> some View {
        let pinColor: Color = isAtParty ? .green : .secondary

        return ZStack {
            Circle()
                .fill(pinColor)
                .frame(width: 40, height: 40)
                .shadow(color: Color.black.opacity(0.2), radius: 3, y: 1)

            if let userId = userId {
                UserProfileImageView(userId: userId, size: 36, showBorder: false)
                    .clipShape(Circle())
            } else {
                Image(systemName: isSelf ? "person.circle.fill" : "person.fill")
                    .font(.system(size: isSelf ? 20 : 16))
                    .foregroundStyle(.white)
            }
        }
    }
}

/// Unified cluster badge component for displaying clustered items
struct MapClusterBadge: View {
    enum ClusterType {
        case parties(count: Int)
        case attendees(count: Int)
    }

    let type: ClusterType
    private let badgePink = Color("primary pink")

    var body: some View {
        switch type {
        case .parties(let count):
            partyClusterBadge(count: count)
        case .attendees(let count):
            attendeeClusterBadge(count: count)
        }
    }

    private func partyClusterBadge(count: Int) -> some View {
        ZStack {
            Circle()
                .fill(Color(.systemGray4))
                .frame(width: 48, height: 48)
                .shadow(color: Color.black.opacity(0.2), radius: 3, y: 1)

            Image(systemName: "party.popper.fill")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(.white)

            VStack {
                HStack {
                    Spacer()
                    countBadge(count: count)
                        .offset(x: 6, y: -6)
                }
                Spacer()
            }
            .frame(width: 48, height: 48)
        }
        .accessibilityLabel("\(count) Partys")
    }

    private func attendeeClusterBadge(count: Int) -> some View {
        ZStack {
            Circle()
                .fill(Color(.systemGray4))
                .frame(width: 48, height: 48)
                .shadow(color: Color.black.opacity(0.2), radius: 3, y: 1)

            Image(systemName: "person.2.fill")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white)
        }
        .overlay(alignment: .topTrailing) {
            countBadge(count: count)
                .offset(x: 6, y: -6)
        }
        .accessibilityLabel("\(count) Participants")
    }

    private func countBadge(count: Int) -> some View {
        Text("\(count)")
            .font(.system(size: 12, weight: .bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
            .background(badgePink)
            .clipShape(Capsule())
            .shadow(color: Color.black.opacity(0.2), radius: 2, y: 1)
    }
}

// MARK: - Deprecated: Old PartyClusterPin (kept for reference)
// This is now replaced by MapClusterBadge(.parties(count:))
struct PartyClusterPin: View {
    let parties: [Party]

    init(parties: [Party], followingUserIds _: Set<Int64>, invitedPartyIds _: Set<Int>) {
        self.parties = parties
    }

    var body: some View {
        MapClusterBadge(type: .parties(count: parties.count))
    }
}
