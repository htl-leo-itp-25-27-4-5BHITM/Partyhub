import Foundation

struct UserLocation: Codable {
    let latitude: Double
    let longitude: Double
}

func fetchLocations() {
    guard let url = URL(string: "https://it220274.cloud.htl-leonding.ac.at/user") else { return }

    URLSession.shared.dataTask(with: url) { data, response, error in
        
        if let data = data {
            do {
                let locations = try JSONDecoder().decode([UserLocation].self, from: data)
                print(locations)
            } catch {
                print(error)
            }
        }
        
    }.resume()
}
