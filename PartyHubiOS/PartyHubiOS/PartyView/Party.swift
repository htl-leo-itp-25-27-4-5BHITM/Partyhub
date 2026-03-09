import Foundation
import SwiftData
import CoreLocation

@Model
class Party {
    var name: String
    var location: String
    var latitude: Double
    var longitude: Double
    var radiusMeters: Double
    
    @Relationship(deleteRule: .cascade)
    var timeEntries: [TimeEntry] = []
    
    init(name: String, location: String, latitude: Double, longitude: Double, radiusMeters: Double = 100) {
        self.name = name
        self.location = location
        self.latitude = latitude
        self.longitude = longitude
        self.radiusMeters = radiusMeters
    }
    
    var activeEntry: TimeEntry? {
        timeEntries.first(where: { $0.endTime == nil })
    }
    
    var isActive: Bool { activeEntry != nil }
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
    
    var region: CLCircularRegion {
        let r = CLCircularRegion(center: coordinate, radius: radiusMeters, identifier: self.persistentModelID.hashValue.description)
        r.notifyOnEntry = true
        r.notifyOnExit = true
        return r
    }
    
    var totalDurationHours: Double {
        timeEntries.reduce(0) { $0 + $1.durationInHours }
    }
}
