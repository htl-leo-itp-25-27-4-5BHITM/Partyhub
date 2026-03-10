import Foundation
import UIKit

actor UserAPI {
    static let shared = UserAPI()
    
    private init() {}
    
    func getUser(id: Int64) async throws -> APIUser {
        try await APIClient.shared.get("/users/\(id)")
    }
    
    func getUserByHandle(distinctName: String) async throws -> APIUser {
        let encodedName = distinctName.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? distinctName
        return try await APIClient.shared.get("/users/handle/\(encodedName)")
    }
    
    func updateUser(id: Int64, displayName: String, distinctName: String, email: String, biography: String?) async throws -> APIUser {
        
        struct UpdateUserBody: Encodable {
            let displayName: String
            let distinctName: String
            let email: String
            let biography: String?
            
            enum CodingKeys: String, CodingKey {
                case displayName = "display_name"
                case distinctName = "distinct_name"
                case email
                case biography
            }
        }
        
        let body = UpdateUserBody(
            displayName: displayName,
            distinctName: distinctName,
            email: email,
            biography: biography
        )
        
        return try await APIClient.shared.put("/users/\(id)", body: body)
    }
    
    func getFollowerCount(userId: Int64) async throws -> Int {
        let response: PartyCountResponse = try await APIClient.shared.get("/users/\(userId)/followers/count")
        return response.count
    }
    
    func getFollowingCount(userId: Int64) async throws -> Int {
        let response: PartyCountResponse = try await APIClient.shared.get("/users/\(userId)/following/count")
        return response.count
    }
    
    func getProfilePicture(userId: Int64) async throws -> UIImage? {
        do {
            let imageData = try await APIClient.shared.getImageData(from: "/users/\(userId)/profile-picture")
            return UIImage(data: imageData)
        } catch APIError.serverError(404) {
            return nil
        }
    }
    
    func getAllUsers() async throws -> [APIUser] {
        try await APIClient.shared.get("/users/all")
    }
    
    func searchUsers(name: String) async throws -> [APIUser] {
        let encodedName = name.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? name
        return try await APIClient.shared.get("/users/all/search?name=\(encodedName)")
    }
}
