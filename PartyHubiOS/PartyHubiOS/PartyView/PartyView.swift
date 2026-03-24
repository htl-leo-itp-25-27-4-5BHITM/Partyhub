import SwiftUI
import SwiftData
import Combine
import CoreLocation
import MapKit

struct PartyView: View {
    @Query var parties: [Party]
    @Environment(LocationManager.self) var locationManager
    @Environment(\.modelContext) private var modelContext

    var sortedParties: [Party] {
        guard let userCoord = locationManager.currentLocation else {
            return parties
        }
        let userLocation = CLLocation(latitude: userCoord.latitude, longitude: userCoord.longitude)
        return parties.sorted {
            let locA = CLLocation(latitude: $0.latitude, longitude: $0.longitude)
            let locB = CLLocation(latitude: $1.latitude, longitude: $1.longitude)
            return locA.distance(from: userLocation) < locB.distance(from: userLocation)
        }
    }

    var body: some View {
        NavigationStack {
            List {
                if sortedParties.isEmpty {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text("Keine Partys gefunden")
                            .foregroundStyle(.secondary)
                    }
                    .frame(minHeight: 44)
                } else {
                    ForEach(sortedParties) { party in
                        NavigationLink(destination: PartyDetailView(party: party)) {
                            PartyRow(party: party, userLocation: locationManager.currentLocation)
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
    }

    // MARK: – Party Row
    struct PartyRow: View {
        let party: Party
        let userLocation: CLLocationCoordinate2D?
        @State private var now = Date()
        @State private var drivingDistance: String? = nil
        @State private var lastFetchedLocation: CLLocation? = nil  // NEU: letzter Standort beim Fetch
        let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

        var body: some View {
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(party.name)
                        .font(.headline)
                        .foregroundStyle(.primary)

                    Spacer()

                    // Distanz nur anzeigen wenn NICHT gerade auf der Party
                    if !party.isActive, let distance = drivingDistance {
                        HStack(spacing: 2) {
                            Image(systemName: "car.fill")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Text(distance)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
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
            .onAppear {
                fetchDrivingDistance()
            }
            .onChange(of: userLocation) { _, newLocation in
                guard let newCoord = newLocation else { return }
                let newCLLocation = CLLocation(latitude: newCoord.latitude, longitude: newCoord.longitude)

                // NEU: nur neu laden wenn mehr als 50m bewegt
                if let last = lastFetchedLocation {
                    if newCLLocation.distance(from: last) > 50 {
                        fetchDrivingDistance()
                    }
                }
            }
        }

        private func fetchDrivingDistance() {
            guard let userCoord = userLocation else { return }

            // letzten Fetch-Standort speichern
            lastFetchedLocation = CLLocation(latitude: userCoord.latitude, longitude: userCoord.longitude)

            let request = MKDirections.Request()
            request.source = MKMapItem(placemark: MKPlacemark(coordinate: userCoord))
            request.destination = MKMapItem(placemark: MKPlacemark(coordinate: party.coordinate))
            request.transportType = .automobile

            let directions = MKDirections(request: request)
            directions.calculateETA { response, error in
                DispatchQueue.main.async {
                    if let distance = response?.distance {
                        if distance < 1000 {
                            drivingDistance = String(format: "%.0f m", distance)
                        } else {
                            drivingDistance = String(format: "%.1f km", distance / 1000)
                        }
                    }
                }
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
