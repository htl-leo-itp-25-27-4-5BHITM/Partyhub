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
    
    var hostUserId: Int64?
    var timeStart: Date?
    var timeEnd: Date?
    var maxPeople: Int?
    var minAge: Int?
    var maxAge: Int?
    var website: String?
    var fee: Double?
    var categoryId: Int?
    
    @Relationship(deleteRule: .cascade)
    var timeEntries: [TimeEntry] = []
    
    init(backendId: Int,
         name: String,
         location: String,
         latitude: Double,
         longitude: Double,
         radiusMeters: Double = 100,
         partyDescription: String? = nil,
         hostUserId: Int64? = nil,
         timeStart: Date? = nil,
         timeEnd: Date? = nil,
         maxPeople: Int? = nil,
         minAge: Int? = nil,
         maxAge: Int? = nil,
         website: String? = nil,
         fee: Double? = nil,
         categoryId: Int? = nil) {
        self.backendId = backendId
        self.name = name
        self.location = location
        self.latitude = latitude
        self.longitude = longitude
        self.radiusMeters = radiusMeters
        self.partyDescription = partyDescription
        self.hostUserId = hostUserId
        self.timeStart = timeStart
        self.timeEnd = timeEnd
        self.maxPeople = maxPeople
        self.minAge = minAge
        self.maxAge = maxAge
        self.website = website
        self.fee = fee
        self.categoryId = categoryId
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
    
    func canEdit(currentUserId: Int64?) -> Bool {
        guard let currentUserId = currentUserId,
              let hostUserId = hostUserId else {
            return false
        }
        return hostUserId == currentUserId
    }
}
import Foundation

struct PartyResponse: Codable {
    let id: Int
    let title: String
    let description: String?
    let theme: String?
    let timeStart: String?
    let timeEnd: String?
    let maxPeople: Int?
    let minAge: Int?
    let maxAge: Int?
    let website: String?
    let fee: Double?
    let location: LocationData
    let hostUser: HostUserData
    let visibility: String?
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id, title, description, theme, website, fee, location, visibility
        case timeStart = "time_start"
        case timeEnd = "time_end"
        case maxPeople = "max_people"
        case minAge = "min_age"
        case maxAge = "max_age"
        case hostUser = "host_user"
        case createdAt = "created_at"
    }
}

struct HostUserData: Codable {
    let id: Int
    let username: String
    let displayName: String?
    let email: String?
    
    enum CodingKeys: String, CodingKey {
        case id, username, email
        case displayName = "displayName"
    }
}

struct LocationData: Codable {
    let latitude: Double
    let longitude: Double
    let address: String?
}
