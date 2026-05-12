import SwiftUI
import MapKit
import CoreLocation

private struct AttendeeMapItem: Identifiable, Clusterable {
    let id: UUID
    let coordinate: CLLocationCoordinate2D
    let isSelf: Bool
    let userId: Int64?
    let isAtParty: Bool
    let displayName: String?
    let sourceUserLocation: UserLocation?

    init(id: UUID = UUID(),
         coordinate: CLLocationCoordinate2D,
         isSelf: Bool,
         userId: Int64?,
         isAtParty: Bool,
         displayName: String?,
         sourceUserLocation: UserLocation? = nil) {
        self.id = id
        self.coordinate = coordinate
        self.isSelf = isSelf
        self.userId = userId
        self.isAtParty = isAtParty
        self.displayName = displayName
        self.sourceUserLocation = sourceUserLocation
    }
}

struct PartyAttendeeMapView: View {
    let party: Party
    let locationManager: LocationManager

    @State private var viewModel = UserLocationViewModel()
    @State private var position: MapCameraPosition
    @State private var hasAppliedInitialRegion = false
    @State private var shouldPreserveUserCamera = false
    @State private var currentRegion: MKCoordinateRegion
    @State private var mapViewSize: CGSize = .zero
    @State private var attendeeClusters: [Cluster<AttendeeMapItem>] = []
    @State private var activeFilter: AttendeeFilter = .all
    @State private var showFilterSheet = false

    // User-Daten
    @State private var acceptedUserIds: Set<Int> = []
    @State private var pendingUserIds: Set<Int> = []
    @State private var friendUserIds: Set<Int> = []

    private let currentUserId: Int = 1 // Default User
    private let clusteringEngine = MapClusteringEngine()

    init(party: Party, locationManager: LocationManager) {
        self.party = party
        self.locationManager = locationManager
        let initialRegion = MKCoordinateRegion(
            center: party.coordinate,
            latitudinalMeters: max(party.radiusMeters * 6, 600),
            longitudinalMeters: max(party.radiusMeters * 6, 600)
        )
        _position = State(initialValue: .region(initialRegion))
        _currentRegion = State(initialValue: initialRegion)
    }

    // MARK: - Data Loading

    private func loadData() {
        loadInvitations()
        loadFriends()
    }

