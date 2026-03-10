import Foundation
import CoreLocation
import SwiftData

@Observable
class LocationManager: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    var authorizationStatus: CLAuthorizationStatus = .notDetermined
    var lastEvent: String = ""
    var currentLocation: CLLocationCoordinate2D?
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last?.coordinate
    }

    
    var modelContext: ModelContext?
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }
    
    func requestPermission() {
        manager.requestAlwaysAuthorization()
    }
    
    func registerGeofences(for parties: [Party]) {
        for region in manager.monitoredRegions {
            manager.stopMonitoring(for: region)
        }
        for party in parties {
            manager.startMonitoring(for: party.region)
            print("Geofence registriert: \(party.name) lat:\(party.latitude) lon:\(party.longitude) radius:\(party.radiusMeters)m")
        }
        print("Gesamt monitored regions: \(manager.monitoredRegions.count)")
    }
    
    func checkIfAlreadyInsideRegions() {
        guard let context = modelContext else { return }
        let descriptor = FetchDescriptor<Party>()
        guard let parties = try? context.fetch(descriptor) else { return }
        for party in parties {
            manager.requestState(for: party.region)
        }
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        if manager.authorizationStatus == .authorizedAlways ||
           manager.authorizationStatus == .authorizedWhenInUse {
            manager.startUpdatingLocation()
        }
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
        print("State für Region: \(region.identifier) → \(state == .inside ? "INSIDE" : state == .outside ? "OUTSIDE" : "UNKNOWN")")
        if state == .inside {
            handleRegionEvent(region: region, isEntry: true, context: context)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
        print("Geofencing Fehler: \(error.localizedDescription)")
    }
    
    private func handleRegionEvent(region: CLRegion, isEntry: Bool, context: ModelContext) {
        let regionId = region.identifier
        
        let descriptor = FetchDescriptor<Party>()
        guard let parties = try? context.fetch(descriptor) else { return }
        guard let party = parties.first(where: { $0.region.identifier == regionId }) else { return }
        
       DispatchQueue.main.async {
            if isEntry {
                guard party.activeEntry == nil else { return }
                let entry = TimeEntry(locationIdentifier: party.name)
                party.timeEntries.append(entry)
                context.insert(entry)
                self.lastEvent = "Betreten: \(party.name)"
                print("ENTRY: \(party.name)")
            } else {
                if let active = party.activeEntry {
                    active.endTime = .now
                    self.lastEvent = "Verlassen: \(party.name)"
                    print("EXIT: \(party.name)")
                }
            }
            try? context.save()
        }
        
    }



}
