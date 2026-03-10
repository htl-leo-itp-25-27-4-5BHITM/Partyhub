import SwiftUI
import CoreLocation

struct HomeView: View {
    @State private var location: CLLocation?
    private let manager = CLLocationManager()
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Mein Standort")
                .font(.title.bold())
            
            if let loc = location {
                Text("Latitude: \(loc.coordinate.latitude, specifier: "%.6f")")
                    .font(.system(.body, design: .monospaced))
                Text("Longitude: \(loc.coordinate.longitude, specifier: "%.6f")")
                    .font(.system(.body, design: .monospaced))
                Text("Genauigkeit: \(Int(loc.horizontalAccuracy))m")
                    .foregroundColor(.secondary)
            } else {
                Text("Standort wird ermittelt...")
                    .foregroundColor(.secondary)
            }
        }
        .onAppear {
            LocationDisplayHelper.shared.onUpdate = { loc in
                self.location = loc
            }
            LocationDisplayHelper.shared.start()
        }
    }

}
