import SwiftUI
import SwiftData
import Combine

struct PartyView: View {
    @Query(sort: \Party.name) var parties: [Party]
    @Environment(LocationManager.self) var locationManager
    @Environment(\.modelContext) private var modelContext
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 30) {
                    VStack(spacing: 15) {
                        Text("ALL PARTIES")
                            .font(.system(size: 55, weight: .black))
                            .foregroundColor(Color.primaryDarkBlue)
                        
                        Button(action: {}) {
                            HStack {
                                Text("Create New Party")
                                Image(systemName: "plus")
                            }
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.vertical, 12)
                            .padding(.horizontal, 25)
                            .background(Color.primaryDarkBlue)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .shadow(color: .primaryDarkBlue.opacity(0.5), radius: 10)
                        }
                    }
                    .padding(.top, 40)
                    
                    if !locationManager.lastEvent.isEmpty {
                        Text(locationManager.lastEvent)
                            .padding(10)
                            .background(Color.green.opacity(0.15))
                            .cornerRadius(10)
                            .padding(.horizontal)
                    }
                    
                    if parties.isEmpty {
                        ContentUnavailableView("Keine Partys", systemImage: "party.popper",
                            description: Text("Erstelle deine erste Party!"))
                    } else {
                        VStack(spacing: 15) {
                            ForEach(parties) { party in
                                NavigationLink(destination: PartyDetailView(party: party)) {
                                    PartyCard(party: party)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
        }
    }
    
    struct PartyCard: View {
        let party: Party
        @State private var now = Date()
        let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
        
        var body: some View {
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    Text(party.name)
                        .font(.headline)
                        .foregroundColor(.primaryDarkBlue)
                    HStack(spacing: 4) {
                        Text(party.location)
                    }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    
                    if party.isActive, let entry = party.activeEntry {
                        Text(formatDuration(entry.startTime, to: now))
                            .font(.caption)
                            .foregroundColor(.green)
                            .fontWeight(.bold)
                            .monospacedDigit()
                    }
                }
                Spacer()
                if party.isActive {
                    Circle().fill(Color.green).frame(width: 10, height: 10)
                }
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.gray)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(15)
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
            .onReceive(timer) { now = $0 }
        }
        
        func formatDuration(_ start: Date, to end: Date) -> String {
            let diff = Int(end.timeIntervalSince(start))
            let h = diff / 3600; let m = (diff % 3600) / 60; let s = diff % 60
            return h > 0 ? String(format: "%dh %02dm %02ds", h, m, s) : String(format: "%dm %02ds", m, s)
        }
    }
}
