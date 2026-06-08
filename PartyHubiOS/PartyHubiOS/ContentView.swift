import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(LocationManager.self) private var locationManager
    @State private var selectedTab = 0
    @State private var selectedParty: Party?
    @Query private var parties: [Party]

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "location")
                }
                .tag(0)

            PartyView()
                .tabItem {
                    Label("Party", systemImage: "party.popper")
                }
                .tag(1)

            NavigationStack {
                MapView(locationManager: locationManager)
            }
            .tabItem {
                Label("Map", systemImage: "map")
            }
            .tag(2)

            TimeTrackingView()
                .tabItem {
                    Label("Time Tracking", systemImage: "timer")
                }
            .tag(3)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person")
                }
                .tag(4)
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
