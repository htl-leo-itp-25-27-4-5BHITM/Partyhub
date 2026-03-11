import SwiftUI
import MapKit

extension CLLocationCoordinate2D: @retroactive Equatable {
    public static func == (lhs: CLLocationCoordinate2D, rhs: CLLocationCoordinate2D) -> Bool {
        lhs.latitude == rhs.latitude && lhs.longitude == rhs.longitude
    }
}

struct MapView: View {
    var locationManager: LocationManager

    @State private var position: MapCameraPosition = .userLocation(fallback: .automatic)

    var body: some View {
        ZStack(alignment: .top) {
            Map(position: $position) {
                if let coord = locationManager.currentLocation {
                    Annotation("Du", coordinate: coord) {
                        ZStack {
                            Circle()
                                .fill(locationManager.isAtParty
                                      ? Color.green.opacity(0.25)
                                      : Color.gray.opacity(0.2))
                                .frame(width: 56, height: 56)

                            Circle()
                                .fill(locationManager.isAtParty
                                      ? Color.green
                                      : Color.gray)
                                .frame(width: 46, height: 46)
                                .shadow(color: locationManager.isAtParty
                                        ? .green.opacity(0.5)
                                        : .gray.opacity(0.4),
                                        radius: 8)

                            Image(systemName: "person.circle.fill")
                                .resizable()
                                .foregroundStyle(.white)
                                .frame(width: 36, height: 36)
                        }
                        .animation(.easeInOut(duration: 0.4), value: locationManager.isAtParty)
                    }
                }
            }
            .ignoresSafeArea()
            .onAppear {
                locationManager.requestPermission()
            }

        }
    }
}