    private func loadInvitations() {
        guard let url = URL(string: "\(Config.backendURL)/api/invitations?direction=received&party=\(party.backendId)") else { return }

        struct InvitationResponse: Decodable {
            let recipientId: Int?
            let status: String?
            enum CodingKeys: String, CodingKey {
                case recipientId = "recipient_id"
                case status
            }
        }

        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else { return }
            if let invitations = try? JSONDecoder().decode([InvitationResponse].self, from: data) {
                DispatchQueue.main.async {
                    acceptedUserIds = Set(invitations.filter { $0.status?.uppercased() == "ACCEPTED" }.compactMap { $0.recipientId })
                    pendingUserIds = Set(invitations.filter { $0.status?.uppercased() == "PENDING" }.compactMap { $0.recipientId })
                }
            }
        }.resume()
    }

    private func loadFriends() {
        guard let url = URL(string: "\(Config.backendURL)/api/users/\(currentUserId)/following") else { return }

        struct FollowResponse: Decodable {
            let id: Int
        }

        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else { return }
            if let users = try? JSONDecoder().decode([FollowResponse].self, from: data) {
                DispatchQueue.main.async {
                    friendUserIds = Set(users.map { $0.id })
                }
            }
        }.resume()
    }

    // MARK: - Filter Logic

    private func filteredLocations() -> [UserLocation] {
        switch activeFilter {
        case .all:
            return viewModel.locations
        case .atParty:
            return viewModel.locations.filter { $0.isInsideParty(party) }
        case .invited:
            return viewModel.locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return acceptedUserIds.contains(Int(userId)) || pendingUserIds.contains(Int(userId))
            }
        case .accepted:
            return viewModel.locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return acceptedUserIds.contains(Int(userId))
            }
        case .pending:
            return viewModel.locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return pendingUserIds.contains(Int(userId))
            }
        case .friends:
            return viewModel.locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return friendUserIds.contains(Int(userId))
            }
        }
    }

    private func countFor(_ filter: AttendeeFilter) -> Int {
        switch filter {
        case .all:
            return viewModel.locations.count
        case .atParty:
            return viewModel.locations.filter { $0.isInsideParty(party) }.count
        case .invited:
            return viewModel.locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return acceptedUserIds.contains(Int(userId)) || pendingUserIds.contains(Int(userId))
            }.count
        case .accepted:
            return viewModel.locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return acceptedUserIds.contains(Int(userId))
            }.count
        case .pending:
            return viewModel.locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return pendingUserIds.contains(Int(userId))
            }.count
        case .friends:
            return viewModel.locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return friendUserIds.contains(Int(userId))
            }.count
        }
    }

    // MARK: - Map Logic

    private func buildAttendeeItems() -> [AttendeeMapItem] {
        var items: [AttendeeMapItem] = []

        for userLocation in filteredLocations() {
            if let userId = userLocation.user?.id, Int(userId) == currentUserId {
                continue
            }
            items.append(AttendeeMapItem(
                coordinate: userLocation.coordinate,
                isSelf: false,
                userId: userLocation.user?.id,
                isAtParty: userLocation.isInsideParty(party),
                displayName: userLocation.user?.displayName ?? userLocation.user?.distinctName,
                sourceUserLocation: userLocation
            ))
        }

        if let selfCoord = locationManager.currentLocation {
            items.append(AttendeeMapItem(
                coordinate: selfCoord,
                isSelf: true,
                userId: Int64(currentUserId),
                isAtParty: locationManager.isAtParty,
                displayName: "Du"
            ))
        }

        return items
    }

    private func recomputeAttendeeClusters() {
        guard mapViewSize.width > 0, mapViewSize.height > 0 else { return }
        attendeeClusters = clusteringEngine.computeClusters(
            items: buildAttendeeItems(),
            for: currentRegion,
            in: mapViewSize
        )
    }

    private func zoomToFit<T: Clusterable>(cluster: Cluster<T>) {
        let coordinates = cluster.items.map { $0.coordinate }
        if let fitRegion = MKCoordinateRegion.fitting(coordinates: coordinates) {
            withAnimation { position = .region(fitRegion) }
        }
    }

    // MARK: - Body

    var body: some View {
        GeometryReader { geo in
            Map(position: $position) {
                Annotation(party.name, coordinate: party.coordinate) {
                    PartyPin(isActive: party.isActive)
                }
                ForEach(attendeeClusters, id: \.id) { cluster in
                    if cluster.items.count == 1, let item = cluster.items.first {
                        Annotation(item.displayName ?? "User", coordinate: cluster.coordinate) {
                            AttendeePin(
                                isAtParty: item.isAtParty,
                                isSelf: item.isSelf,
                                userId: item.userId != nil ? Int(item.userId!) : nil
                            )
                        }
                    } else {
                        Annotation("\(cluster.items.count) Teilnehmer", coordinate: cluster.coordinate) {
                            AttendeeClusterPin(count: cluster.items.count)
                                .onTapGesture { zoomToFit(cluster: cluster) }
                        }
                    }
                }
            }
            .ignoresSafeArea()
            .navigationTitle("Teilnehmer-Karte")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showFilterSheet = true
                    } label: {
                        ZStack(alignment: .topTrailing) {
                            Image(systemName: "line.3.horizontal.decrease.circle.fill")
                                .font(.title3)
                                .foregroundStyle(activeFilter == .all ? .secondary : Color("primary pink"))
                            if activeFilter != .all {
                                Circle()
                                    .fill(.red)
                                    .frame(width: 8, height: 8)
                                    .offset(x: 2, y: -2)
                            }
                        }
                    }
                }
            }
            .onAppear {
                mapViewSize = geo.size
                locationManager.requestPermission()
                viewModel.coordinateProvider = { locationManager.currentLocation }
                viewModel.startPolling(partyId: Int64(party.backendId))
                if let userId = UserDefaults.standard.object(forKey: "currentUserId") as? Int64 {
                    viewModel.startUploading(userId: userId)
                }
                loadData()
            }
            .onChange(of: geo.size) { _, newSize in mapViewSize = newSize }
            .onMapCameraChange(frequency: .onEnd) { context in
                currentRegion = context.region
                shouldPreserveUserCamera = true
            }
            .onChange(of: currentRegion) { _, _ in recomputeAttendeeClusters() }
            .onChange(of: activeFilter) { _, _ in recomputeAttendeeClusters() }
            .onChange(of: acceptedUserIds) { _, _ in recomputeAttendeeClusters() }
            .onChange(of: pendingUserIds) { _, _ in recomputeAttendeeClusters() }
            .onChange(of: friendUserIds) { _, _ in recomputeAttendeeClusters() }
            .onChange(of: locationManager.currentLocation) { _, _ in
                viewModel.coordinateProvider = { locationManager.currentLocation }
                recomputeAttendeeClusters()
            }
            .onChange(of: viewModel.locations.count) { _, _ in recomputeAttendeeClusters() }
            .onDisappear {
                viewModel.stopPolling()
                viewModel.stopUploading()
            }
            .sheet(isPresented: $showFilterSheet) {
                NavigationStack {
                    List {
                        Section("Anzeigen") {
                            ForEach(AttendeeFilter.allCases, id: \.self) { filter in
                                Button {
                                    withAnimation { activeFilter = filter }
                                    showFilterSheet = false
                                } label: {
                                    HStack(spacing: 12) {
                                        Image(systemName: filter.systemImage)
                                            .frame(width: 28)
                                            .foregroundStyle(activeFilter == filter ? Color("primary pink") : .primary)
                                        Text(filter.rawValue)
                                            .foregroundStyle(.primary)
                                        Spacer()
                                        Text("\(countFor(filter))")
                                            .font(.caption)
                                            .fontWeight(.semibold)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 3)
                                            .background(Color(.systemGray5))
                                            .clipShape(Capsule())
                                        if activeFilter == filter {
                                            Image(systemName: "checkmark")
                                                .foregroundStyle(Color("primary pink"))
                                                .fontWeight(.semibold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .navigationTitle("Filtern")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Abbrechen") { showFilterSheet = false }
                        }
                    }
                }
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
            }
        }
    }
}
