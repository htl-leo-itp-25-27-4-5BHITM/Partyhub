import Foundation
import SwiftData
import CoreLocation

@Model
class Party {
    @Attribute(.unique) var backendId: Int
    var name: String
    var location: String
    var latitude: Double
    var longitude: Double
    var radiusMeters: Double
    var partyDescription: String?
    
    @Relationship(deleteRule: .cascade)
    var timeEntries: [TimeEntry] = []
    
    init(backendId: Int, name: String, location: String, latitude: Double, longitude: Double, radiusMeters: Double = 100, partyDescription: String? = nil) {
        self.backendId = backendId
        self.name = name
        self.location = location
        self.latitude = latitude
        self.longitude = longitude
        self.radiusMeters = radiusMeters
        self.partyDescription = partyDescription
    }
    
    var activeEntry: TimeEntry? {
        timeEntries.first(where: { $0.endTime == nil })
    }
    
    var isActive: Bool { activeEntry != nil }
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
    
    var region: CLCircularRegion {
        let r = CLCircularRegion(
            center: coordinate,
            radius: radiusMeters,
            identifier: backendId.description
        )
        r.notifyOnEntry = true
        r.notifyOnExit = true
        return r
    }
}
