import Foundation
import CoreLocation
import SwiftUI
import MapKit

struct UserLocation: Codable, Identifiable {
    var id: Int64 { user?.id ?? 0 }
    let latitude: Double
    let longitude: Double
    let user: UserInfo?

    struct UserInfo: Codable {
        let id: Int64
        let displayName: String?
        let distinctName: String?
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    func isInsideParty(_ party: Party) -> Bool {
        let userCoord = CLLocation(latitude: latitude, longitude: longitude)
        let partyCoord = CLLocation(latitude: party.latitude, longitude: party.longitude)
        return userCoord.distance(from: partyCoord) <= party.radiusMeters
    }
}

@Observable
class UserLocationViewModel {
    var locations: [UserLocation] = []
    var isLoading = false
    var errorMessage: String?
    var coordinateProvider: (() -> CLLocationCoordinate2D?)?

    // The accepted spec keeps device location client-side: PartyHub does not
    // store or share attendee locations, so there is nothing to fetch or upload.
    func fetchLocations(partyId: Int64?) {
        isLoading = false
        locations = []
    }
}
