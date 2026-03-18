import SwiftUI
import SwiftData
import Combine
import CoreLocation

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
            
                // MARK: – Party Rows (keine Section, kein Header)
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
                            PartyRow(party: party)
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
        @State private var now = Date()
        let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

        var body: some View {
            VStack(alignment: .leading, spacing: 2) {
                Text(party.name)
                    .font(.headline)
                    .foregroundStyle(.primary)

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
