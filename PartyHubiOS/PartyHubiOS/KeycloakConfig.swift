import Foundation

struct KeycloakConfig: Sendable, Equatable {
    var issuer: URL
    var realm: String
    var clientId: String
    var redirectURI: URL
    var postLogoutRedirectURI: URL
    var scope: String

    var authorizationEndpoint: URL {
        issuer.appending(path: "protocol/openid-connect/auth")
    }

    var tokenEndpoint: URL {
        issuer.appending(path: "protocol/openid-connect/token")
    }

    var endSessionEndpoint: URL {
        issuer.appending(path: "protocol/openid-connect/logout")
    }

    var userInfoEndpoint: URL {
        issuer.appending(path: "protocol/openid-connect/userinfo")
    }

    static let `default` = KeycloakConfig(
        issuer: URL(string: "https://it220274.cloud.htl-leonding.ac.at/keycloak/realms/partyhub")!,
        realm: "partyhub",
        clientId: "partyhub-ios",
        redirectURI: URL(string: "partyhub.auth://callback")!,
        postLogoutRedirectURI: URL(string: "partyhub.auth://callback")!,
        scope: "openid profile email"
    )

    static func load() async -> KeycloakConfig {
        guard let url = URL(string: "\(Config.backendURL)/api/config/public") else {
            return .default
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 8

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                return .default
            }

            struct ServerConfig: Decodable {
                let keycloakIssuer: String?
            }

            let parsed = try JSONDecoder().decode(ServerConfig.self, from: data)
            guard let raw = parsed.keycloakIssuer, let issuer = URL(string: raw) else {
                return .default
            }

            return KeycloakConfig(
                issuer: issuer,
                realm: "partyhub",
                clientId: "partyhub-ios",
                redirectURI: URL(string: "partyhub.auth://callback")!,
                postLogoutRedirectURI: URL(string: "partyhub.auth://callback")!,
                scope: "openid profile email"
            )
        } catch {
            return .default
        }
    }
}
