import SwiftUI

struct UserLocationListView: View {
    @State private var viewModel = UserLocationViewModel()
    @State private var activeFilter: AttendeeFilter = .all
    @State private var showFilterSheet = false
    var parties: [Party]
    var invitedPartyIds: Set<Int> = []
    
    var activeParty: Party? {
        parties.first(where: { $0.isActive }) ?? parties.first
    }

    // Hilfsfunktion zur Vermeidung von Redundanz und Behebung des Switch-Fehlers
    private func applyFilter(_ filter: AttendeeFilter) -> [UserLocation] {
        guard let party = activeParty else { return viewModel.locations }
        
        switch filter {
        case .all:
            return viewModel.locations
        case .atParty:
            return viewModel.locations.filter { $0.isInsideParty(party) }
        case .invited:
            return viewModel.locations.filter { location in
                guard let userId = location.user?.id else { return false }
                return invitedPartyIds.contains(Int(userId))
            }
        @unknown default:
            return viewModel.locations
        }
    }

    var filteredLocations: [UserLocation] {
        applyFilter(activeFilter)
    }

    var body: some View {
        NavigationStack {
            List(filteredLocations) { location in
                HStack(spacing: 12) {
                    if let userId = location.user?.id {
                        UserProfileImageView(userId: Int(userId), size: 50, showBorder: false)
                    } else {
                        Image(systemName: "person.crop.circle")
                            .font(.system(size: 50))
                            .foregroundStyle(.gray)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(location.user?.displayName ?? location.user?.distinctName ?? "User")
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
                if let party = activeParty {
                    viewModel.fetchLocations(partyId: Int64(party.backendId))
                }
            }
            .refreshable {
                if let party = activeParty {
                    viewModel.fetchLocations(partyId: Int64(party.backendId))
                }
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

    private func countFor(_ filter: AttendeeFilter) -> Int {
        applyFilter(filter).count
    }
}
