import Foundation

struct APIUser: Codable {
    let id: Int64
    var displayName: String?
    var distinctName: String?
    var email: String?
    var biography: String?
}

struct APICategory: Codable {
    let id: Int64
    let name: String
}

struct APILocation: Codable {
    let id: Int64?
    let address: String?
    let latitude: Double
    let longitude: Double
}

struct APIParty: Codable {
    let id: Int64
    let title: String?
    let description: String?
    let timeStart: Date?
    let timeEnd: Date?
    let maxPeople: Int?
    let minAge: Int?
    let maxAge: Int?
    let website: String?
    let fee: Double?
    let hostUser: APIUser?
    let category: APICategory?
    let location: APILocation?
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case timeStart = "time_start"
        case timeEnd = "time_end"
        case maxPeople = "max_people"
        case minAge = "min_age"
        case maxAge = "max_age"
        case website
        case fee
        case hostUser = "host_user"
        case category
        case location
    }
}

struct PartyCountResponse: Codable {
    let count: Int
}

actor PartyAPI {
    static let shared = PartyAPI()
    
    private init() {}
    
    func fetchParties() async throws -> [APIParty] {
        try await APIClient.shared.get("/party/")
    }
    
    func fetchParty(id: Int64) async throws -> APIParty {
        try await APIClient.shared.get("/party/\(id)")
    }
    
    func createParty(title: String, description: String?, timeStart: Date, timeEnd: Date?, 
                    maxPeople: Int, categoryId: Int64, locationAddress: String, 
                    latitude: Double, longitude: Double) async throws -> APIParty {
        
        struct CreatePartyBody: Encodable {
            let title: String
            let description: String?
            let timeStart: Date
            let timeEnd: Date?
            let maxPeople: Int
            let categoryId: Int64
            let locationAddress: String
            let latitude: Double
            let longitude: Double
            
            enum CodingKeys: String, CodingKey {
                case title
                case description
                case timeStart = "time_start"
                case timeEnd = "time_end"
                case maxPeople = "max_people"
                case categoryId = "category_id"
                case locationAddress = "location_address"
                case latitude
                case longitude
            }
        }
        
        let body = CreatePartyBody(
            title: title,
            description: description,
            timeStart: timeStart,
            timeEnd: timeEnd,
            maxPeople: maxPeople,
            categoryId: categoryId,
            locationAddress: locationAddress,
            latitude: latitude,
            longitude: longitude
        )
        
        return try await APIClient.shared.post("/party/add", body: body)
    }
    
    func attendParty(partyId: Int64, userId: Int64) async throws -> String {
        try await APIClient.shared.post("/party/\(partyId)/attend?user=\(userId)", body: EmptyBody())
    }
    
    func leaveParty(partyId: Int64, userId: Int64) async throws -> String {
        try await APIClient.shared.delete("/party/\(partyId)/attend?user=\(userId)")
    }
    
    func getAttendStatus(partyId: Int64, userId: Int64) async throws -> String {
        try await APIClient.shared.get("/party/\(partyId)/attend/status?user=\(userId)")
    }
}

private struct EmptyBody: Encodable {}
