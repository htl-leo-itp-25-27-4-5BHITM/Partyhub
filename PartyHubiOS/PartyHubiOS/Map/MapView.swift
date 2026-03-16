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
    @State private var attendeeVM = UserLocationViewModel()
    @Query var parties: [Party]

    var activeParty: Party? {
        parties.first(where: { $0.isActive }) ?? parties.first
    }

    var body: some View {
        ZStack(alignment: .top) {
            Map(position: $position) {

                // — Your own pin —
                if let coord = locationManager.currentLocation {
                    Annotation("Du", coordinate: coord) {
                        AttendeePin(isAtParty: locationManager.isAtParty, isSelf: true)
                            .animation(.easeInOut(duration: 0.4), value: locationManager.isAtParty)
                    }
                }

                // — Party location pins —
                ForEach(parties) { party in
                    Annotation(party.name, coordinate: party.coordinate) {
                        PartyPin(isActive: party.isActive)
                    }
                }

                // — Other attendees —
                if let party = activeParty {
                    ForEach(attendeeVM.locations) { user in
                        let coord = CLLocationCoordinate2D(
                            latitude: user.latitude,
                            longitude: user.longitude
                        )
                        let atParty = user.isInsideParty(party)
                        Annotation("", coordinate: coord) {
                            AttendeePin(isAtParty: atParty, isSelf: false)
                        }
                    }
                }
            }
            .ignoresSafeArea()
            .onAppear {
                locationManager.requestPermission()
                attendeeVM.startPolling()
            }
            .onDisappear {
                attendeeVM.stopPolling()
            }
        }
    }
}

// MARK: - Party Pin
private struct PartyPin: View {
    let isActive: Bool

    var body: some View {
        ZStack {
            Circle()
                .fill(isActive ? Color.green.opacity(0.2) : Color.blue.opacity(0.2))
                .frame(width: 52, height: 52)
            Circle()
                .fill(isActive ? Color.green : Color.blue)
                .frame(width: 42, height: 42)
                .shadow(color: (isActive ? Color.green : Color.blue).opacity(0.5), radius: 8)
            Image(systemName: "party.popper.fill")
                .resizable()
                .foregroundStyle(.white)
                .frame(width: 22, height: 22)
        }
    }
}

// MARK: - Attendee Pin
private struct AttendeePin: View {
    let isAtParty: Bool
    let isSelf: Bool

    private var color: Color { isAtParty ? .green : .gray }
    private var icon: String { isSelf ? "person.circle.fill" : "person.fill" }
    private var iconSize: CGFloat { isSelf ? 36 : 26 }

    var body: some View {
        ZStack {
            Circle()
                .fill(color.opacity(0.25))
                .frame(width: 56, height: 56)
            Circle()
                .fill(color)
                .frame(width: 46, height: 46)
                .shadow(color: color.opacity(0.5), radius: 8)
            Image(systemName: icon)
                .resizable()
                .foregroundStyle(.white)
                .frame(width: iconSize, height: iconSize)
        }
    }
}
