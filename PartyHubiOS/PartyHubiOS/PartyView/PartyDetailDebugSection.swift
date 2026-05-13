import SwiftUI
import SwiftData

#if DEBUG
struct PartyDetailDebugSection: View {
    let party: Party
    let currentUserId: Int64?

    let simulateEnterParty: () -> Void
    let simulateLeaveParty: () -> Void
    let simulatePartyUpdate: () -> Void
    let testLocalNotification: () -> Void
    let printDebugInfo: () -> Void
    let becomeOwner: () -> Void
    let isOwner: Bool

    var body: some View {
        Section("Debug Tools") {
            VStack(alignment: .leading, spacing: 12) {

                Text("Joining/leaving a party:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Button {
                    simulateEnterParty()
                } label: {
                    Label("Enter the party (simulate)", systemImage: "arrow.right.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.green)

                Button {
                    simulateLeaveParty()
                } label: {
                    Label("Leave the party (simulate)", systemImage: "arrow.left.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.orange)

                Divider()

                Text("Notifications:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Button {
                    simulatePartyUpdate()
                } label: {
                    Label("Change description (Push)", systemImage: "bell.badge.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.blue)

                Button {
                    testLocalNotification()
                } label: {
                    Label("Test Local Notification", systemImage: "bell.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.purple)

                Divider()

                Text("User-Status:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Button {
                    printDebugInfo()
                } label: {
                    Label("Debug Info (Console)", systemImage: "ladybug.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.gray)

                if !isOwner {
                    Button {
                        becomeOwner()
                    } label: {
                        Label("Log in as Owner", systemImage: "crown.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.yellow)
                }
            }
            .padding(.vertical, 4)
        }
    }
}
#endif
