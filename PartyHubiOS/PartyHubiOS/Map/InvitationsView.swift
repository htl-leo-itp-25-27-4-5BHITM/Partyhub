import SwiftUI

struct InvitationsView: View {
    @State private var viewModel = InvitationsViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.invitations.isEmpty {
                    ProgressView("Loading invitations...")
                } else if viewModel.invitations.isEmpty {
                    emptyState
                } else {
                    List {
                        Section {
                            ForEach(viewModel.invitations) { invitation in
                                InvitationRow(
                                    invitation: invitation,
                                    isActioning: viewModel.actionInProgress.contains(invitation.id),
                                    onAccept: { Task { await viewModel.accept(invitation) } },
                                    onDecline: { Task { await viewModel.decline(invitation) } }
                                )
                            }
                        } header: {
                            let pending = viewModel.pendingCount
                            if pending > 0 {
                                Text("\(pending) pending invitation\(pending == 1 ? "" : "s")")
                            }
                        }
                    }
                }
            }
            .navigationTitle("Invitations")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await viewModel.fetch()
            }
            .alert("Error", isPresented: .init(
                get: { viewModel.error != nil },
                set: { if !$0 { viewModel.error = nil } }
            )) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(viewModel.error ?? "")
            }
            .task {
                await viewModel.fetch()
            }
        }
    }

    private var emptyState: some View {
        ContentUnavailableView(
            "No Invitations",
            systemImage: "envelope.open",
            description: Text("You haven't received any invitations yet.")
        )
    }
}

private struct InvitationRow: View {
    let invitation: ReceivedInvitation
    let isActioning: Bool
    let onAccept: () -> Void
    let onDecline: () -> Void

    private var senderName: String {
        invitation.sender?.displayName ?? invitation.sender?.username ?? "User #\(invitation.senderId ?? 0)"
    }

    private var partyTitle: String {
        invitation.party?.title ?? "Party #\(invitation.partyId ?? 0)"
    }

    private var statusColor: Color {
        switch invitation.status {
        case "PENDING": return .orange
        case "ACCEPTED": return .green
        case "DECLINED": return .red
        default: return .gray
        }
    }

    private var statusIcon: String {
        switch invitation.status {
        case "PENDING": return "clock.fill"
        case "ACCEPTED": return "checkmark.circle.fill"
        case "DECLINED": return "xmark.circle.fill"
        default: return "questionmark"
        }
    }

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(partyTitle)
                    .font(.headline)

                HStack(spacing: 4) {
                    Image(systemName: "person.fill")
                        .font(.caption2)
                    Text("from \(senderName)")
                        .font(.caption)
                }
                .foregroundStyle(.secondary)

                HStack(spacing: 4) {
                    Image(systemName: statusIcon)
                        .font(.caption2)
                    Text(invitation.status.capitalized)
                        .font(.caption)
                }
                .foregroundStyle(statusColor)
            }

            Spacer()

            if invitation.status == "PENDING" {
                if isActioning {
                    ProgressView()
                        .scaleEffect(0.8)
                } else {
                    HStack(spacing: 8) {
                        Button(action: onDecline) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.title2)
                                .foregroundStyle(.red)
                        }
                        .buttonStyle(.plain)

                        Button(action: onAccept) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.title2)
                                .foregroundStyle(.green)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    InvitationsView()
}
