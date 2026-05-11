import SwiftUI
import MapKit
import SwiftData

extension CLLocationCoordinate2D: @retroactive Equatable {
    public static func == (lhs: CLLocationCoordinate2D, rhs: CLLocationCoordinate2D) -> Bool {
        lhs.latitude == rhs.latitude && lhs.longitude == rhs.longitude
    }
}

enum MapFilter: String, CaseIterable {
    case all = "Alle"
    case invited = "Eingeladen"
    case friends = "Freunde"
}

private struct InvitationResponse: Decodable {
    let partyId: Int?

    enum CodingKeys: String, CodingKey {
        case partyId = "party_id"
    }
}

private struct FollowUserResponse: Decodable {
    let id: Int
}

struct MapView: View {
    var locationManager: LocationManager

    @State private var position: MapCameraPosition = .userLocation(fallback: .automatic)
    @State private var selectedFilter: MapFilter = .all
    @State private var invitedPartyIds: Set<Int> = []
    @State private var followingUserIds: Set<Int64> = []
    @State private var showFilterDialog = false

    @Query var parties: [Party]
    private let highlightedPartyId: Int?
    
    private let impactGenerator = UIImpactFeedbackGenerator(style: .medium)

    private var currentUserId: Int? {
        if let userId = AuthManager.shared.userId {
            return userId
        }
        let storedId = UserDefaults.standard.integer(forKey: "partyhub_user_id")
        return storedId > 0 ? storedId : nil
    }
    
    private var isFilterActive: Bool {
        selectedFilter != .all
    }

    private var filteredParties: [Party] {
        parties.filter { party in
            switch selectedFilter {
            case .all:
                return true
            case .invited:
                return invitedPartyIds.contains(party.backendId)
            case .friends:
                guard let hostId = party.hostUserId else { return false }
                return followingUserIds.contains(hostId)
            }
        }
    }

    init(locationManager: LocationManager, highlightedPartyId: Int? = nil) {
        self.locationManager = locationManager
        self.highlightedPartyId = highlightedPartyId
    }

    var displayedParty: Party? {
        if let highlightedPartyId {
            return parties.first(where: { $0.backendId == highlightedPartyId })
        }
        return parties.first(where: { $0.isActive }) ?? parties.first
    }

    var body: some View {
        Map(position: $position) {
            if let coord = locationManager.currentLocation {
                Annotation("Du", coordinate: coord) {
                    AttendeePin(isAtParty: locationManager.isAtParty, isSelf: true, userId: currentUserId)
                }
            }

            ForEach(filteredParties) { party in
                let isHostedByFriend: Bool = {
                    guard let hostId = party.hostUserId else { return false }
                    return followingUserIds.contains(hostId)
                }()
                
                let isInvited = invitedPartyIds.contains(party.backendId)
                
                Annotation(party.name, coordinate: party.coordinate) {
                    PartyPin(
                        isActive: party.isActive,
                        isHostedByFriend: isHostedByFriend,
                        isInvited: isInvited
                    )
                }
            }
        }
        .ignoresSafeArea()
        .onAppear {
            locationManager.requestPermission()
            focusMap(on: displayedParty)
            loadFilterData()
        }
        .onChange(of: displayedParty?.backendId) { _, _ in
            focusMap(on: displayedParty)
        }
        .navigationTitle(displayedParty?.name ?? "Map")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showFilterDialog = true
                } label: {
                    Image(systemName: isFilterActive ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                        .font(.title2)
                        .foregroundStyle(isFilterActive ? Color("primary pink") : .primary)
                }
            }
        }
        .confirmationDialog("Filter", isPresented: $showFilterDialog) {
            Button("Alle") {
                setFilter(.all)
            }
            Button("Eingeladen") {
                setFilter(.invited)
            }
            Button("Freunde") {
                setFilter(.friends)
            }
            Button("Abbrechen", role: .cancel) { }
        } message: {
            Text("Zeige nur Partys aus einer Kategorie")
        }
    }
    
    private func setFilter(_ filter: MapFilter) {
        if selectedFilter != filter {
            impactGenerator.impactOccurred()
            selectedFilter = filter
        }
    }
}

private extension MapView {
    func focusMap(on party: Party?) {
        guard let party else { return }

        position = .region(
            MKCoordinateRegion(
                center: party.coordinate,
                latitudinalMeters: max(party.radiusMeters * 6, 600),
                longitudinalMeters: max(party.radiusMeters * 6, 600)
            )
        )
    }

    func loadFilterData() {
        guard let userId = currentUserId else { return }

        Task {
            await withTaskGroup(of: Void.self) { group in
                group.addTask { await fetchInvitations(userId: userId) }
                group.addTask { await fetchFollowing(userId: userId) }
            }
        }
    }

    func fetchInvitations(userId: Int) async {
        guard let url = URL(string: "\(Config.backendURL)/api/invitations?direction=received&user=\(userId)") else { return }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let invitations = try JSONDecoder().decode([InvitationResponse].self, from: data)
            await MainActor.run {
                invitedPartyIds = Set(invitations.compactMap { $0.partyId })
            }
        } catch {
            print("Failed to fetch invitations: \(error)")
        }
    }

    func fetchFollowing(userId: Int) async {
        guard let url = URL(string: "\(Config.backendURL)/api/users/\(userId)/following") else { return }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let users = try JSONDecoder().decode([FollowUserResponse].self, from: data)
            await MainActor.run {
                followingUserIds = Set(users.map { Int64($0.id) })
            }
        } catch {
            print("Failed to fetch following: \(error)")
        }
    }
}
