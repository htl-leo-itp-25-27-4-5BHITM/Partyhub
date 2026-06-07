import Foundation

struct ReceivedInvitation: Decodable, Identifiable {
    let id: Int
    let senderId: Int?
    let sender: InvitationSender?
    let partyId: Int?
    let party: InvitationParty?
    let status: String

    enum CodingKeys: String, CodingKey {
        case id, sender, party, status
        case senderId = "sender_id"
        case partyId = "party_id"
    }
}

struct InvitationSender: Decodable {
    let id: Int
    let displayName: String?
    let username: String?
}

struct InvitationParty: Decodable {
    let id: Int
    let title: String
}

@Observable
@MainActor
final class InvitationsViewModel {
    var invitations: [ReceivedInvitation] = []
    var isLoading = false
    var error: String?
    var actionInProgress: Set<Int> = []

    func fetch() async {
        isLoading = true
        error = nil

        do {
            let result: [ReceivedInvitation] = try await APIClient.shared.request(
                method: .GET,
                path: "/api/invitations",
                queryItems: [URLQueryItem(name: "direction", value: "received")],
                authType: .bearerToken
            )
            invitations = result
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func accept(_ invitation: ReceivedInvitation) async {
        guard let partyId = invitation.partyId else { return }
        actionInProgress.insert(invitation.id)

        do {
            let _: EmptyResponse = try await APIClient.shared.request(
                method: .POST,
                path: "/api/parties/\(partyId)/join",
                authType: .bearerToken
            )
            await fetch()
        } catch {
            self.error = "Failed to accept: \(error.localizedDescription)"
        }

        actionInProgress.remove(invitation.id)
    }

    func decline(_ invitation: ReceivedInvitation) async {
        guard let partyId = invitation.partyId else { return }
        actionInProgress.insert(invitation.id)

        do {
            let _: EmptyResponse = try await APIClient.shared.request(
                method: .DELETE,
                path: "/api/parties/\(partyId)/join",
                authType: .bearerToken
            )
            await fetch()
        } catch {
            self.error = "Failed to decline: \(error.localizedDescription)"
        }

        actionInProgress.remove(invitation.id)
    }

    var pendingCount: Int {
        invitations.filter { $0.status == "PENDING" }.count
    }
}
