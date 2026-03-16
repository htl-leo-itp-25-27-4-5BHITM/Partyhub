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

                if let party = activeParty {
                    ForEach(attendeeVM.locations) { user in

                        if user.partyId == party.backendId {

                            let coord = CLLocationCoordinate2D(
                                latitude: user.latitude,
                                longitude: user.longitude
                            )

                            let atParty = user.isInsideParty(party)

                            Annotation("", coordinate: coord) {
                                AttendeePin(isAtParty: atParty, isSelf: false)
                            }
                        }
                    }
                }
            }
            .ignoresSafeArea()
            .onAppear {
                locationManager.requestPermission()
                attendeeVM.startPolling()
            }
            .onDisappear {
                attendeeVM.stopPolling()
            }
        }
    }

}
