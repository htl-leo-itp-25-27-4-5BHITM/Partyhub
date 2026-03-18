import SwiftUI
import SwiftData

@main
struct PartyHubiOSApp: App {
    @State private var locationManager = LocationManager()
    let container: ModelContainer

    init() {
        do {
            let appSupport = URL.applicationSupportDirectory.appendingPathComponent("PartyHub")
            try FileManager.default.createDirectory(at: appSupport, withIntermediateDirectories: true)

            print("SwiftData storage path: \(appSupport)")

            let schema = Schema([Party.self, TimeEntry.self])
            let modelConfiguration = ModelConfiguration(
                schema: schema,
                url: appSupport.appendingPathComponent("PartyHub.sqlite"),
                allowsSave: true
            )

            container = try ModelContainer(for: schema, configurations: [modelConfiguration])

            // ← SOFORT setzen, nicht erst in setupApp()
            // So funktioniert Geo-Fencing auch wenn iOS die App im Hintergrund startet
            locationManager.modelContext = container.mainContext

        } catch {
            print("SwiftData Error: \(error)")
            fatalError("ModelContainer Fehler: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(locationManager)
                .modelContainer(container)
                .task {
                    await setupApp()
                }
        }
    }

    @MainActor
    func setupApp() async {
        let context = container.mainContext
        locationManager.modelContext = context

        await fetchAndStoreParties(context: context)

        let allParties = (try? context.fetch(FetchDescriptor<Party>())) ?? []
        print("Parties in DB:", allParties.count)

        locationManager.requestPermission()
        locationManager.registerGeofences(for: allParties)
        locationManager.checkIfAlreadyInsideRegions()
    }

    func fetchAndStoreParties(context: ModelContext) async {
        guard let url = URL(string: "\(Config.backendURL)/api/party") else { return }
        guard let (data, _) = try? await URLSession.shared.data(from: url) else { return }

        print("Fetching parties…")

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        struct PartyResponse: Codable {
            let id: Int
            let title: String
            let location: LocationResponse
            let hostUser: HostUserResponse?
            let category: CategoryResponse?
            let timeStart: String?
            let timeEnd: String?
            let maxPeople: Int?
            let minAge: Int?
            let maxAge: Int?
            let website: String?
            let description: String?
            let fee: Int?
            let createdAt: String?
        }

        struct HostUserResponse: Codable {
            let id: Int?
            let displayName: String?
        }

        struct CategoryResponse: Codable {
            let id: Int?
            let name: String?
        }

        struct LocationResponse: Codable {
            let latitude: Double
            let longitude: Double
            let address: String?
        }

        guard let parties = try? decoder.decode([PartyResponse].self, from: data) else { return }

        for p in parties {
            let descriptor = FetchDescriptor<Party>(predicate: #Predicate { $0.backendId == p.id })
            if let existing = try? context.fetch(descriptor).first {
                existing.name     = p.title
                existing.location = p.location.address ?? ""
                existing.latitude  = p.location.latitude
                existing.longitude = p.location.longitude
            } else {
                let party = Party(
                    backendId:  p.id,
                    name:       p.title,
                    location:   p.location.address ?? "",
                    latitude:   p.location.latitude,
                    longitude:  p.location.longitude
                )
                context.insert(party)
            }
        }
        try? context.save()
    }
}
