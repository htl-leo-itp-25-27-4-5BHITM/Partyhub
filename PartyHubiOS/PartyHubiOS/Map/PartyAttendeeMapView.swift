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

    init(
        id: UUID = UUID(),
        coordinate: CLLocationCoordinate2D,
        isSelf: Bool,
        userId: Int64?,
        isAtParty: Bool,
        displayName: String?,
        sourceUserLocation: UserLocation? = nil
    ) {
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

    @State private var activeFilters: Set<AttendeeFilter> = [.all]
    @State private var showFilterSheet = false

    @State private var invitedUserIds: Set<Int> = []
    @State private var friendUserIds: Set<Int> = []
    @State private var currentUserAttendeeLocation: UserLocation? = nil

    private let currentUserId: Int = 1
    private let clusteringEngine = MapClusteringEngine()

    init(
        party: Party,
        locationManager: LocationManager
    ) {

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

    // MARK: - Visible Filters

    private var visibleFilters: [AttendeeFilter] {
        [
            .all,
            .atParty,
            .invited,
            .friends
        ]
    }

    private var activeFilterDisplayText: String {
        let count = filteredLocations().count
        let filterNames = activeFilters
            .sorted { $0.rawValue < $1.rawValue }
            .map { $0.rawValue.lowercased() }
        let text = filterNames.joined(separator: ", ")
        return "\(text)       \(count)"
    }

    // MARK: - Load Data

    private func loadData() {
        loadInvitations()
        loadFriends()
        refreshCurrentUserAttendeeLocation()
    }

    private func refreshCurrentUserAttendeeLocation() {
        currentUserAttendeeLocation = currentUserLocationIfAtParty()
    }

    private func isCurrentUserAtParty() -> Bool {
        guard let currentLocation = locationManager.currentLocation else { return false }

        let userLocation = CLLocation(
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
        )
        let partyLocation = CLLocation(
            latitude: party.latitude,
            longitude: party.longitude
        )

        return userLocation.distance(from: partyLocation) <= party.radiusMeters
    }

    private func shouldShowCurrentUser() -> Bool {
        party.hostUserId == Int64(currentUserId) || isCurrentUserAtParty()
    }

    private func currentUserLocationIfAtParty() -> UserLocation? {
        guard let currentLocation = locationManager.currentLocation else {
            let isHost = party.hostUserId == 1
            if isHost {
                return UserLocation(
                    latitude: party.latitude,
                    longitude: party.longitude,
                    user: .init(
                        id: Int64(currentUserId),
                        displayName: "You",
                        distinctName: "You"
                    )
                )
            }
            return nil
        }
        
        return UserLocation(
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            user: .init(
                id: Int64(currentUserId),
                displayName: "You",
                distinctName: "You"
            )
        )
    }

    private func attendeeLocationsIncludingCurrentUserIfNeeded() -> [UserLocation] {
        var locations = viewModel.locations

        locations.removeAll { Int($0.user?.id ?? 0) == currentUserId }

        guard let currentUserLocation = currentUserAttendeeLocation else {
            return locations
        }

        locations.append(currentUserLocation)

        return locations
    }

    private func loadInvitations() {

        guard let url = URL(
            string: "\(Config.backendURL)/api/parties/\(party.backendId)/invited-members"
        ) else { return }

        struct InvitationResponse: Decodable {

            let userId: Int?
        }

        URLSession.shared.dataTask(with: url) { data, _, _ in

            guard let data = data else { return }

            if let invitations = try? JSONDecoder().decode([InvitationResponse].self, from: data) {

                DispatchQueue.main.async {

                    invitedUserIds = Set(
                        invitations.compactMap { $0.userId }
                    )
                }
            }

        }.resume()
    }

    private func loadFriends() {

        guard let url = URL(
            string: "\(Config.backendURL)/api/users/\(currentUserId)/following"
        ) else { return }

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

        var allLocations = attendeeLocationsIncludingCurrentUserIfNeeded()
        
        if let currentUserLocation = currentUserAttendeeLocation,
           !allLocations.contains(where: { Int($0.user?.id ?? 0) == currentUserId }) {
            allLocations.append(currentUserLocation)
        }

        if activeFilters.contains(.all) {
            return allLocations
        }

        var filteredResults: [UserLocation] = []

        if activeFilters.contains(.atParty) {
            filteredResults.append(contentsOf: allLocations.filter { $0.isInsideParty(party) })
        }

        if activeFilters.contains(.invited) {
            let invited = allLocations.filter { location in
                if Int(location.user?.id ?? 0) == currentUserId {
                    return currentUserAttendeeLocation != nil
                }
                guard let userId = location.user?.id else { return false }
                return invitedUserIds.contains(Int(userId)) && !friendUserIds.contains(Int(userId))
            }
            filteredResults.append(contentsOf: invited)
        }

        if activeFilters.contains(.friends) {
            let friends = allLocations.filter { location in
                guard let userId = location.user?.id else { return false }
                return friendUserIds.contains(Int(userId))
            }
            filteredResults.append(contentsOf: friends)
        }

        var uniqueResults: [UserLocation] = []
        var seenIds: Set<Int64> = []
        for location in filteredResults {
            let id = location.user?.id ?? 0
            if !seenIds.contains(id) {
                uniqueResults.append(location)
                seenIds.insert(id)
            }
        }

        return uniqueResults
    }

    private func countFor(_ filter: AttendeeFilter) -> Int {

        switch filter {

        case .all:

            return attendeeLocationsIncludingCurrentUserIfNeeded().count

        case .atParty:

            return attendeeLocationsIncludingCurrentUserIfNeeded().filter {
                $0.isInsideParty(party)
            }.count

        case .invited:

            return attendeeLocationsIncludingCurrentUserIfNeeded().filter { location in

                if Int(location.user?.id ?? 0) == currentUserId {
                    return currentUserAttendeeLocation != nil
                }

                guard let userId = location.user?.id else {
                    return false
                }

                return invitedUserIds.contains(Int(userId)) && !friendUserIds.contains(Int(userId))

            }.count

        case .friends:

            return viewModel.locations.filter { location in

                guard let userId = location.user?.id else {
                    return false
                }

                return friendUserIds.contains(Int(userId))

            }.count

        case .accepted, .pending:

            return 0
        }
    }

    // MARK: - Map Logic

    private func buildAttendeeItems() -> [AttendeeMapItem] {

        var items: [AttendeeMapItem] = []

        for userLocation in filteredLocations() {

            items.append(
                AttendeeMapItem(
                    coordinate: userLocation.coordinate,
                    isSelf: Int(userLocation.user?.id ?? 0) == currentUserId,
                    userId: userLocation.user?.id,
                    isAtParty: userLocation.isInsideParty(party),
                    displayName: userLocation.user?.displayName
                        ?? userLocation.user?.distinctName,
                    sourceUserLocation: userLocation
                )
            )
        }

        return items
    }

    private func recomputeAttendeeClusters() {

        guard mapViewSize.width > 0,
              mapViewSize.height > 0 else {
            return
        }

        attendeeClusters = clusteringEngine.computeClusters(
            items: buildAttendeeItems(),
            for: currentRegion,
            in: mapViewSize
        )
    }

    private func zoomToFit<T: Clusterable>(
        cluster: Cluster<T>
    ) {

        let coordinates = cluster.items.map {
            $0.coordinate
        }

        if let fitRegion = MKCoordinateRegion.fitting(
            coordinates: coordinates
        ) {

            withAnimation {
                position = .region(fitRegion)
            }
        }
    }

    // MARK: - Body

    var body: some View {

        GeometryReader { geo in

            Map(position: $position) {

                Annotation(
                    party.name,
                    coordinate: party.coordinate
                ) {

                    PartyPin(isActive: party.isActive)
                }

                ForEach(attendeeClusters, id: \.id) { cluster in

                    if cluster.items.count == 1,
                       let item = cluster.items.first {

                        Annotation(
                            item.displayName ?? "User",
                            coordinate: cluster.coordinate
                        ) {

                            AttendeePin(
                                isAtParty: item.isAtParty,
                                isSelf: item.isSelf,
                                userId: item.userId != nil
                                    ? Int(item.userId!)
                                    : nil
                            )
                        }

                    } else {

                        Annotation(
                            "\(cluster.items.count) Participants",
                            coordinate: cluster.coordinate
                        ) {

                            AttendeeClusterPin(
                                count: cluster.items.count
                            )
                            .onTapGesture {
                                zoomToFit(cluster: cluster)
                            }
                        }
                    }
                }
            }
            .ignoresSafeArea()
            .overlay(alignment: .top) {
                VStack {
                    HStack {
                        Image(systemName: "line.3.horizontal.decrease.circle.fill")
                            .font(.caption)
                        Text(activeFilterDisplayText)
                            .font(.caption)
                            .fontWeight(.semibold)
                        Spacer()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.black.opacity(0.6))
                    .foregroundStyle(.white)
                    .cornerRadius(8)
                    .padding(12)
                    
                    Spacer()
                }
            }
            .navigationTitle("Participant map")
            .navigationBarTitleDisplayMode(.inline)

            .toolbar {

                ToolbarItem(
                    placement: .navigationBarTrailing
                ) {

                    Button {

                        showFilterSheet = true

                    } label: {

                        ZStack(alignment: .topTrailing) {

                            Image(
                                systemName: "line.3.horizontal.decrease.circle.fill"
                            )
                            .font(.title3)
                            .foregroundStyle(
                                activeFilters == [.all]
                                    ? .secondary
                                    : Color("primary pink")
                            )

                            if activeFilters != [.all] {

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
                locationManager.ensureLocationUpdates()

                viewModel.coordinateProvider = {
                    locationManager.currentLocation
                }

                viewModel.startPolling(
                    partyId: Int64(party.backendId)
                )

                if let userId = UserDefaults.standard.object(
                    forKey: "currentUserId"
                ) as? Int64 {

                    viewModel.startUploading(
                        userId: userId
                    )
                }

                loadData()
            }

            .onChange(of: geo.size) { _, newSize in
                mapViewSize = newSize
            }

            .onMapCameraChange(frequency: .onEnd) { context in

                currentRegion = context.region
                shouldPreserveUserCamera = true
            }

            .onChange(of: currentRegion) { _, _ in
                recomputeAttendeeClusters()
            }

            .onChange(of: activeFilters) { _, _ in
                recomputeAttendeeClusters()
            }

            .onChange(of: invitedUserIds) { _, _ in
                recomputeAttendeeClusters()
            }

            .onChange(of: friendUserIds) { _, _ in
                recomputeAttendeeClusters()
            }

            .onChange(of: locationManager.currentLocation) { _, _ in

                viewModel.coordinateProvider = {
                    locationManager.currentLocation
                }

                refreshCurrentUserAttendeeLocation()

                recomputeAttendeeClusters()
            }

            .onChange(of: viewModel.locations.count) { _, _ in
                recomputeAttendeeClusters()
            }

            .onDisappear {

                viewModel.stopPolling()
                viewModel.stopUploading()
            }

            .sheet(isPresented: $showFilterSheet) {

                NavigationStack {

                    List {

                        Section("Show") {

                            ForEach(
                                visibleFilters,
                                id: \.self
                            ) { filter in

                                Button {

                                    withAnimation {
                                        if filter == .all {
                                            activeFilters = [.all]
                                        } else if activeFilters.contains(.all) {
                                            activeFilters = [filter]
                                        } else if activeFilters.contains(filter) {
                                            activeFilters.remove(filter)
                                            if activeFilters.isEmpty {
                                                activeFilters = [.all]
                                            }
                                        } else {
                                            activeFilters.insert(filter)
                                        }
                                    }

                                } label: {

                                    HStack(spacing: 12) {

                                        Image(
                                            systemName: filter.systemImage
                                        )
                                        .frame(width: 28)
                                        .foregroundStyle(
                                            activeFilters.contains(filter)
                                                ? Color("primary pink")
                                                : .primary
                                        )

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

                                        if activeFilters.contains(filter) {

                                            Image(systemName: "checkmark")
                                                .foregroundStyle(
                                                    Color("primary pink")
                                                )
                                                .fontWeight(.semibold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .navigationTitle("filter")
                    .navigationBarTitleDisplayMode(.inline)

                    .toolbar {

                        ToolbarItem(
                            placement: .cancellationAction
                        ) {

                            Button("Done") {
                                showFilterSheet = false
                            }
                        }
                    }
                }
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
            }
        }
    }
}
