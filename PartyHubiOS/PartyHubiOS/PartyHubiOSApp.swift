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
        
        let allParties = (try? context.fetch(descriptor)) ?? []
        locationManager.requestPermission()
        locationManager.registerGeofences(for: allParties)
        locationManager.checkIfAlreadyInsideRegions()
    }
}
