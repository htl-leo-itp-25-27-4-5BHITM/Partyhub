import SwiftUI
import SwiftData
import CoreLocation
import MapKit
import Combine

struct PartyView: View {
    @StateObject private var notificationManager = PartyNotificationManager.shared
    @Query var parties: [Party]
    @Environment(LocationManager.self) var locationManager
    @Environment(\.modelContext) private var modelContext

    @State private var drivingDistances: [Int: Double] = [:]
    @State private var lastFetchLocation: CLLocation? = nil
    @State private var isCreating = false
    @State private var showCreateSheet = false

    private struct DistanceTarget {
        let id: Int
        let latitude: Double
        let longitude: Double
    }

    func sortedParties(userCoord: CLLocationCoordinate2D?) -> [Party] {
        guard let userCoord else { return parties }
        let userLocation = CLLocation(latitude: userCoord.latitude, longitude: userCoord.longitude)
        return parties.sorted {
            if let dA = drivingDistances[$0.backendId], let dB = drivingDistances[$1.backendId] {
                return dA < dB
            }
            let locA = CLLocation(latitude: $0.latitude, longitude: $0.longitude)
            let locB = CLLocation(latitude: $1.latitude, longitude: $1.longitude)
            return locA.distance(from: userLocation) < locB.distance(from: userLocation)
        }
    }

