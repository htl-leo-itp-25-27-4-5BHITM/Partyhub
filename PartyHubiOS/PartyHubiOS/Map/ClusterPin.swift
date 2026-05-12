import Foundation
import SwiftUI
import MapKit

// MARK: - Party Cluster Pin
struct PartyClusterPin: View {
    let parties: [Party]
    let isHostedByFriend: Bool
    let hasInvited: Bool
    
    init(parties: [Party], followingUserIds: Set<Int64>, invitedPartyIds: Set<Int>) {
        self.parties = parties
        self.isHostedByFriend = parties.contains { party in
            guard let hostId = party.hostUserId else { return false }
            return followingUserIds.contains(hostId)
        }
        self.hasInvited = parties.contains { party in
            invitedPartyIds.contains(party.backendId)
        }
    }
    
    private var mainFillColor: Color {
        if isHostedByFriend {
            return Color("primary pink")
        }
        let hasActive = parties.contains { $0.isActive }
        return hasActive ? .green : .blue
    }
    
    private var invitedRingColor: Color {
        Color("primary yellow")
    }
    
    private var count: Int {
        parties.count
    }
    
    var body: some View {
        ZStack {
            if hasInvited {
                Circle()
                    .fill(invitedRingColor.opacity(0.15))
                    .frame(width: 64, height: 64)
                    .overlay(
                        Circle()
                            .stroke(invitedRingColor, lineWidth: 3)
                            .frame(width: 62, height: 62)
                    )
            } else {
                Circle()
                    .fill(mainFillColor.opacity(0.2))
                    .frame(width: 60, height: 60)
            }
            
            Circle()
                .fill(mainFillColor)
                .frame(width: 50, height: 50)
                .shadow(color: mainFillColor.opacity(0.5), radius: 8)
            
            Text("\(count)")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(.white)
        }
    }
}

// MARK: - Attendee Cluster Pin
struct AttendeeClusterPin: View {
    let count: Int
    
    private var badgeColor: Color {
        Color("primary pink")
    }
    
    var body: some View {
        ZStack {
            // Hintergrund des Pins: Jetzt in Grau
            Circle()
                .fill(Color.gray)
                .frame(width: 50, height: 50)
                .shadow(color: .black.opacity(0.2), radius: 4)
            
            // Das Icon: Jetzt in Weiß (umgekehrt)
            Image(systemName: "person.2.fill")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.white)

            // Das Badge: Bleibt Pink mit weißer Zahl
            VStack {
                HStack {
                    Spacer()
                    Text("\(count)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(badgeColor)
                        .clipShape(Capsule())
                        .overlay(
                            Capsule()
                                .stroke(.white, lineWidth: 1)
                        )
                        .offset(x: 8, y: -8)
                }
                Spacer()
            }
            .frame(width: 50, height: 50)
        }
    }
}
