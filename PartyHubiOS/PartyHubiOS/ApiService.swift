import Foundation
import UIKit

class ApiService {
    static let shared = ApiService()
    private init() {}
    
    private static let profilePictureCache = NSCache<NSNumber, UIImage>()
    
    func invalidateProfilePictureCache(for userId: Int) {
        ApiService.profilePictureCache.removeObject(forKey: NSNumber(value: userId))
        print("🗑️ Invalidated profile picture cache for user \(userId)")
    }
    
    func clearAllCaches() {
        ApiService.profilePictureCache.removeAllObjects()
    }
    
    @available(*, deprecated, message: "Use APIClient.shared.request(.updateParty(...)) instead")
    func updateParty(partyId: Int, title: String, description: String) async throws {
        guard let url = URL(string: "\(Config.backendURL)/api/parties/\(partyId)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let userId = AuthManager.shared.userId {
            request.setValue("\(userId)", forHTTPHeaderField: "X-User-Id")
        } else {
            request.setValue("1", forHTTPHeaderField: "X-User-Id")
        }

        let body: [String: Any] = [
            "title": title,
            "description": description
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        if let httpResponse = response as? HTTPURLResponse {
            if httpResponse.statusCode != 200 {
                print("Server error: \(httpResponse.statusCode)")
                throw NSError(domain: "NSURLErrorDomain", code: -1011, userInfo: [NSLocalizedDescriptionKey: "Bad Request"])
            } else {
                print("Party updated successfully!")
            }
        }
    }
    
    func fetchProfilePicture(userId: Int) async throws -> UIImage {
        if let cachedImage = ApiService.profilePictureCache.object(forKey: NSNumber(value: userId)) {
            print("Profile picture for user \(userId) loaded from cache")
            return cachedImage
        }

        guard let filename = try await fetchProfilePictureFilename(userId: userId), !filename.isEmpty else {
            throw NSError(domain: "NotFound", code: 404, userInfo: [NSLocalizedDescriptionKey: "No custom profile picture available"])
        }

        let encodedFilename = filename.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? filename
        guard let url = URL(string: "\(Config.backendURL)/api/users/\(userId)/profile-picture?v=\(encodedFilename)") else {
            throw URLError(.badURL)
        }
        
        print("Loading profile picture from: \(url.absoluteString)")
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("image/*", forHTTPHeaderField: "Accept")
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse {
            print("HTTP Status: \(httpResponse.statusCode)")
            print("Data size: \(data.count) bytes")
            let mimeType = httpResponse.value(forHTTPHeaderField: "Content-Type")?.lowercased() ?? "unknown"
            print("Content-Type: \(mimeType)")
            
            if httpResponse.statusCode == 404 {
                print("Profile picture not found (404) for user \(userId)")
                throw NSError(domain: "NotFound", code: 404, userInfo: [NSLocalizedDescriptionKey: "Profile picture not found"])
            } else if httpResponse.statusCode != 200 {
                throw NSError(domain: "HTTPError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP Error \(httpResponse.statusCode)"])
            }

            if mimeType.contains("image/svg") {
                throw NSError(domain: "ImageError", code: -2, userInfo: [NSLocalizedDescriptionKey: "Server returned SVG instead of a real profile image"])
            }
        }
        
        if let svgContent = String(data: data, encoding: .utf8), svgContent.contains("<svg") {
            throw NSError(domain: "ImageError", code: -2, userInfo: [NSLocalizedDescriptionKey: "Server returned SVG instead of a real profile image"])
        }

        guard let image = UIImage(data: data), image.size.width > 0, image.size.height > 0 else {
            throw NSError(domain: "ImageError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Could not decode image"])
        }
        
        print("Profile picture successfully decoded for user \(userId)")
        
        ApiService.profilePictureCache.setObject(image, forKey: NSNumber(value: userId))
        
        return image
    }

    private func fetchProfilePictureFilename(userId: Int) async throws -> String? {
        guard let url = URL(string: "\(Config.backendURL)/api/users/\(userId)/profile-picture-filename") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        request.cachePolicy = .reloadIgnoringLocalCacheData

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            return nil
        }

        guard
            let jsonObject = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let filename = jsonObject["filename"]
        else {
            return nil
        }

        if filename is NSNull { return nil }
        return filename as? String
    }
}
