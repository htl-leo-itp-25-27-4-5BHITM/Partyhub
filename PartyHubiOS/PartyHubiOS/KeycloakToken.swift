import Foundation
import CryptoKit

struct KeycloakToken: Codable, Sendable, Equatable {
    let accessToken: String
    let refreshToken: String?
    let idToken: String?
    let tokenType: String
    let expiresIn: Int
    let refreshExpiresIn: Int?
    let scope: String?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case idToken = "id_token"
        case tokenType = "token_type"
        case expiresIn = "expires_in"
        case refreshExpiresIn = "refresh_expires_in"
        case scope
    }

    func accessTokenExpiresAt(from now: Date = Date()) -> Date {
        now.addingTimeInterval(TimeInterval(max(0, expiresIn - 30)))
    }

    func refreshTokenExpiresAt(from now: Date = Date()) -> Date? {
        guard let refreshExpiresIn else { return nil }
        return now.addingTimeInterval(TimeInterval(refreshExpiresIn))
    }
}

struct KeycloakTokenResponse: Decodable, Sendable {
    let accessToken: String
    let refreshToken: String?
    let idToken: String?
    let tokenType: String
    let expiresIn: Int
    let refreshExpiresIn: Int?
    let scope: String?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case idToken = "id_token"
        case tokenType = "token_type"
        case expiresIn = "expires_in"
        case refreshExpiresIn = "refresh_expires_in"
        case scope
    }

    func toStoredToken(issuedAt: Date = Date()) -> KeycloakToken {
        KeycloakToken(
            accessToken: accessToken,
            refreshToken: refreshToken,
            idToken: idToken,
            tokenType: tokenType,
            expiresIn: expiresIn,
            refreshExpiresIn: refreshExpiresIn,
            scope: scope
        )
    }
}

struct KeycloakIDTokenClaims: Decodable, Sendable {
    let sub: String?
    let preferredUsername: String?
    let username: String?
    let email: String?
    let name: String?
    let givenName: String?
    let familyName: String?
    let exp: TimeInterval?
    let iat: TimeInterval?
    let iss: String?
    let aud: String?

    enum CodingKeys: String, CodingKey {
        case sub
        case preferredUsername = "preferred_username"
        case username
        case email
        case name
        case givenName = "given_name"
        case familyName = "family_name"
        case exp
        case iat
        case iss
        case aud
    }
}

enum KeycloakJWT {
    static func decodePayload<T: Decodable>(_ token: String, as: T.Type) -> T? {
        let segments = token.split(separator: ".")
        guard segments.count >= 2 else { return nil }

        let payload = String(segments[1])
        guard let data = base64URLDecode(payload) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }

    static func base64URLDecode(_ string: String) -> Data? {
        var base64 = string
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        let padding = (4 - base64.count % 4) % 4
        base64.append(String(repeating: "=", count: padding))
        return Data(base64Encoded: base64)
    }

    static func randomURLSafe(byteCount: Int) -> String {
        var bytes = [UInt8](repeating: 0, count: byteCount)
        _ = SecRandomCopyBytes(kSecRandomDefault, byteCount, &bytes)
        return Data(bytes).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    static func sha256Base64URL(_ value: String) -> String {
        let data = Data(value.utf8)
        let hash = SHA256.hash(data: data)
        return Data(hash)
            .base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