    var body: some View {
        let userCoord = locationManager.currentLocation
        let sorted = sortedParties(userCoord: userCoord)

        NavigationStack {
            List {
                if sorted.isEmpty {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text("No Partys found")
                            .foregroundStyle(.secondary)
                    }
                    .frame(minHeight: 44)
                } else {
                    ForEach(sorted) { party in
                        NavigationLink(destination: PartyDetailView(party: party)) {
                            PartyRow(
                                party: party,
                                drivingDistanceMeters: drivingDistances[party.backendId]
                            )
                        }
                    }
                }
            }
            .navigationTitle("Partys")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showCreateSheet = true }) {
                        Label("Create party", systemImage: "plus")
                    }
                    .disabled(isCreating)
                }
            }
            .sheet(isPresented: $showCreateSheet) {
                PartyFormView(mode: .create, onSave: { _ in true })
            }
        }
        .onAppear {
            fetchIfNeeded(userCoord: userCoord)
        }
        .onChange(of: locationManager.currentLocation) { _, newCoord in
            guard let newCoord else { return }
            let newLocation = CLLocation(latitude: newCoord.latitude, longitude: newCoord.longitude)

            if let last = lastFetchLocation {
                guard newLocation.distance(from: last) > 200 else { return }
            }

            fetchIfNeeded(userCoord: newCoord)
        }
        .onReceive(NotificationCenter.default.publisher(for: .partyDidUpdate)) { notification in
            let updatedPartyId = notification.object as? Int

            Task { @MainActor in
                let refreshedParties = await fetchPartiesFromBackend()
                if let updatedPartyId {
                    drivingDistances.removeValue(forKey: updatedPartyId)
                }
                fetchDrivingDistances(
                    userCoord: locationManager.currentLocation,
                    targets: refreshedParties,
                    force: false
                )
            }
        }
    }

    @MainActor
    private func fetchPartiesFromBackend() async -> [DistanceTarget] {
        guard let url = URL(string: "\(Config.backendURL)/api/parties") else { return [] }
        guard let (data, _) = try? await URLSession.shared.data(from: url) else { return [] }

        struct PartyResponse: Decodable {
            let id: Int
            let title: String
            let description: String?
            let fee: Double?
            let timeStart: String?
            let timeEnd: String?
            let website: String?
            let location: LocationResponse
            let theme: String?
            let maxPeople: Int?
            let minAge: Int?
            let maxAge: Int?
            let hostUser: HostUserResponse?
            let category: CategoryResponse?
            struct LocationResponse: Decodable {
                let latitude: Double
                let longitude: Double
                let address: String?
            }
            struct HostUserResponse: Decodable {
                let id: Int?
                let displayName: String?
            }
            struct CategoryResponse: Decodable {
                let id: Int?
                let name: String?
            }
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        guard let responses = try? decoder.decode([PartyResponse].self, from: data) else { return [] }

        let incomingIds = Set(responses.map { $0.id })
        let allExisting = (try? modelContext.fetch(FetchDescriptor<Party>())) ?? []
        for existing in allExisting where !incomingIds.contains(existing.backendId) {
            modelContext.delete(existing)
        }

        let existingById = Dictionary(
            uniqueKeysWithValues: allExisting
                .filter { incomingIds.contains($0.backendId) }
                .map { ($0.backendId, $0) }
        )

        for p in responses {
            if let existing = existingById[p.id] {
                existing.name = p.title
                existing.location = p.location.address ?? ""
                existing.latitude = p.location.latitude
                existing.longitude = p.location.longitude
                existing.partyDescription = p.description
                existing.hostUserId = p.hostUser?.id.map { Int64($0) }
                existing.hostDisplayName = p.hostUser?.displayName
                existing.timeStart = PartyDateFormatter.parseBackendDate(p.timeStart)
                existing.timeEnd = PartyDateFormatter.parseBackendDate(p.timeEnd)
                existing.maxPeople = p.maxPeople
                existing.minAge = p.minAge
                existing.maxAge = p.maxAge
                existing.website = p.website
                existing.fee = p.fee
                existing.categoryId = p.category?.id
                existing.themeName = p.theme
            } else {
                let party = Party(
                    backendId: p.id,
                    name: p.title,
                    location: p.location.address ?? "",
                    latitude: p.location.latitude,
                    longitude: p.location.longitude,
                    partyDescription: p.description,
                    hostUserId: p.hostUser?.id.map { Int64($0) },
                    timeStart: PartyDateFormatter.parseBackendDate(p.timeStart),
                    timeEnd: PartyDateFormatter.parseBackendDate(p.timeEnd),
                    maxPeople: p.maxPeople,
                    minAge: p.minAge,
                    maxAge: p.maxAge,
                    website: p.website,
                    fee: p.fee,
                    categoryId: p.category?.id,
                    themeName: p.theme,
                    hostDisplayName: p.hostUser?.displayName
                )
                modelContext.insert(party)
            }
        }
        try? modelContext.save()
        pruneDrivingDistanceCache(validPartyIds: incomingIds)

        return responses.map {
            DistanceTarget(
                id: $0.id,
                latitude: $0.location.latitude,
                longitude: $0.location.longitude
            )
        }
    }

    private func fetchIfNeeded(userCoord: CLLocationCoordinate2D?) {
        guard let userCoord else { return }

        let currentLocation = CLLocation(latitude: userCoord.latitude, longitude: userCoord.longitude)
        if let last = lastFetchLocation, currentLocation.distance(from: last) <= 200 {
            fetchDrivingDistances(userCoord: userCoord, force: false)
            return
        }

        lastFetchLocation = currentLocation
        fetchDrivingDistances(userCoord: userCoord, force: true)
    }

    private func pruneDrivingDistanceCache(validPartyIds: Set<Int>) {
        drivingDistances = drivingDistances.filter { validPartyIds.contains($0.key) }
    }

    private func fetchDrivingDistances(
        userCoord: CLLocationCoordinate2D?,
        targets: [DistanceTarget]? = nil,
        force: Bool
    ) {
        guard let userCoord else { return }

        let resolvedTargets = targets ?? parties.map {
            DistanceTarget(id: $0.backendId, latitude: $0.latitude, longitude: $0.longitude)
        }

        let targetsToFetch = resolvedTargets.filter { force || drivingDistances[$0.id] == nil }
        guard !targetsToFetch.isEmpty else { return }

        if force {
            drivingDistances.removeAll()
        }

        let userLocation = CLLocation(latitude: userCoord.latitude, longitude: userCoord.longitude)
        for target in targetsToFetch {
            let partyLocation = CLLocation(latitude: target.latitude, longitude: target.longitude)
            drivingDistances[target.id] = partyLocation.distance(from: userLocation)
        }
    }

    // MARK: – Party Row
    struct PartyRow: View {
        let party: Party
        let drivingDistanceMeters: Double?
        
        @StateObject private var notificationManager = PartyNotificationManager.shared
        @State private var now = Date()
        let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

        var distanceLabel: String? {
            guard !party.isActive else { return nil }
            guard let meters = drivingDistanceMeters else { return nil }
            if meters < 1000 {
                return String(format: "%.0f m", meters)
            } else {
                return String(format: "%.1f km", meters / 1000)
            }
        }
        
        var unreadCount: Int {
            notificationManager.unreadCount(for: party.backendId)
        }

        var body: some View {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text(party.name)
                                .font(.headline)
                                .foregroundStyle(.primary)
                            
                            if unreadCount > 0 {
                                ZStack {
                                    Circle()
                                        .fill(Color.red)
                                        .frame(width: 20, height: 20)
                                    
                                    Text("\(unreadCount)")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(.white)
                                }
                            }
                        }
                        
                        Text(party.hostDisplayName ?? "Unknown Host")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    
                    Spacer()

                    if let label = distanceLabel {
                        VStack(alignment: .trailing, spacing: 2) {
                            HStack(spacing: 2) {
                                Image(systemName: "location.fill")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                Text(label)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    } else if !party.isActive && drivingDistanceMeters == nil {
                        ProgressView()
                            .scaleEffect(0.6)
                    }
                }

                Text(party.location)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if party.isActive, let entry = party.activeEntry {
                    Text(formatDuration(entry.startTime, to: now))
                        .font(.caption)
                        .foregroundStyle(.green)
                        .fontWeight(.semibold)
                        .monospacedDigit()
                }
            }
            .frame(minHeight: 60)
            .onReceive(timer) { value in
                guard party.isActive else { return }
                now = value
            }
        }

        func formatDuration(_ start: Date, to end: Date) -> String {
            let diff = Int(end.timeIntervalSince(start))
            let h = diff / 3600
            let m = (diff % 3600) / 60
            let s = diff % 60
            return h > 0
                ? String(format: "%dh %02dm %02ds", h, m, s)
                : String(format: "%dm %02ds", m, s)
        }
    }
}
