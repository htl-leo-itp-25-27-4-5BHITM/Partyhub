import Foundation
import Combine

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var mobileToken: String? = nil
    @Published var userId: Int? = nil

    private let tokenKey = "partyhub_mobile_token"

    private init() {
        self.mobileToken = UserDefaults.standard.string(forKey: tokenKey)
    }

    func saveToken(_ token: String) {
        mobileToken = token
        UserDefaults.standard.set(token, forKey: tokenKey)
    }

    func clear() {
        mobileToken = nil
        userId = nil
        UserDefaults.standard.removeObject(forKey: tokenKey)
    }

    // Exchange QR token for mobile_token via backend
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

    // Verify mobile token by calling /api/qr/mobile/me to get userId
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
            return uid
        }
        throw NSError(domain: "Auth", code: 4, userInfo: [NSLocalizedDescriptionKey: "userId missing"])
    }
}
