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

import SwiftUI
struct PartyPin: View {
    let isActive: Bool
    let isHostedByFriend: Bool
    let isInvited: Bool
    
    private var mainFillColor: Color {
        if isHostedByFriend {
            return Color("primary pink")
        }
        return isActive ? .green : .blue
    }
    
    private var invitedRingColor: Color {
        Color("primary yellow")
    }
    
    var body: some View {
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
                    .fill(mainFillColor.opacity(0.2))
                    .frame(width: 52, height: 52)
            }
            
            Circle()
                .fill(mainFillColor)
                .frame(width: 42, height: 42)
                .shadow(color: mainFillColor.opacity(0.5), radius: 8)
            
            Image(systemName: "party.popper.fill")
                .resizable()
                .foregroundStyle(.white)
                .frame(width: 22, height: 22)
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
