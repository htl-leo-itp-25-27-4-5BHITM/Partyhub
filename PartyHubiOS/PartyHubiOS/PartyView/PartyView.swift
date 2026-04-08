import SwiftUI
import SwiftData
import Combine
import CoreLocation
import MapKit

struct PartyView: View {
    @StateObject private var notificationManager = PartyNotificationManager.shared
    @Query var parties: [Party]
    @Environment(LocationManager.self) var locationManager
    @Environment(\.modelContext) private var modelContext

    // Cache: Party-ID → Fahrtstrecke in Metern
    @State private var drivingDistances: [Int: Double] = [:]
    // Letzter Standort bei dem Routen geladen wurden
    @State private var lastFetchLocation: CLLocation? = nil
    // Läuft gerade ein Fetch?
    @State private var isFetching = false

    // Sortierung nach Fahrtstrecke (wenn vorhanden), sonst Luftlinie
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
                        Text("Keine Partys gefunden")
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
                    Button(action: {}) {
                        Label("Party erstellen", systemImage: "plus")
                    }
                }
            }
        }
        .onAppear {
            fetchIfNeeded(userCoord: userCoord)
        }
        .onChange(of: locationManager.currentLocation) { _, newCoord in
            guard let newCoord else { return }
            let newLocation = CLLocation(latitude: newCoord.latitude, longitude: newCoord.longitude)

            // ✅ Nur neu laden wenn sich der Nutzer mehr als 200m bewegt hat
            if let last = lastFetchLocation {
                guard newLocation.distance(from: last) > 200 else { return }
            }

            fetchIfNeeded(userCoord: newCoord)
        }
    }

    // ✅ Lädt Routen nur einmal pro Standort-Änderung >200m
    private func fetchIfNeeded(userCoord: CLLocationCoordinate2D?) {
        guard let userCoord, !isFetching else { return }

        // Wenn noch kein Fetch gemacht wurde, oder Nutzer >200m bewegt hat
        let currentLocation = CLLocation(latitude: userCoord.latitude, longitude: userCoord.longitude)
        if let last = lastFetchLocation, currentLocation.distance(from: last) <= 200 {
            return
        }

        isFetching = true
        lastFetchLocation = currentLocation

        let group = DispatchGroup()

        for party in parties {
            // Bereits gecachte Distanz nicht neu laden
            if drivingDistances[party.backendId] != nil { continue }

            group.enter()
            let request = MKDirections.Request()
            request.source = MKMapItem(placemark: MKPlacemark(coordinate: userCoord))
            request.destination = MKMapItem(placemark: MKPlacemark(coordinate: party.coordinate))
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
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    HStack(spacing: 6) {
                        Text(party.name)
                            .font(.headline)
                            .foregroundStyle(.primary)
                        
                        // ===== BADGE HIER =====
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

                    Spacer()

                    if let label = distanceLabel {
                        HStack(spacing: 2) {
                            Image(systemName: "car.fill")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Text(label)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } else if !party.isActive && drivingDistanceMeters == nil {
                        // Lädt noch
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
            .frame(minHeight: 44)
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
