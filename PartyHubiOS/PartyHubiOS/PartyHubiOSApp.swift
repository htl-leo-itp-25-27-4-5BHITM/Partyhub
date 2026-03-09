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
        
        let descriptor = FetchDescriptor<Party>()
        let existing = (try? context.fetch(descriptor)) ?? []
        
        if existing.isEmpty {
            let schule = Party(
                name: "HTL Leonding",
                location: "Schule, Leonding",
                latitude: 48.2684159,
                longitude: 14.2517532,
                radiusMeters: 80
            )
            let meineParty = Party(
                name: "Meine Party",
                location: "Mein Ort",
                latitude: 48.123327,
                longitude: 14.022701,
                radiusMeters: 50  
            )
            context.insert(schule)
            context.insert(meineParty)
            try? context.save()
        }
        
        let allParties = (try? context.fetch(descriptor)) ?? []
        locationManager.requestPermission()
        locationManager.registerGeofences(for: allParties)
        locationManager.checkIfAlreadyInsideRegions()
    }
}
