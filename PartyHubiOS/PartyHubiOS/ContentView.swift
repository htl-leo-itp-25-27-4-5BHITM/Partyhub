import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(LocationManager.self) private var locationManager  // ← aus App holen, NICHT neu erstellen

    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "location")
                }
            
            PartyView()
                .tabItem {
                    Label("Party", systemImage: "party.popper")
                }
            
            /*PhotoView()
                .tabItem {
                    Label("Photo", systemImage: "photo.stack")
                }
            */
            TimeTrackingView()
                .tabItem {
                    Label("Time", systemImage: "timer")
                }
             
            MapView(locationManager: locationManager)
                .tabItem {
                    Label("Map", systemImage: "map")
                }
             
            /*UserLocationListView()
                .tabItem {
                    Label("Users", systemImage: "person.2")
                }
             */
            
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person")
                }
             
        }
        .tint(.primaryPink)
        // .modelContainer(for: TimeEntry.self)
    }
}

