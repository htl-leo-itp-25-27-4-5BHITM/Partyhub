import SwiftUI

@Observable
@MainActor
final class InviteUsersViewModel {
    var friends: [UserProfile] = []
    var isLoading = false
    var error: String?
    var successMessage: String?

    func loadFriends(userId: Int) async {
        isLoading = true

        do {
            let result: [UserProfile] = try await APIClient.shared.request(
                method: .GET,
                path: "/api/users/\(userId)/following",
                authType: .userIdHeader
            )
            friends = result
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func invite(userId: Int, to partyId: Int) async -> Bool {
        let payload = InvitePayload(partyId: partyId, recipient: userId)

        do {
            let _: EmptyResponse = try await APIClient.shared.request(
                method: .POST,
                path: "/api/invitations",
                body: payload,
                authType: .userIdHeader
            )
            successMessage = "Invitation sent!"
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }
}

private struct InvitePayload: Encodable {
    let partyId: Int
    let recipient: Int

    enum CodingKeys: String, CodingKey {
        case partyId = "party_id"
        case recipient
    }
}

struct InviteUsersView: View {
    let party: Party
    @Environment(\.dismiss) private var dismiss

    @State private var viewModel = InviteUsersViewModel()
    @State private var searchText = ""
    @State private var invitedUserIds: Set<Int> = []

    private var currentUserId: Int {
        AuthManager.shared.userId ?? 0
    }

    private var filteredFriends: [UserProfile] {
        if searchText.isEmpty {
            return viewModel.friends
        }
        return viewModel.friends.filter { user in
            (user.displayName?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            (user.username?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            (user.distinctName?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading friends...")
                } else if viewModel.friends.isEmpty {
                    ContentUnavailableView(
                        "No Friends",
                        systemImage: "person.slash",
                        description: Text("Follow other users to invite them to your party.")
                    )
                } else {
                    List {
                        Section {
                            ForEach(filteredFriends) { user in
                                FriendInviteRow(
                                    user: user,
                                    isInvited: invitedUserIds.contains(user.id),
                                    onInvite: {
                                        await invite(user)
                                    }
                                )
                            }
                        } header: {
                            if !searchText.isEmpty {
                                Text("Found \(filteredFriends.count) friend\(filteredFriends.count == 1 ? "" : "s")")
                            }
                        }
                    }
                }
            }
            .navigationTitle("Invite Friends")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Search friends...")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .alert("Success", isPresented: .init(
                get: { viewModel.successMessage != nil },
                set: { if !$0 { viewModel.successMessage = nil } }
            )) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(viewModel.successMessage ?? "")
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
                await viewModel.loadFriends(userId: currentUserId)
            }
        }
    }

    private func invite(_ user: UserProfile) async {
        let success = await viewModel.invite(userId: user.id, to: party.backendId)
        if success {
            invitedUserIds.insert(user.id)
        }
    }
}

private struct FriendInviteRow: View {
    let user: UserProfile
    let isInvited: Bool
    let onInvite: () async -> Void

    var body: some View {
        HStack(spacing: 12) {
            UserProfileImageView(userId: user.id, size: 44, showBorder: false)

            VStack(alignment: .leading, spacing: 2) {
                Text(user.displayName ?? user.username ?? "Unknown")
                    .font(.headline)
                if let name = user.distinctName {
                    Text("@\(name)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if isInvited {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("Invited")
                        .font(.caption)
                        .foregroundStyle(.green)
                }
            } else {
                Button("Invite") {
                    Task { await onInvite() }
                }
                .buttonStyle(.bordered)
                .font(.caption)
                .tint(Color("primary pink"))
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    InviteUsersView(party: Party(backendId: 1, name: "Test", location: "Test", latitude: 48.2, longitude: 16.3))
}
