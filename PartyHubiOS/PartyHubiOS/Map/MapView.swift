import SwiftUI
import MapKit
import SwiftData

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
    @State private var currentRegion: MKCoordinateRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 48.2082, longitude: 16.3738),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    @State private var mapViewSize: CGSize = .zero
    @State private var partyClusters: [Cluster<Party>] = []

    @Query var parties: [Party]
    private let highlightedPartyId: Int?
    
    private let clusteringEngine = MapClusteringEngine()
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
        GeometryReader { geo in
            mapContent
                .ignoresSafeArea()
                .onAppear {
                    mapViewSize = geo.size
                    locationManager.requestPermission()
                    focusMap(on: displayedParty)
                    loadFilterData()
                }
                .onChange(of: geo.size) { _, newSize in
                    mapViewSize = newSize
                }
                .onMapCameraChange(frequency: .onEnd) { context in
                    currentRegion = context.region
                }
                .onChange(of: displayedParty?.backendId) { _, _ in
                    focusMap(on: displayedParty)
                }
                .onChange(of: currentRegion) { _, _ in
                    triggerRecomputeClusters()
                }
                .onChange(of: filteredParties.count) { _, _ in
                    triggerRecomputeClusters()
                }
                .onChange(of: followingUserIds) { _, _ in
                    triggerRecomputeClusters()
                }
                .onChange(of: invitedPartyIds) { _, _ in
                    triggerRecomputeClusters()
                }
                .navigationTitle(displayedParty?.name ?? "Map")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { filterToolbarButton }
                .confirmationDialog("Filter", isPresented: $showFilterDialog) {
                    filterDialogButtons
                } message: {
                    Text("Zeige nur Partys aus einer Kategorie")
                }
        }
    }
    
    private var mapContent: some View {
        Map(position: $position) {
            userLocationAnnotation
            partyClusterAnnotations
        }
    }
    
    private var userLocationAnnotation: some MapContent {
        Group {
            if let coord = locationManager.currentLocation {
                Annotation("Du", coordinate: coord) {
                    AttendeePin(isAtParty: locationManager.isAtParty, isSelf: true, userId: currentUserId)
                }
            }
        }
    }
    
    private var partyClusterAnnotations: some MapContent {
        ForEach(partyClusters, id: \.id) { cluster in
            if cluster.items.count == 1, let party = cluster.items.first {
                singlePartyAnnotation(for: party, at: cluster.coordinate)
            } else {
                partyClusterAnnotation(for: cluster)
            }
        }
    }
    
    private func singlePartyAnnotation(for party: Party, at coordinate: CLLocationCoordinate2D) -> some MapContent {
        let isHostedByFriend = party.hostUserId.flatMap { followingUserIds.contains($0) } ?? false
        let isInvited = invitedPartyIds.contains(party.backendId)
        
        return Annotation(party.name, coordinate: coordinate) {
            PartyPin(isActive: party.isActive, isHostedByFriend: isHostedByFriend, isInvited: isInvited)
                .onTapGesture { focusMap(on: party) }
        }
    }
    
    private func partyClusterAnnotation(for cluster: Cluster<Party>) -> some MapContent {
        Annotation("\(cluster.items.count) Partys", coordinate: cluster.coordinate) {
            PartyClusterPin(parties: cluster.items, followingUserIds: followingUserIds, invitedPartyIds: invitedPartyIds)
                .onTapGesture { zoomToFit(cluster: cluster) }
        }
    }
    
    private var filterToolbarButton: some ToolbarContent {
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
    
    private var filterDialogButtons: some View {
        Group {
            Button("Alle") { setFilter(.all) }
            Button("Eingeladen") { setFilter(.invited) }
            Button("Freunde") { setFilter(.friends) }
            Button("Abbrechen", role: .cancel) { }
        }
    }
    
    private func setFilter(_ filter: MapFilter) {
        if selectedFilter != filter {
            impactGenerator.impactOccurred()
            selectedFilter = filter
        }
    }
    
    private func triggerRecomputeClusters() {
        guard mapViewSize.width > 0, mapViewSize.height > 0 else { return }
        
        partyClusters = clusteringEngine.computeClusters(
            items: filteredParties,
            for: currentRegion,
            in: mapViewSize
        )
    }
    
    private func zoomToFit<T: Clusterable>(cluster: Cluster<T>) {
        let coordinates = cluster.items.map { $0.coordinate }
        if let fitRegion = MKCoordinateRegion.fitting(coordinates: coordinates) {
            withAnimation {
                position = .region(fitRegion)
            }
        }
    }
}

private extension MapView {
    func focusMap(on party: Party?) {
        guard let party else { return }

        let newRegion = MKCoordinateRegion(
            center: party.coordinate,
            latitudinalMeters: max(party.radiusMeters * 6, 600),
            longitudinalMeters: max(party.radiusMeters * 6, 600)
        )
        
        currentRegion = newRegion
        position = .region(newRegion)
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
