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
        Section("🔧 Debug Tools") {
            VStack(alignment: .leading, spacing: 12) {

                Text("Party betreten/verlassen:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Button {
                    simulateEnterParty()
                } label: {
                    Label("Party betreten (simulieren)", systemImage: "arrow.right.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.green)

                Button {
                    simulateLeaveParty()
                } label: {
                    Label("Party verlassen (simulieren)", systemImage: "arrow.left.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.orange)

                Divider()

                Text("Benachrichtigungen:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Button {
                    simulatePartyUpdate()
                } label: {
                    Label("Beschreibung ändern (Push)", systemImage: "bell.badge.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.blue)

                Button {
                    testLocalNotification()
                } label: {
                    Label("Test Lokale Notification", systemImage: "bell.fill")
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
                    Label("Debug Info (Konsole)", systemImage: "ladybug.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.gray)

                if !isOwner {
                    Button {
                        becomeOwner()
                    } label: {
                        Label("Als Owner einloggen", systemImage: "crown.fill")
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
