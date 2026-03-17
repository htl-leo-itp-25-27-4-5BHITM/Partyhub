import SwiftUI
import MapKit
import SwiftData

extension CLLocationCoordinate2D: @retroactive Equatable {
    public static func == (lhs: CLLocationCoordinate2D, rhs: CLLocationCoordinate2D) -> Bool {
        lhs.latitude == rhs.latitude && lhs.longitude == rhs.longitude
    }
}

struct MapView: View {
    var locationManager: LocationManager

    @State private var position: MapCameraPosition = .userLocation(fallback: .automatic)
    @State private var attendeeVM = UserLocationViewModel()
    @Query var parties: [Party]

    var activeParty: Party? {
        parties.first(where: { $0.isActive }) ?? parties.first
    }

    var body: some View {
        ZStack(alignment: .top) {
            Map(position: $position) {

                if let coord = locationManager.currentLocation {
                    Annotation("Du", coordinate: coord) {
                        AttendeePin(isAtParty: locationManager.isAtParty, isSelf: true)
                    }
                }

                ForEach(parties) { party in
                    Annotation(party.name, coordinate: party.coordinate) {
                        PartyPin(isActive: party.isActive)
                    }
                }

                ForEach(attendeeVM.locations) { user in
                    let coord = CLLocationCoordinate2D(
                        latitude: user.latitude,
                        longitude: user.longitude
                    )

                    if let activeParty = activeParty {
                        let atParty = user.isInsideParty(activeParty)

                        Annotation(user.user?.displayName ?? user.user?.distinctName ?? "User", coordinate: coord) {
                            AttendeePin(isAtParty: atParty, isSelf: false)
                        }
                    }
                }
            }
            .ignoresSafeArea()
            .onAppear {
                locationManager.requestPermission()
                if let party = activeParty {
                    attendeeVM.startPolling(partyId: Int64(party.backendId))
                    if let userId = UserDefaults.standard.object(forKey: "currentUserId") as? Int64 {
                        attendeeVM.startUploading(userId: userId)
                    }
                }
            }
            .onChange(of: activeParty) { _, newParty in
                attendeeVM.stopPolling()
                attendeeVM.stopUploading()
                if let party = newParty {
                    attendeeVM.startPolling(partyId: Int64(party.backendId))
                    if let userId = UserDefaults.standard.object(forKey: "currentUserId") as? Int64 {
                        attendeeVM.startUploading(userId: userId)
                    }
                }
            }
            .onDisappear {
                attendeeVM.stopPolling()
                attendeeVM.stopUploading()
            }
        }
    }

}
