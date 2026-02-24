import Foundation
import SwiftData

@Model
class TimeEntry {
    var locationIdentifier: String
    var startTime: Date
    var endTime: Date?
    
    init(locationIdentifier: String, startTime: Date = .now) {
        self.locationIdentifier = locationIdentifier
        self.startTime = startTime
    }
    
    var durationInHours: Double {
        guard let end = endTime else { return 0.0 }
        return end.timeIntervalSince(startTime) / 3600.0
    }
}
