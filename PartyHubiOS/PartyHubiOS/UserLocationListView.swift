import Foundation
import CoreLocation
import SwiftUI

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
    private var pollingTimer: Timer?
    private var uploadTimer: Timer?

    func startPolling(partyId: Int64?) {
        fetchLocations(partyId: partyId)
        pollingTimer = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in
            self?.fetchLocations(partyId: partyId)
        }
    }

    func startUploading(userId: Int64) {
        uploadUserLocation(userId: userId)
        uploadTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.uploadUserLocation(userId: userId)
        }
    }

    func stopPolling() {
        pollingTimer?.invalidate()
        pollingTimer = nil
    }

    func stopUploading() {
        uploadTimer?.invalidate()
        uploadTimer = nil
    }

    func fetchLocations(partyId: Int64?) {
        guard let partyId = partyId else { return }
        guard let url = URL(string: "\(Config.backendURL)/api/userLocation/party/\(partyId)") else { return }
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
        guard let url = URL(string: "\(Config.backendURL)/api/userLocation"),
              let deviceLocation = getCurrentDeviceLocation() else { return }

        let body: [String: Any] = [
            "userId": userId,
            "latitude": deviceLocation.latitude,
            "longitude": deviceLocation.longitude
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: body) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = jsonData
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            if let error = error {
                print("Error uploading location: \(error.localizedDescription)")
                return
            }
            if let httpResponse = response as? HTTPURLResponse {
                print("Location upload status: \(httpResponse.statusCode)")
            }
        }.resume()
    }

    private var cachedLocation: CLLocationCoordinate2D?

    private func getCurrentDeviceLocation() -> CLLocationCoordinate2D? {
        if let location = cachedLocation {
            return location
        }

        let manager = CLLocationManager()
        manager.requestWhenInUseAuthorization()
        if let location = manager.location {
            cachedLocation = location.coordinate
            return location.coordinate
        }
        return nil
    }
}

import SwiftUI

struct UserLocationListView: View {
    @State private var viewModel = UserLocationViewModel()
    @Query var parties: [Party]
    
    var activeParty: Party? {
        parties.first(where: { $0.isActive }) ?? parties.first
    }

    var body: some View {
        NavigationStack {
            List(viewModel.locations) { location in
                HStack {
                    Image(systemName: "location.fill").foregroundStyle(.blue)
                    VStack(alignment: .leading) {
                        Text(location.user?.displayName ?? location.user?.distinctName ?? "User")
                            .font(.headline)
                        Text("Lat: \(location.latitude, specifier: "%.6f")")
                        Text("Lon: \(location.longitude, specifier: "%.6f")")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("User Locations")
            .onAppear { 
                if let party = activeParty {
                    viewModel.fetchLocations(partyId: Int64(party.backendId))
                }
            }
            .refreshable { 
                if let party = activeParty {
                    viewModel.fetchLocations(partyId: Int64(party.backendId))
                }
            }
        }
    }
}
