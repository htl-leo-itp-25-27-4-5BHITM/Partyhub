import SwiftUI
import Foundation
import CoreLocation

struct UserLocationListView: View {

    @State private var viewModel = UserLocationViewModel()
    @Environment(LocationManager.self) private var locationManager

    @State private var activeFilter: AttendeeFilter = .all
    @State private var showFilterSheet = false

    @State private var friendUserIds: Set<Int> = []
    @State private var invitedUserIds: Set<Int> = []
    @State private var currentUserAttendeeLocation: UserLocation? = nil

    let currentUserId: Int = 1

    var parties: [Party]

    var activeParty: Party? {
        parties.first(where: { $0.isActive }) ?? parties.first
    }

    // MARK: - Load Data

    private func loadInvitations() {
        guard let party = activeParty else { return }

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

    private func isCurrentUserAtParty(_ party: Party) -> Bool {
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

    private func shouldShowCurrentUser(for party: Party) -> Bool {
        party.hostUserId == Int64(currentUserId) || isCurrentUserAtParty(party)
    }

    private func currentUserLocationIfAtParty(_ party: Party) -> UserLocation? {
        // Always show if host
        let isHost = party.hostUserId == 1 // currentUserId is hardcoded as 1
        
        // Get current location from GPS or party location as fallback
        let latitude: Double
        let longitude: Double
        
        if let currentLocation = locationManager.currentLocation {
            latitude = currentLocation.latitude
            longitude = currentLocation.longitude
        } else if isHost {
            // Use party location as fallback for host
            latitude = party.latitude
            longitude = party.longitude
        } else if isCurrentUserAtParty(party) {
            // GPS confirmed we're at party
            guard let currentLocation = locationManager.currentLocation else { return nil }
            latitude = currentLocation.latitude
            longitude = currentLocation.longitude
        } else {
            return nil
        }
        
        // Only show if host or at party location
        if !isHost && !isCurrentUserAtParty(party) {
            return nil
        }
        
        return UserLocation(
            latitude: latitude,
            longitude: longitude,
            user: .init(
                id: Int64(currentUserId),
                displayName: "Du",
                distinctName: "Du"
            )
        )
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

    private func refreshCurrentUserAttendeeLocation() {
        guard let party = activeParty else {
            currentUserAttendeeLocation = nil
            return
        }

        currentUserAttendeeLocation = currentUserLocationIfAtParty(party)
    }

    // MARK: - Filter

    private func applyFilter(_ filter: AttendeeFilter) -> [UserLocation] {

        guard let party = activeParty else {
            return viewModel.locations
        }

        let currentUserLocation = currentUserAttendeeLocation

        var locations = viewModel.locations

        if let currentUserLocation,
           !locations.contains(where: { Int($0.user?.id ?? 0) == currentUserId }) {
            locations.append(currentUserLocation)
        }

        switch filter {

        case .all:
            return locations

        case .atParty:
            return locations.filter {
                $0.isInsideParty(party)
            }

        case .invited:
            return locations.filter { location in

                if Int(location.user?.id ?? 0) == currentUserId {
                    return currentUserLocation != nil
                }

                guard let userId = location.user?.id else { return false }
                // Invited but NOT friends - to avoid overlap
                return invitedUserIds.contains(Int(userId)) && !friendUserIds.contains(Int(userId))
            }

        case .friends:
            return locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return friendUserIds.contains(Int(userId))
            }

        case .accepted, .pending:
            return []
        }
    }

    private func countFor(_ filter: AttendeeFilter) -> Int {
        applyFilter(filter).count
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

    // MARK: - Body

    var filteredLocations: [UserLocation] {
        applyFilter(activeFilter)
    }

    var body: some View {

        NavigationStack {

            List(filteredLocations) { location in

                HStack(spacing: 12) {

                    if let userId = location.user?.id {

                        UserProfileImageView(
                            userId: Int(userId),
                            size: 50,
                            showBorder: false
                        )

                    } else {

                        Image(systemName: "person.crop.circle")
                            .font(.system(size: 50))
                            .foregroundStyle(.gray)
                    }

                    VStack(alignment: .leading, spacing: 4) {

                        Text(
                            location.user?.displayName
                            ?? location.user?.distinctName
                            ?? "User"
                        )
                        .font(.headline)

                        Text("Lat: \(location.latitude, specifier: "%.6f")")
                            .font(.caption)

                        Text("Lon: \(location.longitude, specifier: "%.6f")")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("User Locations")

            .toolbar {

                ToolbarItem(placement: .navigationBarTrailing) {

                    Button {
                        showFilterSheet = true

                    } label: {

                        ZStack(alignment: .topTrailing) {

                            Image(systemName: "line.3.horizontal.decrease.circle.fill")
                                .font(.title3)
                                .foregroundStyle(
                                    activeFilter == .all
                                    ? .secondary
                                    : Color("primary pink")
                                )

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

                locationManager.ensureLocationUpdates()

                if let party = activeParty {
                    viewModel.fetchLocations(
                        partyId: Int64(party.backendId)
                    )
                }

                loadInvitations()
                loadFriends()
                refreshCurrentUserAttendeeLocation()
            }

            .onChange(of: locationManager.currentLocation) { _, _ in
                refreshCurrentUserAttendeeLocation()
            }

            .refreshable {

                if let party = activeParty {
                    viewModel.fetchLocations(
                        partyId: Int64(party.backendId)
                    )
                }

                loadInvitations()
                loadFriends()
            }

            .sheet(isPresented: $showFilterSheet) {

                NavigationStack {

                    List {

                        Section("Anzeigen") {

                            ForEach(visibleFilters, id: \.self) { filter in

                                Button {

                                    withAnimation {
                                        activeFilter = filter
                                    }

                                    showFilterSheet = false

                                } label: {

                                    HStack(spacing: 12) {

                                        Image(systemName: filter.systemImage)
                                            .frame(width: 28)
                                            .foregroundStyle(
                                                activeFilter == filter
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

                            Button("Abbrechen") {
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
