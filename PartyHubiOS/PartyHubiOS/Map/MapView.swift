//
//  MapView.swift - SCHRITT 2: Eigener Standort mit Icon
//  PartyHubiOS
//

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
        Map(position: $position) {
            if let coord = locationManager.currentLocation {
                Annotation("Du", coordinate: coord) {
                    ZStack {
                        Circle()
                            .fill(Color.primaryDarkBlue)
                            .frame(width: 46, height: 46)
                            .shadow(color: .primaryDarkBlue.opacity(0.4), radius: 8)

                        Image(systemName: "person.circle.fill")
                            .resizable()
                            .foregroundStyle(.white)
                            .frame(width: 36, height: 36)
                    }
                }
            }
        }
        .ignoresSafeArea()
        .onAppear {
            locationManager.requestPermission()
        }
    }
}
