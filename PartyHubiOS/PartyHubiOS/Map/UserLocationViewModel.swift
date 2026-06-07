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
    private var cachedLocation: CLLocationCoordinate2D?

    private var lastFetchedPartyId: Int64?

    func fetchLocations(partyId: Int64?) {
        guard let partyId = partyId else { return }
        guard partyId != lastFetchedPartyId || locations.isEmpty else { return }
        lastFetchedPartyId = partyId

        guard let url = URL(string: "\(Config.backendURL)/api/parties/\(partyId)/locations") else { return }

        isLoading = true
        URLSession.shared.dataTask(with: url) { [weak self] data, _, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                guard let data = data else { return }
                do {
                    self?.locations = try JSONDecoder().decode([UserLocation].self, from: data)
                } catch {
                    self?.errorMessage = error.localizedDescription
                }
            }
        }.resume()
    }

    func uploadUserLocation(userId: Int64) {
        guard let url = URL(string: "\(Config.backendURL)/api/users/location") else { return }
        guard let deviceLocation = getCurrentDeviceLocation() else { return }

        let body: [String: Any] = [
            "latitude": deviceLocation.latitude,
            "longitude": deviceLocation.longitude
        ]
        guard let jsonData = try? JSONSerialization.data(withJSONObject: body) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.httpBody = jsonData
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        Task { @MainActor in
            do {
                let token = try await KeycloakAuthService.shared.validAccessToken()
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
            } catch {
                print("uploadUserLocation: no auth token: \(error.localizedDescription)")
            }
        }
    }

    private func getCurrentDeviceLocation() -> CLLocationCoordinate2D? {
        if let providedLocation = coordinateProvider?() {
            cachedLocation = providedLocation
            return providedLocation
        }
        if let location = cachedLocation { return location }
        let manager = CLLocationManager()
        manager.requestWhenInUseAuthorization()
        if let location = manager.location {
            cachedLocation = location.coordinate
            return location.coordinate
        }
        return nil
    }
}
