import SwiftUI
import MapKit
import SwiftData

private struct InvitationResponse: Decodable {
    let partyId: Int?

    enum CodingKeys: String, CodingKey {
        case partyId = "party_id"
    }
}

private struct FollowUserResponse: Decodable {
    let id: Int
}

private enum CostFilter: String, CaseIterable {
    case all = "All"
    case free = "Free"
    case paid = "Paid"

    var systemImage: String {
        switch self {
        case .all: return "banknote"
        case .free: return "banknote.fill"
        case .paid: return "creditcard.fill"
        }
    }
}

struct MapView: View {
    var locationManager: LocationManager

    @State private var position: MapCameraPosition = .userLocation(fallback: .automatic)
    @State private var invitedPartyIds: Set<Int> = []
    @State private var followingUserIds: Set<Int64> = []
    @State private var showFilterSheet = false
    @State private var currentRegion: MKCoordinateRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 48.2082, longitude: 16.3738),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    @State private var mapViewSize: CGSize = .zero
    @State private var partyClusters: [Cluster<Party>] = []
    @State private var userAge: Int? = nil
    @State private var userLocation: CLLocationCoordinate2D? = nil
    @State private var searchText = ""

    @State private var costFilter: CostFilter = .all
    @State private var nearMeEnabled = false
    @State private var myAgeEnabled = false
    @State private var within2WeeksEnabled = false

    @Query var parties: [Party]
    private let highlightedPartyId: Int?

    private let clusteringEngine = MapClusteringEngine()

    private var currentUserId: Int? {
        if let userId = AuthManager.shared.userId {
            return userId
        }
        let storedId = UserDefaults.standard.integer(forKey: "partyhub_user_id")
        return storedId > 0 ? storedId : nil
    }

    private var isFilterActive: Bool {
        costFilter != .all || nearMeEnabled || myAgeEnabled || within2WeeksEnabled
    }

    private var filteredParties: [Party] {
        var result = parties

        if costFilter == .free {
            result = result.filter { $0.fee == nil || $0.fee == 0 }
        } else if costFilter == .paid {
            result = result.filter { $0.fee != nil && $0.fee! > 0 }
        }

        if myAgeEnabled, let age = userAge {
            result = result.filter { party in
                let minMatch = party.minAge == nil || party.minAge! <= age
                let maxMatch = party.maxAge == nil || party.maxAge! >= age
                return minMatch && maxMatch
            }
        }

        if nearMeEnabled, let location = userLocation {
            result = result.filter { party in
                let distance = CLLocation(latitude: location.latitude, longitude: location.longitude)
                    .distance(from: CLLocation(latitude: party.latitude, longitude: party.longitude))
                return distance <= 5000
            }
        }

        if !searchText.isEmpty {
            result = result.filter { party in
                party.name.localizedCaseInsensitiveContains(searchText) ||
                (party.partyDescription ?? "").localizedCaseInsensitiveContains(searchText) ||
                party.location.localizedCaseInsensitiveContains(searchText) ||
                (party.hostDisplayName ?? "").localizedCaseInsensitiveContains(searchText)
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
            ZStack(alignment: .top) {
                mapContent
                    .ignoresSafeArea()

                searchBar
                    .padding(.horizontal, 12)
                    .padding(.top, 8)
            }
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
            .onChange(of: filteredParties.count) { _, _ in
                triggerRecomputeClusters()
            }
            .onChange(of: followingUserIds.count) { _, _ in
                triggerRecomputeClusters()
            }
            .onChange(of: invitedPartyIds.count) { _, _ in
                triggerRecomputeClusters()
            }
            .navigationTitle(displayedParty?.name ?? "Map")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { filterToolbarButton }
            .sheet(isPresented: $showFilterSheet) {
                filterSheet
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
            Button {
                showFilterSheet = true
            } label: {
                Image(systemName: isFilterActive ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                    .font(.title2)
                    .foregroundStyle(isFilterActive ? Color("primary pink") : .primary)
            }
        }
    }

    private var filterSheet: some View {
        NavigationStack {
            Form {
                Section("Cost") {
                    Picker("Cost", selection: $costFilter) {
                        ForEach(CostFilter.allCases, id: \.self) { filter in
                            HStack(spacing: 8) {
                                Image(systemName: filter.systemImage)
                                    .frame(width: 24)
                                Text(filter.rawValue)
                            }
                            .tag(filter)
                        }
                    }
                    .pickerStyle(.inline)
                }

                Section("Location") {
                    Toggle(isOn: $nearMeEnabled) {
                        HStack(spacing: 8) {
                            Image(systemName: "location.fill")
                                .frame(width: 24)
                                .foregroundStyle(Color("primary pink"))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Near Me")
                                Text("Parties within 5km")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                Section("Age") {
                    Toggle(isOn: $myAgeEnabled) {
                        HStack(spacing: 8) {
                            Image(systemName: "person.fill")
                                .frame(width: 24)
                                .foregroundStyle(Color("primary pink"))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("My Age")
                                Text("Parties matching your age")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        showFilterSheet = false
                    }
                }
                ToolbarItem(placement: .destructiveAction) {
                    Button("Reset") {
                        costFilter = .all
                        nearMeEnabled = false
                        myAgeEnabled = false
                    }
                    .disabled(!isFilterActive)
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)

            TextField("Search parties...", text: $searchText)
                .textFieldStyle(.plain)
                .autocorrectionDisabled()

            if !searchText.isEmpty {
                Button {
                    searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.15), radius: 4, y: 2)
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
        Task {
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
