import SwiftUI
import SwiftData

@main
struct PartyHubiOSApp: App {
    @State private var locationManager = LocationManager()
    let container: ModelContainer

    init() {
        do {
            container = try ModelContainer(for: Party.self, TimeEntry.self)
        } catch {
            fatalError("ModelContainer Fehler: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(locationManager)
                .modelContainer(container)
                .onAppear { setupApp() }
        }
    }

    @MainActor
    func setupApp() {
        let context = container.mainContext
        locationManager.modelContext = context

        Task {
            await fetchAndStoreParties(context: context)
            let allParties = (try? context.fetch(FetchDescriptor<Party>())) ?? []
            locationManager.requestPermission()
            locationManager.registerGeofences(for: allParties)
            locationManager.checkIfAlreadyInsideRegions()
        }
    }

    func fetchAndStoreParties(context: ModelContext) async {
        guard let url = URL(string: "\(Config.backendURL)/api/party") else { return }
        guard let (data, _) = try? await URLSession.shared.data(from: url) else { return }

        struct PartyResponse: Codable {
            let id: Int
            let title: String
            let location: LocationResponse
        }
        struct LocationResponse: Codable {
            let latitude: Double
            let longitude: Double
            let address: String
        }

        guard let decoded = try? JSONDecoder().decode([PartyResponse].self, from: data) else { return }

        let existing = (try? context.fetch(FetchDescriptor<Party>())) ?? []
        for party in existing { context.delete(party) }

        for p in decoded {
            let party = Party(
                name: p.title,
                location: p.location.address,
                latitude: p.location.latitude,
                longitude: p.location.longitude,
                radiusMeters: 100
            )
            context.insert(party)
        }
        try? context.save()
    }
}
