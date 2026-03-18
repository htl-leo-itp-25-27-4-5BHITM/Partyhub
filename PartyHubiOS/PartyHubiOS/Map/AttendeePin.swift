import SwiftUI

struct AttendeePin: View {
    let isAtParty: Bool
    let isSelf: Bool

    private var color: Color { isAtParty ? .green : .gray }
    private var icon: String { isSelf ? "person.circle.fill" : "person.fill" }
    private var iconSize: CGFloat { isSelf ? 36 : 26 }

    var body: some View {
        ZStack {
            Circle()
                .fill(color.opacity(0.25))
                .frame(width: 56, height: 56)
            Circle()
                .fill(color)
                .frame(width: 46, height: 46)
                .shadow(color: color.opacity(0.5), radius: 8)
            Image(systemName: icon)
                .resizable()
                .foregroundStyle(.white)
                .frame(width: iconSize, height: iconSize)
        }
    }
}

import SwiftUI
struct PartyPin: View {
    let isActive: Bool

    var body: some View {
        ZStack {
            Circle()
                .fill(isActive ? Color.green.opacity(0.2) : Color.blue.opacity(0.2))
                .frame(width: 52, height: 52)
            Circle()
                .fill(isActive ? Color.green : Color.blue)
                .frame(width: 42, height: 42)
                .shadow(color: (isActive ? Color.green : Color.blue).opacity(0.5), radius: 8)
            Image(systemName: "party.popper.fill")
                .resizable()
                .foregroundStyle(.white)
                .frame(width: 22, height: 22)
        }
    }
}
