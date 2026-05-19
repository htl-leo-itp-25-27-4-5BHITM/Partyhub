import SwiftUI
import MapKit
import SwiftData

enum MapFilter: String, CaseIterable {
    case all = "All"
    case invited = "Invited"
    case friends = "Friends"
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
    @State private var activePartyFilters: Set<PartyMapFilter> = [.all]
    @State private var invitedPartyIds: Set<Int> = []
    @State private var followingUserIds: Set<Int64> = []
    @State private var showFilterDialog = false
    @State private var showPartyFilterSheet = false
    @State private var currentRegion: MKCoordinateRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 48.2082, longitude: 16.3738),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    @State private var mapViewSize: CGSize = .zero
    @State private var partyClusters: [Cluster<Party>] = []
    @State private var userAge: Int? = nil
    @State private var userLocation: CLLocationCoordinate2D? = nil

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
        selectedFilter != .all || !activePartyFilters.contains(.all)
    }

    private var filteredParties: [Party] {
        var result = parties.filter { party in
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
        
        // Apply party discovery filters
        if !activePartyFilters.contains(.all) {
            if activePartyFilters.contains(.freeOnly) {
                result = result.filter { $0.fee == nil || $0.fee == 0 }
            }
            if activePartyFilters.contains(.paidOnly) {
                result = result.filter { $0.fee != nil && $0.fee! > 0 }
            }
            if activePartyFilters.contains(.myAge), let age = userAge {
                result = result.filter { party in
                    let minMatch = party.minAge == nil || party.minAge! <= age
                    let maxMatch = party.maxAge == nil || party.maxAge! >= age
                    return minMatch && maxMatch
                }
            }
            if activePartyFilters.contains(.nearMe), let location = userLocation {
                result = result.filter { party in
                    let distance = CLLocation(latitude: location.latitude, longitude: location.longitude)
                        .distance(from: CLLocation(latitude: party.latitude, longitude: party.longitude))
                    return distance <= 5000 // 5km in meters
                }
            }
        }
        
        return result
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
                    loadUserProfile()
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
                .onChange(of: activePartyFilters) { _, _ in
                    triggerRecomputeClusters()
                }
                .onChange(of: userLocation) { _, _ in
                    triggerRecomputeClusters()
                }
                .navigationTitle(displayedParty?.name ?? "Map")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { filterToolbarButton }
                .confirmationDialog("Filter", isPresented: $showFilterDialog) {
                    filterDialogButtons
                } message: {
                    Text("Show only parties from one category")
                }
                .sheet(isPresented: $showPartyFilterSheet) {
                    partyFilterSheet
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
                Annotation("You", coordinate: coord) {
                    MapBadge(type: .attendee(isAtParty: locationManager.isAtParty, isSelf: true, userId: currentUserId))
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
            MapBadge(type: .party(isActive: party.isActive, isHostedByFriend: isHostedByFriend, isInvited: isInvited))
                .onTapGesture { focusMap(on: party) }
        }
    }
    
    private func partyClusterAnnotation(for cluster: Cluster<Party>) -> some MapContent {
        Annotation("\(cluster.items.count) Partys", coordinate: cluster.coordinate) {
            MapClusterBadge(type: .parties(count: cluster.items.count))
                .onTapGesture { zoomToFit(cluster: cluster) }
        }
    }
    
    private var filterToolbarButton: some ToolbarContent {
        ToolbarItem(placement: .navigationBarTrailing) {
            HStack(spacing: 12) {
                Button {
                    showPartyFilterSheet = true
                } label: {
                    Image(systemName: !activePartyFilters.contains(.all) ? "star.fill" : "star")
                        .font(.title2)
                        .foregroundStyle(!activePartyFilters.contains(.all) ? Color("primary pink") : .primary)
                }
                
                Button {
                    showFilterDialog = true
                } label: {
                    Image(systemName: isFilterActive && selectedFilter != .all ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                        .font(.title2)
                        .foregroundStyle(isFilterActive && selectedFilter != .all ? Color("primary pink") : .primary)
                }
            }
        }
    }
    
    private var partyFilterSheet: some View {
        NavigationStack {
            List {
                Section("Party Discovery Filters") {
                    ForEach(PartyMapFilter.allCases, id: \.self) { filter in
                        Button {
                            withAnimation {
                                if filter == .all {
                                    activePartyFilters = [.all]
                                } else if activePartyFilters.contains(.all) {
                                    activePartyFilters = [filter]
                                } else if activePartyFilters.contains(filter) {
                                    activePartyFilters.remove(filter)
                                    if activePartyFilters.isEmpty {
                                        activePartyFilters = [.all]
                                    }
                                } else {
                                    activePartyFilters.insert(filter)
                                }
                            }
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: filter.systemImage)
                                    .frame(width: 28)
                                    .foregroundStyle(
                                        activePartyFilters.contains(filter)
                                            ? Color("primary pink")
                                            : .primary
                                    )
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(filter.rawValue)
                                        .foregroundStyle(.primary)
                                    Text(filter.description)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                
                                Spacer()
                                
                                if activePartyFilters.contains(filter) {
                                    Image(systemName: "checkmark")
                                        .foregroundStyle(Color("primary pink"))
                                        .fontWeight(.semibold)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Discovery Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        showPartyFilterSheet = false
                    }
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }
    
    private var filterDialogButtons: some View {
        Group {
            Button("All ") { setFilter(.all) }
            Button("Invited") { setFilter(.invited) }
            Button("Friends") { setFilter(.friends) }
            Button("Cancel", role: .cancel) { }
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
    
    func loadUserProfile() {
        guard let userId = currentUserId else { return }
        
        Task {
            // Get user location for distance filtering
            if let location = locationManager.currentLocation {
                await MainActor.run {
                    userLocation = location
                }
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


