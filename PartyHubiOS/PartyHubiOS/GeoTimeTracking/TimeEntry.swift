import Foundation
import SwiftData

@Model
class TimeEntry {
    var locationIdentifier: String
    var startTime: Date
    var endTime: Date?
    var party: Party?
    
    init(locationIdentifier: String, startTime: Date = .now) {
        self.locationIdentifier = locationIdentifier
        self.startTime = startTime
    }
    
    var durationInHours: Double {
        let end = endTime ?? .now
        return end.timeIntervalSince(startTime) / 3600.0
    }
}
