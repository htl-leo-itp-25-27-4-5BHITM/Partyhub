import SwiftUI
import SwiftData

struct ContentView: View {
    @State private var locationManager = LocationManager()

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
            
            PhotoView()
                .tabItem {
                    Label("Photo", systemImage: "photo.stack")
                }
            
            /*TimeTrackingView()
                .tabItem {
                    Label("Time", systemImage: "timer")
                }
             */
            MapView(locationManager: LocationManager())
                .tabItem {
                    Label("Map", systemImage: "map")
                }
            
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person")
                }
        }
        .tint(.primaryPink)
        .modelContainer(for: TimeEntry.self)
    }

}
#Preview {
    ContentView()
        .modelContainer(for: TimeEntry.self, inMemory: true)
}
