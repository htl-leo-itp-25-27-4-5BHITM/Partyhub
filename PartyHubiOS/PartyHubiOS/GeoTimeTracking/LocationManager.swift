import Foundation
import CoreLocation
import SwiftData

@Observable
class LocationManager: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()

    var authorizationStatus: CLAuthorizationStatus = .notDetermined
    var lastEvent: String = ""
    var currentLocation: CLLocationCoordinate2D?

    var modelContext: ModelContext?

    var isAtParty: Bool {
        guard let context = modelContext else { return false }
        let descriptor = FetchDescriptor<Party>()
        let parties = (try? context.fetch(descriptor)) ?? []
        return parties.contains { $0.isActive }
    }

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.allowsBackgroundLocationUpdates = true
        manager.pausesLocationUpdatesAutomatically = false
    }

    func requestPermission() {
        manager.requestAlwaysAuthorization()
    }

    func ensureLocationUpdates() {
        if manager.authorizationStatus == .authorizedAlways ||
           manager.authorizationStatus == .authorizedWhenInUse {
            manager.startUpdatingLocation()
        }
    }

    func registerGeofences(for parties: [Party]) {
        for region in manager.monitoredRegions {
            manager.stopMonitoring(for: region)
        }
        for party in parties {
            manager.startMonitoring(for: party.region)
            print("Geofence registriert: \(party.name) lat:\(party.latitude) lon:\(party.longitude) radius:\(party.radiusMeters)m")
        }
        print("Total monitored regions: \(manager.monitoredRegions.count)")
    }

    func checkIfAlreadyInsideRegions() {
        guard let context = modelContext else { return }
        let descriptor = FetchDescriptor<Party>()
        guard let parties = try? context.fetch(descriptor) else { return }
        for party in parties {
            manager.requestState(for: party.region)
        }
    }

    func refreshMonitoringAndAttendance(for party: Party) {
        let identifier = party.backendId.description

        for region in manager.monitoredRegions where region.identifier == identifier {
            manager.stopMonitoring(for: region)
        }

        let updatedRegion = party.region
        manager.startMonitoring(for: updatedRegion)
        manager.requestState(for: updatedRegion)

        refreshAttendance(for: party)
        print("Geofence aktualisiert: \(party.name) lat:\(party.latitude) lon:\(party.longitude) radius:\(party.radiusMeters)m")
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        if manager.authorizationStatus == .authorizedAlways ||
           manager.authorizationStatus == .authorizedWhenInUse {
            manager.startUpdatingLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last?.coordinate
    }

    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        guard let context = modelContext else { return }
        handleRegionEvent(region: region, isEntry: true, context: context)
    }

    func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        guard let context = modelContext else { return }
        handleRegionEvent(region: region, isEntry: false, context: context)
    }

    func locationManager(_ manager: CLLocationManager, didDetermineState state: CLRegionState, for region: CLRegion) {
        guard let context = modelContext else { return }
        print("State for Region: \(region.identifier)")
        if state == .inside {
            handleRegionEvent(region: region, isEntry: true, context: context)
        } else if state == .outside {
            handleRegionEvent(region: region, isEntry: false, context: context)
        }
    }

    func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
        print("Geofencing Error: \(error.localizedDescription)")
    }

    private func handleRegionEvent(region: CLRegion, isEntry: Bool, context: ModelContext) {
        let regionId = region.identifier
        let descriptor = FetchDescriptor<Party>()
        guard let parties = try? context.fetch(descriptor) else { return }
        guard let party = parties.first(where: { $0.region.identifier == regionId }) else { return }

        DispatchQueue.main.async {
            self.updateAttendance(for: party, isInside: isEntry, context: context)
        }
    }

    private func refreshAttendance(for party: Party) {
        guard let context = modelContext else { return }

        guard let currentLocation else {
            ensureLocationUpdates()
            manager.requestState(for: party.region)
            return
        }

        let userLocation = CLLocation(
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
        )
        let partyLocation = CLLocation(
            latitude: party.latitude,
            longitude: party.longitude
        )
        let isInside = userLocation.distance(from: partyLocation) <= party.radiusMeters

        updateAttendance(for: party, isInside: isInside, context: context)
    }

    private func updateAttendance(for party: Party, isInside: Bool, context: ModelContext) {
        if isInside {
            guard party.activeEntry == nil else { return }
            let entry = TimeEntry(locationIdentifier: party.name)
            party.timeEntries.append(entry)
            context.insert(entry)
            lastEvent = "Enter: \(party.name)"
            print("ENTRY: \(party.name)")
        } else {
            guard let active = party.activeEntry else { return }
            active.endTime = .now
            lastEvent = "Exit: \(party.name)"
            print("EXIT: \(party.name)")
        }

        try? context.save()
    }
}
