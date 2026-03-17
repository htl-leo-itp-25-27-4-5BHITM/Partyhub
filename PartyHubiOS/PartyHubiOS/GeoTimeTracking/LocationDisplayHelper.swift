//empty
import CoreLocation

class LocationDisplayHelper: NSObject, CLLocationManagerDelegate {
    static let shared = LocationDisplayHelper()
    private let manager = CLLocationManager()
    var onUpdate: ((CLLocation) -> Void)?
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.allowsBackgroundLocationUpdates = true
        manager.pausesLocationUpdatesAutomatically = false
    }
    
    func start() {
        manager.startUpdatingLocation()
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        DispatchQueue.main.async {
            self.onUpdate?(loc)
        }
    }
}
