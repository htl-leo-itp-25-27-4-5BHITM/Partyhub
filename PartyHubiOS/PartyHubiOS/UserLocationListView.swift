import Foundation
import CoreLocation
import SwiftUI


import Foundation
import CoreLocation

struct UserLocation: Codable, Identifiable {
    let id: Int
    let latitude: Double
    let longitude: Double
    let partyId: Int

    func isInsideParty(_ party: Party) -> Bool {
        let userCoord = CLLocation(latitude: latitude, longitude: longitude)
        let partyCoord = CLLocation(latitude: party.latitude, longitude: party.longitude)
        return userCoord.distance(from: partyCoord) <= party.radiusMeters
    }
}

import Foundation

@Observable
class UserLocationViewModel {
    var locations: [UserLocation] = []
    var isLoading = false
    var errorMessage: String?
    private var pollingTimer: Timer?

    func startPolling() {
        fetchLocations()
        pollingTimer = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { _ in
            self.fetchLocations()
        }
    }

    func stopPolling() {
        pollingTimer?.invalidate()
        pollingTimer = nil
    }

    func fetchLocations() {
        guard let url = URL(string: "\(Config.backendURL)/api/userLocation") else { return }
        isLoading = true

        URLSession.shared.dataTask(with: url) { data, _, error in
            DispatchQueue.main.async {
                self.isLoading = false

                if let error = error {
                    self.errorMessage = error.localizedDescription
                    return
                }

                guard let data = data else { return }

                do {
                    self.locations = try JSONDecoder().decode([UserLocation].self, from: data)
                } catch {
                    self.errorMessage = error.localizedDescription
                }
            }
        }.resume()
    }
}

import SwiftUI

struct UserLocationListView: View {
    @State private var viewModel = UserLocationViewModel()

    var body: some View {
        NavigationStack {
            List(viewModel.locations) { location in
                HStack {
                    Image(systemName: "location.fill").foregroundStyle(.blue)
                    VStack(alignment: .leading) {
                        Text("Lat: \(location.latitude, specifier: "%.6f")")
                        Text("Lon: \(location.longitude, specifier: "%.6f")")
                            .foregroundStyle(.secondary)
                        Text("Party ID: \(location.partyId)")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("User Locations")
            .onAppear { viewModel.fetchLocations() }
            .refreshable { viewModel.fetchLocations() }
        }
    }
}
