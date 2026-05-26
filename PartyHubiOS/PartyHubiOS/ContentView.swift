import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(LocationManager.self) private var locationManager
    @State private var selectedParty: Party?
    @Query private var parties: [Party]

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

            MapView(locationManager: locationManager)
                .tabItem {
                    Label("Map", systemImage: "map")
                }

            TimeTrackingView()
                .tabItem {
                    Label("Time Tracking", systemImage: "timer")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person")
                }
        }
        .tint(Color("primary pink"))
        .tabBarMinimizeBehavior(.onScrollDown)
        .onReceive(NotificationCenter.default.publisher(for: .showPartyDetail)) { notification in
            if let partyId = notification.object as? Int {
                selectedParty = parties.first(where: { $0.backendId == partyId })
            }
        }
        .sheet(item: $selectedParty) { party in
            NavigationStack {
                PartyDetailView(party: party)
            }
        }
    }
}
