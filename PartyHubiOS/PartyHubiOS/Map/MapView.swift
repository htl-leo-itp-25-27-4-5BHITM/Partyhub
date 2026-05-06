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
    @Query var parties: [Party]
    private let highlightedPartyId: Int?
    
    private var currentUserId: Int? {
        if let userId = AuthManager.shared.userId {
            return userId
        }
        let storedId = UserDefaults.standard.integer(forKey: "partyhub_user_id")
        return storedId > 0 ? storedId : nil
    }

    init(locationManager: LocationManager, highlightedPartyId: Int? = nil) {
        self.locationManager = locationManager
        self.highlightedPartyId = highlightedPartyId
    }

    var displayedParty: Party? {
        if let highlightedPartyId {
            return parties.first(where: { $0.backendId == highlightedPartyId })
        }
        return parties.first(where: { $0.isActive }) ?? parties.first
    }

    var body: some View {
        ZStack(alignment: .top) {
            Map(position: $position) {

                if let coord = locationManager.currentLocation {
                    Annotation("Du", coordinate: coord) {
                        AttendeePin(isAtParty: locationManager.isAtParty, isSelf: true, userId: currentUserId)
                    }
                }

                ForEach(parties) { party in
                    Annotation(party.name, coordinate: party.coordinate) {
                        PartyPin(isActive: party.isActive)
                    }
                }
            }
            .ignoresSafeArea()
            .onAppear {
                locationManager.requestPermission()
                focusMap(on: displayedParty)
            }
            .onChange(of: displayedParty?.backendId) { _, _ in
                focusMap(on: displayedParty)
            }
        }
        .navigationTitle(displayedParty?.name ?? "Map")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private extension MapView {
    func focusMap(on party: Party?) {
        guard let party else { return }

        position = .region(
            MKCoordinateRegion(
                center: party.coordinate,
                latitudinalMeters: max(party.radiusMeters * 6, 600),
                longitudinalMeters: max(party.radiusMeters * 6, 600)
            )
        )
    }
}
