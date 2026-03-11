import SwiftUI
import Foundation

// MARK: - Model
struct UserLocation: Codable, Identifiable {
    let id = UUID()
    let latitude: Double
    let longitude: Double

    enum CodingKeys: String, CodingKey {
        case latitude, longitude
    }
}

// MARK: - ViewModel
@Observable
class UserLocationViewModel {
    var locations: [UserLocation] = []
    var isLoading = false
    var errorMessage: String?

    func fetchLocations() {
        guard let url = URL(string: "http://localhost:8080/userLocation") else { return }
        isLoading = true

        URLSession.shared.dataTask(with: url) { data, _, error in
            DispatchQueue.main.async {
                self.isLoading = false
                if let data = data {
                    do {
                        self.locations = try JSONDecoder().decode([UserLocation].self, from: data)
                    } catch {
                        self.errorMessage = error.localizedDescription
                    }
                }
            }
        }.resume()
    }
}

// MARK: - View
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
                    }
                }
            }
            .navigationTitle("User Locations")
            .onAppear { viewModel.fetchLocations() }
            .refreshable { viewModel.fetchLocations() }
        }
    }
}
