import SwiftUI
import SwiftData
import Combine

struct PartyView: View {
    @Query(sort: \Party.name) var localParties: [Party]
    @Environment(LocationManager.self) var locationManager
    @Environment(\.modelContext) private var modelContext
    
    @State private var apiParties: [APIParty] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showError = false
    
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
                    
                    if isLoading {
                        ProgressView("Lade Partys...")
                            .padding()
                    } else if let error = errorMessage {
                        VStack(spacing: 10) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.largeTitle)
                                .foregroundColor(.orange)
                            Text(error)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Button("Erneut versuchen") {
                                Task { await loadParties() }
                            }
                            .buttonStyle(.bordered)
                        }
                        .padding()
                    } else if apiParties.isEmpty && localParties.isEmpty {
                        ContentUnavailableView("Keine Partys", systemImage: "party.popper",
                            description: Text("Erstelle deine erste Party!"))
                    } else {
                        if !apiParties.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Parties für dich")
                                    .font(.headline)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal)
                                
                                ForEach(apiParties, id: \.id) { party in
                                    APIPartyCard(party: party)
                                }
                            }
                            .padding(.horizontal)
                        }
                        
                        if !localParties.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Lokal")
                                    .font(.headline)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal)
                                
                                ForEach(localParties) { party in
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
            .task {
                await loadParties()
            }
            .refreshable {
                await loadParties()
            }
            .alert("Fehler", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "Unbekannter Fehler")
            }
        }
    }
    
    private func loadParties() async {
        isLoading = true
        errorMessage = nil
        
        do {
            apiParties = try await PartyAPI.shared.fetchParties()
            print("[PartyView] Fetched \(apiParties.count) parties from API")
            for party in apiParties {
                print("[PartyView] Party: id=\(party.id), title=\(party.title ?? "nil"), timeStart=\(party.timeStart?.description ?? "nil"), category=\(party.category?.name ?? "nil"), location=\(party.location?.address ?? "nil")")
            }
        } catch {
            print("[PartyView] Error fetching parties: \(error)")
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
        print("[PartyView] loadParties done, apiParties count: \(apiParties.count)")
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

struct APIPartyCard: View {
    let party: APIParty
    @State private var now = Date()
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        print("[APIPartyCard] Rendering party: \(party.title ?? "nil")")
        return HStack {
            VStack(alignment: .leading, spacing: 5) {
                Text(party.title ?? "Unbenannte Party")
                    .font(.headline)
                    .foregroundColor(.primaryDarkBlue)
                Text(party.location?.address ?? "Kein Ort")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if let start = party.timeStart {
                    Text(start, style: .date)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if let category = party.category {
                    Text(category.name)
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.primaryPink.opacity(0.2))
                        .foregroundColor(.primaryPink)
                        .clipShape(Capsule())
                }
            }
            Spacer()
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
}
