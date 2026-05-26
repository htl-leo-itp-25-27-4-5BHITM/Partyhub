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
    @State private var filterState = PartyMapFilterState()

    @Query var parties: [Party]
    private let highlightedPartyId: Int?

    private let clusteringEngine = MapClusteringEngine()
    private let ageOptions = Array(16...99)

    private var currentUserId: Int? {
        if let userId = AuthManager.shared.userId {
            return userId
        }
        let storedId = UserDefaults.standard.integer(forKey: "partyhub_user_id")
        return storedId > 0 ? storedId : nil
    }

    private var currentUserLocation: CLLocationCoordinate2D? {
        locationManager.currentLocation
    }

    private var hasCurrentUserLocation: Bool {
        currentUserLocation != nil
    }

    private var availableThemes: [String] {
        Array(
            Set(
                parties.compactMap {
                    $0.themeName?.trimmingCharacters(in: .whitespacesAndNewlines)
                }
                .filter { !$0.isEmpty }
            )
        )
        .sorted { $0.localizedCaseInsensitiveCompare($1) == .orderedAscending }
    }

    private var filteredPartyIDs: [Int] {
        filteredParties.map(\.backendId).sorted()
    }

    private var filteredParties: [Party] {
        let now = Date()
        let twoWeeksFromNow = Calendar.current.date(byAdding: .day, value: 14, to: now) ?? now
        let trimmedSearchText = filterState.trimmedSearchText

        return parties.filter { party in
            if filterState.timeFilter == .withinTwoWeeks {
                guard let start = party.timeStart else { return false }
                guard start >= now else { return false }
                guard start <= twoWeeksFromNow else { return false }
            }

            if !filterState.selectedThemes.isEmpty {
                guard let themeName = normalizedThemeName(for: party) else { return false }
                guard filterState.selectedThemes.contains(themeName) else { return false }
            }

            if let maximumDistance = filterState.distanceFilter.distanceInMeters {
                guard let currentUserLocation else { return false }

                let userLocation = CLLocation(
                    latitude: currentUserLocation.latitude,
                    longitude: currentUserLocation.longitude
                )
                let partyLocation = CLLocation(
                    latitude: party.latitude,
                    longitude: party.longitude
                )

                guard partyLocation.distance(from: userLocation) <= maximumDistance else { return false }
            }

            if let minimumAge = filterState.minimumAge {
                guard party.maxAge == nil || party.maxAge! >= minimumAge else { return false }
            }

            if let maximumAge = filterState.maximumAge {
                guard party.minAge == nil || party.minAge! <= maximumAge else { return false }
            }

            switch filterState.feeFilter {
            case .all:
                break
            case .freeOnly:
                guard party.fee == nil || party.fee == 0 else { return false }
            case .paidOnly:
                guard let fee = party.fee, fee > 0 else { return false }
            }

            if !trimmedSearchText.isEmpty {
                let haystacks = [
                    party.name,
                    party.partyDescription ?? "",
                    party.location,
                    party.hostDisplayName ?? "",
                    normalizedThemeName(for: party) ?? ""
                ]

                guard haystacks.contains(where: {
                    $0.localizedCaseInsensitiveContains(trimmedSearchText)
                }) else {
                    return false
                }
            }

            return true
        }
    }

    private var isFilterActive: Bool {
        filterState.isActive
    }

    private var activeFilterDisplayText: String {
        var parts: [String] = []

        if filterState.timeFilter == .withinTwoWeeks {
            parts.append("2 weeks")
        }

        if !filterState.selectedThemes.isEmpty {
            if filterState.selectedThemes.count == 1, let theme = filterState.selectedThemes.first {
                parts.append(theme)
            } else {
                parts.append("\(filterState.selectedThemes.count) themes")
            }
        }

        if let distanceLabel = filterState.distanceFilter.summaryLabel {
            parts.append(distanceLabel)
        }

        if let ageSummary = ageSummaryLabel {
            parts.append(ageSummary)
        }

        if let feeSummary = filterState.feeFilter.summaryLabel {
            parts.append(feeSummary)
        }

        if !filterState.trimmedSearchText.isEmpty {
            parts.append("search")
        }

        let description = parts.isEmpty ? "all parties" : parts.joined(separator: ", ")
        return "\(description) (\(filteredParties.count))"
    }

    private var ageSummaryLabel: String? {
        switch (filterState.minimumAge, filterState.maximumAge) {
        case let (minimumAge?, maximumAge?):
            return "\(minimumAge)-\(maximumAge)"
        case let (minimumAge?, nil):
            return "\(minimumAge)+"
        case let (nil, maximumAge?):
            return "up to \(maximumAge)"
        case (nil, nil):
            return nil
        }
    }

    private var minimumAgeSelection: Binding<Int> {
        Binding(
            get: { filterState.minimumAge ?? 0 },
            set: { newValue in
                let updatedAge = newValue == 0 ? nil : newValue
                filterState.minimumAge = updatedAge

                if let minimumAge = updatedAge,
                   let maximumAge = filterState.maximumAge,
                   maximumAge < minimumAge {
                    filterState.maximumAge = minimumAge
                }
            }
        )
    }

    private var maximumAgeSelection: Binding<Int> {
        Binding(
            get: { filterState.maximumAge ?? 0 },
            set: { newValue in
                let updatedAge = newValue == 0 ? nil : newValue
                filterState.maximumAge = updatedAge

                if let maximumAge = updatedAge,
                   let minimumAge = filterState.minimumAge,
                   maximumAge < minimumAge {
                    filterState.minimumAge = maximumAge
                }
            }
        )
    }

    init(locationManager: LocationManager, highlightedPartyId: Int? = nil) {
        self.locationManager = locationManager
        self.highlightedPartyId = highlightedPartyId
    }

    var displayedParty: Party? {
        if let highlightedPartyId {
            if let highlightedParty = filteredParties.first(where: { $0.backendId == highlightedPartyId }) {
                return highlightedParty
            }
        }
        return filteredParties.first(where: { $0.isActive }) ?? filteredParties.first
    }

    var body: some View {
        GeometryReader { geo in
            Map(position: $position) {
                userLocationAnnotation
                partyClusterAnnotations
            }
            .ignoresSafeArea()
            .overlay(alignment: .top) {
                filterSummaryOverlay
            }
            .onAppear {
                mapViewSize = geo.size
                locationManager.requestPermission()
                locationManager.ensureLocationUpdates()
                sanitizeDistanceFilterForLocationAvailability()
                focusMap(on: displayedParty)
                loadFilterData()
                triggerRecomputeClusters()
            }
            .onChange(of: geo.size) { _, newSize in
                mapViewSize = newSize
                triggerRecomputeClusters()
            }
            .onMapCameraChange(frequency: .onEnd) { context in
                currentRegion = context.region
            }
            .onChange(of: currentRegion) { _, _ in
                triggerRecomputeClusters()
            }
            .onChange(of: displayedParty?.backendId) { _, _ in
                focusMap(on: displayedParty)
            }
            .onChange(of: filteredPartyIDs) { _, _ in
                triggerRecomputeClusters()
            }
            .onChange(of: followingUserIds) { _, _ in
                triggerRecomputeClusters()
            }
            .onChange(of: invitedPartyIds) { _, _ in
                triggerRecomputeClusters()
            }
            .onChange(of: locationManager.currentLocation) { _, _ in
                sanitizeDistanceFilterForLocationAvailability()
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

    private var filterSummaryOverlay: some View {
        VStack {
            HStack(spacing: 8) {
                Image(systemName: isFilterActive ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                    .font(.caption)
                Text(activeFilterDisplayText)
                    .font(.caption)
                    .fontWeight(.semibold)
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isFilterActive ? Color.black.opacity(0.65) : Color.black.opacity(0.5))
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .padding(.horizontal, 12)
            .padding(.top, 12)

            Spacer()
        }
    }

    private var userLocationAnnotation: some MapContent {
        Group {
            if let coord = currentUserLocation {
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
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "line.3.horizontal.decrease.circle.fill")
                        .font(.title3)
                        .foregroundStyle(isFilterActive ? Color("primary pink") : .secondary)

                    if isFilterActive {
                        Circle()
                            .fill(.red)
                            .frame(width: 8, height: 8)
                            .offset(x: 2, y: -2)
                    }
                }
            }
        }
    }

    private var filterSheet: some View {
        NavigationStack {
            List {
                Section("Search") {
                    TextField("Search parties", text: $filterState.searchText)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                Section("Time") {
                    ForEach(PartyMapTimeFilter.allCases, id: \.self) { filter in
                        selectionRow(
                            title: filter.rawValue,
                            systemImage: filter.systemImage,
                            isSelected: filterState.timeFilter == filter
                        ) {
                            filterState.timeFilter = filter
                        }
                    }
                }

                Section("Theme") {
                    if availableThemes.isEmpty {
                        Text("Themes will appear here after party data sync includes displayable theme metadata.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(availableThemes, id: \.self) { theme in
                            selectionRow(
                                title: theme,
                                systemImage: "tag.fill",
                                isSelected: filterState.selectedThemes.contains(theme)
                            ) {
                                toggleTheme(theme)
                            }
                        }
                    }
                }

                Section("Distance") {
                    if !hasCurrentUserLocation {
                        Text("Distance filters are unavailable until your current location is available.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text(filterState.distanceFilter.displayLabel)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            Spacer()
                            Text("from 5 km to ∞")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Slider(
                            value: distanceFilterSelection,
                            in: 0...Double(PartyMapDistanceFilter.allCases.count - 1),
                            step: 1
                        )
                        .disabled(!hasCurrentUserLocation)

                        HStack {
                            Text(PartyMapDistanceFilter.allCases.first?.displayLabel ?? "5 km")
                            Spacer()
                            Text(PartyMapDistanceFilter.allCases.last?.displayLabel ?? "∞")
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                }

                Section("Age") {
                    Picker("Minimum Age", selection: minimumAgeSelection) {
                        Text("Any").tag(0)
                        ForEach(ageOptions, id: \.self) { age in
                            Text("\(age)").tag(age)
                        }
                    }

                    Picker("Maximum Age", selection: maximumAgeSelection) {
                        Text("Any").tag(0)
                        ForEach(ageOptions, id: \.self) { age in
                            Text("\(age)").tag(age)
                        }
                    }
                }

                Section("Price") {
                    ForEach(PartyMapFeeFilter.allCases, id: \.self) { filter in
                        selectionRow(
                            title: filter.rawValue,
                            systemImage: filter.systemImage,
                            isSelected: filterState.feeFilter == filter
                        ) {
                            filterState.feeFilter = filter
                        }
                    }
                }
            }
            .navigationTitle("filter")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        showFilterSheet = false
                    }
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button("Reset") {
                        filterState.reset()
                    }
                    .disabled(!isFilterActive)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func selectionRow(
        title: String,
        systemImage: String,
        isSelected: Bool,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .frame(width: 28)
                    .foregroundStyle(isSelected ? Color("primary pink") : .primary)

                Text(title)
                    .foregroundStyle(isDisabled ? .secondary : .primary)

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark")
                        .foregroundStyle(Color("primary pink"))
                        .fontWeight(.semibold)
                }
            }
        }
        .disabled(isDisabled)
    }

    private func triggerRecomputeClusters() {
        guard mapViewSize.width > 0, mapViewSize.height > 0 else { return }

        partyClusters = clusteringEngine.computeClusters(
            items: filteredParties,
            for: currentRegion,
            in: mapViewSize
        )
    }

    private func normalizedThemeName(for party: Party) -> String? {
        guard let themeName = party.themeName?.trimmingCharacters(in: .whitespacesAndNewlines),
              !themeName.isEmpty else {
            return nil
        }

        return themeName
    }

    private func toggleTheme(_ theme: String) {
        if filterState.selectedThemes.contains(theme) {
            filterState.selectedThemes.remove(theme)
        } else {
            filterState.selectedThemes.insert(theme)
        }
    }

    private func sanitizeDistanceFilterForLocationAvailability() {
        if !hasCurrentUserLocation, filterState.distanceFilter != .unlimited {
            filterState.distanceFilter = .unlimited
        }
    }

    private var distanceFilterSelection: Binding<Double> {
        Binding(
            get: { filterState.distanceFilter.sliderIndex },
            set: { newValue in
                filterState.distanceFilter = PartyMapDistanceFilter.filter(for: newValue)
            }
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
