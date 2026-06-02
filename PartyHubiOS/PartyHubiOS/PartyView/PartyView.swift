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
    @State private var isFetching = false
    @State private var isCreating = false
    @State private var showCreateSheet = false

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
                    HStack {
                        Button(action: { showCreateSheet = true }) {
                            Label("Create party", systemImage: "plus")
                        }
                        .disabled(isCreating)

                        Button("Quick") {
                            Task { await quickCreateDebug() }
                        }
                        .disabled(isCreating)
                    }
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
    }

    private func fetchIfNeeded(userCoord: CLLocationCoordinate2D?) {
        guard let userCoord, !isFetching else { return }

        let currentLocation = CLLocation(latitude: userCoord.latitude, longitude: userCoord.longitude)
        if let last = lastFetchLocation, currentLocation.distance(from: last) <= 200 {
            return
        }

        isFetching = true
        lastFetchLocation = currentLocation

        let group = DispatchGroup()

        for party in parties {
            if drivingDistances[party.backendId] != nil { continue }

            group.enter()
            let request = MKDirections.Request()
            request.source = MKMapItem(location: CLLocation(latitude: userCoord.latitude, longitude: userCoord.longitude), address: nil)
            request.destination = MKMapItem(location: CLLocation(latitude: party.latitude, longitude: party.longitude), address: nil)
            request.transportType = .automobile

            MKDirections(request: request).calculate { response, _ in
                DispatchQueue.main.async {
                    if let distance = response?.routes.first?.distance {
                        drivingDistances[party.backendId] = distance
                    }
                    group.leave()
                }
            }
        }

        group.notify(queue: .main) {
            isFetching = false
        }
    }

    @MainActor
    private func quickCreateDebug() async {
        isCreating = true
        defer { isCreating = false }

        do {
            let body: [String: Any] = [
                "title": "Debug Party",
                "description": "created from quick button",
                "fee": 0,
                "time_start": "2026-06-02T18:00:00",
                "time_end": "2026-06-02T23:00:00",
                "website": "",
                "latitude": 48.2082,
                "longitude": 16.3738,
                "location_address": "Debug Location",
                "theme": "Standard",
                "visibility": "public",
                "selectedUsers": [String](),
            ]

            let jsonData = try JSONSerialization.data(withJSONObject: body)
            print("[QUICK] body: \(String(data: jsonData, encoding: .utf8) ?? "nil")")

            var request = URLRequest(url: URL(string: "\(Config.backendURL)/api/parties")!)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("\(AuthManager.shared.userId ?? 1)", forHTTPHeaderField: "X-User-Id")
            request.httpBody = jsonData

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                print("[QUICK] response not HTTP")
                return
            }
            print("[QUICK] status: \(httpResponse.statusCode)")

            if (200...299).contains(httpResponse.statusCode) {
                NotificationCenter.default.post(name: .partyDidUpdate, object: nil)
            } else {
                let msg = String(data: data, encoding: .utf8) ?? "nil"
                print("[QUICK] error body: \(msg)")
            }

        } catch {
            print("[QUICK] error: \(error)")
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
                                Image(systemName: "car.fill")
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
            .onReceive(timer) { now = $0 }
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


               
