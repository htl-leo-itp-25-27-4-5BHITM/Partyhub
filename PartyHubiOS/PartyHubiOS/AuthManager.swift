import Foundation
import Combine

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var mobileToken: String? = nil
    @Published var userId: Int? = nil

    private let userIdKey = "partyhub_user_id"
    private let mobileTokenKey = "partyhub_mobile_token"

    private init() {
        let storedId = UserDefaults.standard.integer(forKey: userIdKey)
        if storedId > 0 {
            self.userId = storedId
        }
        
        self.mobileToken = UserDefaults.standard.string(forKey: mobileTokenKey)
    }

    func loginWithUserId(_ id: Int) async throws {
        guard let url = URL(string: "\(Config.backendURL)/api/users/\(id)") else {
            throw URLError(.badURL)
        }

        let (data, resp) = try await URLSession.shared.data(from: url)
        guard let http = resp as? HTTPURLResponse, http.statusCode == 200 else {
            let str = String(data: data, encoding: .utf8) ?? ""
            throw NSError(domain: "Auth", code: 1, userInfo: [NSLocalizedDescriptionKey: str])
        }

        userId = id
        UserDefaults.standard.set(id, forKey: userIdKey)
        
        let fallbackToken = "user_\(id)"
        mobileToken = fallbackToken
        UserDefaults.standard.set(fallbackToken, forKey: mobileTokenKey)
    }

    func saveToken(_ token: String) {
        mobileToken = token
        UserDefaults.standard.set(token, forKey: mobileTokenKey)
    }

    func clear() {
        mobileToken = nil
        userId = nil
        UserDefaults.standard.removeObject(forKey: userIdKey)
        UserDefaults.standard.removeObject(forKey: mobileTokenKey)
    }

    func exchangeQrToken(_ token: String) async throws -> String {
        guard let url = URL(string: "\(Config.backendURL)/api/qr/exchange") else {
            throw URLError(.badURL)
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["token": token]
        req.httpBody = try JSONEncoder().encode(body)

        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, http.statusCode == 200 else {
            let str = String(data: data, encoding: .utf8) ?? ""
            throw NSError(domain: "Auth", code: 1, userInfo: [NSLocalizedDescriptionKey: str])
        }

        let obj = try JSONDecoder().decode([String: String].self, from: data)
        if let mt = obj["mobile_token"] {
            saveToken(mt)
            return mt
        }
        throw NSError(domain: "Auth", code: 2, userInfo: [NSLocalizedDescriptionKey: "mobile_token missing"])
    }

    func fetchMobileMe() async throws -> Int {
        guard let token = mobileToken else { throw URLError(.userAuthenticationRequired) }
        guard let url = URL(string: "\(Config.backendURL)/api/qr/mobile/me") else { throw URLError(.badURL) }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(["mobile_token": token])

        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, http.statusCode == 200 else {
            let str = String(data: data, encoding: .utf8) ?? ""
            throw NSError(domain: "Auth", code: 3, userInfo: [NSLocalizedDescriptionKey: str])
        }

        if let dict = try JSONSerialization.jsonObject(with: data) as? [String: Any], let uidStr = dict["userId"] as? String, let uid = Int(uidStr) {
            userId = uid
            UserDefaults.standard.set(uid, forKey: userIdKey)
            return uid
        }
        throw NSError(domain: "Auth", code: 4, userInfo: [NSLocalizedDescriptionKey: "userId missing"])
    }
}
