import Foundation
import AuthenticationServices
import Observation
import UIKit

@MainActor
@Observable
final class KeycloakAuthService: NSObject {
    static let shared = KeycloakAuthService()

    private enum KeychainAccount {
        static let token = "keycloak.token"
        static let keycloakSub = "keycloak.sub"
        static let partyhubUserId = "keycloak.partyhub_user_id"
        static let username = "keycloak.username"
    }

    private(set) var config: KeycloakConfig = .default
    private(set) var token: KeycloakToken?
    private(set) var keycloakSub: String?
    private(set) var partyhubUserId: Int?
    private(set) var username: String?
    private(set) var isLoggingIn: Bool = false
    private(set) var lastError: String?
    private(set) var sessionEstablished = false

    private weak var presentationAnchor: ASPresentationAnchor?
    private var loginContinuation: CheckedContinuation<URL, Error>?
    private var refreshTask: Task<KeycloakToken, Error>?
    private var didBootstrap = false

    var isAuthenticated: Bool {
        token != nil && partyhubUserId != nil
    }

    var accessToken: String? {
        token?.accessToken
    }

    private override init() {
        super.init()
    }

    func bootstrap() async {
        guard !didBootstrap else { return }
        didBootstrap = true
        config = await KeycloakConfig.load()
        await loadFromKeychain()
        sessionEstablished = isAuthenticated
        if let refresh = token?.refreshToken,
           let expiresAt = token?.accessTokenExpiresAt(),
           expiresAt < Date() {
            do {
                _ = try await refreshTokens(refreshToken: refresh)
            } catch {
                print("Keycloak: bootstrap refresh failed: \(error)")
                await clearLocalSession()
            }
        }
    }

    private func loadFromKeychain() async {
        do {
            if let data = try Keychain.get(KeychainAccount.token),
               let decoded = try? JSONDecoder().decode(KeycloakToken.self, from: data) {
                self.token = decoded
            }
            self.keycloakSub = try Keychain.getString(KeychainAccount.keycloakSub)
            if let idString = try Keychain.getString(KeychainAccount.partyhubUserId),
               let id = Int(idString) {
                self.partyhubUserId = id
            }
            self.username = try Keychain.getString(KeychainAccount.username)
        } catch {
            print("Keycloak: keychain read failed: \(error)")
        }
    }

    func login(presentationAnchor anchor: ASPresentationAnchor) async throws {
        guard !isLoggingIn else { return }
        isLoggingIn = true
        lastError = nil
        defer { isLoggingIn = false }
        self.presentationAnchor = anchor

        config = await KeycloakConfig.load()

        let state = KeycloakJWT.randomURLSafe(byteCount: 32)
        let nonce = KeycloakJWT.randomURLSafe(byteCount: 32)
        let codeVerifier = KeycloakJWT.randomURLSafe(byteCount: 64)
        let codeChallenge = KeycloakJWT.sha256Base64URL(codeVerifier)

        var components = URLComponents(url: config.authorizationEndpoint, resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: config.clientId),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: config.scope),
            URLQueryItem(name: "redirect_uri", value: config.redirectURI.absoluteString),
            URLQueryItem(name: "state", value: state),
            URLQueryItem(name: "nonce", value: nonce),
            URLQueryItem(name: "code_challenge", value: codeChallenge),
            URLQueryItem(name: "code_challenge_method", value: "S256")
        ]

        guard let authURL = components.url else {
            throw KeycloakAuthError.invalidAuthorizationURL
        }

        let callbackURL = try await runASWebAuth(url: authURL, callbackURLScheme: config.redirectURI.scheme ?? "partyhub.auth")
        try await handleCallback(
            callbackURL,
            expectedState: state,
            codeVerifier: codeVerifier
        )
    }

    private func runASWebAuth(url: URL, callbackURLScheme: String) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            self.loginContinuation = continuation
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackURLScheme
            ) { callbackURL, error in
                Task { @MainActor in
                    self.loginContinuation = nil
                }
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let callbackURL else {
                    continuation.resume(throwing: KeycloakAuthError.missingCallbackURL)
                    return
                }
                continuation.resume(returning: callbackURL)
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            if !session.start() {
                self.loginContinuation = nil
                continuation.resume(throwing: KeycloakAuthError.failedToStartSession)
            }
        }
    }

    private func handleCallback(_ url: URL, expectedState: String, codeVerifier: String) async throws {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            throw KeycloakAuthError.malformedCallback
        }

        if let error = components.queryItems?.first(where: { $0.name == "error" })?.value {
            let description = components.queryItems?.first(where: { $0.name == "error_description" })?.value
            throw KeycloakAuthError.authorizationFailed(error, description)
        }

        guard let state = components.queryItems?.first(where: { $0.name == "state" })?.value,
              state == expectedState else {
            throw KeycloakAuthError.stateMismatch
        }

        guard let code = components.queryItems?.first(where: { $0.name == "code" })?.value else {
            throw KeycloakAuthError.missingAuthorizationCode
        }

        let tokenResponse = try await exchangeCodeForTokens(
            code: code,
            codeVerifier: codeVerifier
        )

        try await persist(tokenResponse: tokenResponse)
    }

    private func exchangeCodeForTokens(code: String, codeVerifier: String) async throws -> KeycloakTokenResponse {
        var request = URLRequest(url: config.tokenEndpoint)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let body: [String: String] = [
            "grant_type": "authorization_code",
            "client_id": config.clientId,
            "code": code,
            "redirect_uri": config.redirectURI.absoluteString,
            "code_verifier": codeVerifier
        ]
        request.httpBody = formEncode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "<no body>"
            throw KeycloakAuthError.tokenExchangeFailed(message)
        }

        return try JSONDecoder().decode(KeycloakTokenResponse.self, from: data)
    }

    private func persist(tokenResponse: KeycloakTokenResponse) async throws {
        let stored = tokenResponse.toStoredToken()

        let idClaims: KeycloakIDTokenClaims? = tokenResponse.idToken
            .flatMap { KeycloakJWT.decodePayload($0, as: KeycloakIDTokenClaims.self) }
        let accessClaims = KeycloakJWT.decodePayload(stored.accessToken, as: KeycloakIDTokenClaims.self)

        let sub: String? = {
            if let s = idClaims?.sub, !s.isEmpty { return s }
            if let s = accessClaims?.sub, !s.isEmpty { return s }
            return nil
        }()

        let displayName: String? = {
            if let n = idClaims?.name, !n.isEmpty { return n }
            if let p = idClaims?.preferredUsername, !p.isEmpty { return p }
            if let u = idClaims?.username, !u.isEmpty { return u }
            if let e = idClaims?.email, !e.isEmpty { return e }
            return sub
        }()

        let partyhubId = try await fetchPartyHubUserId(accessToken: stored.accessToken)

        let encoded = try JSONEncoder().encode(stored)
        try Keychain.set(encoded, for: KeychainAccount.token)
        if let sub { try Keychain.setString(sub, for: KeychainAccount.keycloakSub) }
        try Keychain.setString(String(partyhubId), for: KeychainAccount.partyhubUserId)
        if let displayName { try Keychain.setString(displayName, for: KeychainAccount.username) }

        self.token = stored
        self.keycloakSub = sub
        self.partyhubUserId = partyhubId
        self.username = displayName
        sessionEstablished = true
    }

    private func fetchPartyHubUserId(accessToken: String) async throws -> Int {
        guard let url = URL(string: "\(Config.backendURL)/api/users/me") else {
            throw KeycloakAuthError.invalidBackendURL
        }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "<no body>"
            throw KeycloakAuthError.partyHubUserLookupFailed(message)
        }

        struct MeResponse: Decodable {
            let id: Int
        }
        let me = try JSONDecoder().decode(MeResponse.self, from: data)
        return me.id
    }

    func validAccessToken() async throws -> String {
        guard let token else {
            throw KeycloakAuthError.notAuthenticated
        }

        if token.accessTokenExpiresAt() > Date() {
            return token.accessToken
        }

        guard let refresh = token.refreshToken else {
            await clearLocalSession()
            throw KeycloakAuthError.notAuthenticated
        }

        do {
            let refreshed = try await refreshTokens(refreshToken: refresh)
            return refreshed.accessToken
        } catch {
            await clearLocalSession()
            throw KeycloakAuthError.notAuthenticated
        }
    }

    @discardableResult
    private func refreshTokens(refreshToken: String) async throws -> KeycloakToken {
        if let existing = refreshTask {
            return try await existing.value
        }

        let task = Task<KeycloakToken, Error> { [weak self] in
            guard let self else { throw KeycloakAuthError.notAuthenticated }
            return try await self.performRefresh(refreshToken: refreshToken)
        }
        refreshTask = task
        defer { refreshTask = nil }
        return try await task.value
    }

    private func performRefresh(refreshToken: String) async throws -> KeycloakToken {
        var request = URLRequest(url: config.tokenEndpoint)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let body: [String: String] = [
            "grant_type": "refresh_token",
            "client_id": config.clientId,
            "refresh_token": refreshToken
        ]
        request.httpBody = formEncode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "<no body>"
            throw KeycloakAuthError.refreshFailed(message)
        }

        let tokenResponse = try JSONDecoder().decode(KeycloakTokenResponse.self, from: data)
        let stored = tokenResponse.toStoredToken()
        let encoded = try JSONEncoder().encode(stored)
        try Keychain.set(encoded, for: KeychainAccount.token)
        self.token = stored
        return stored
    }

    func logout() async {
        await clearLocalSession()
    }

    private func clearLocalSession() async {
        try? Keychain.remove(KeychainAccount.token)
        try? Keychain.remove(KeychainAccount.keycloakSub)
        try? Keychain.remove(KeychainAccount.partyhubUserId)
        try? Keychain.remove(KeychainAccount.username)
        self.token = nil
        self.keycloakSub = nil
        self.partyhubUserId = nil
        self.username = nil
        sessionEstablished = false
    }

    private func formEncode(_ parameters: [String: String]) -> Data {
        var components = URLComponents()
        components.queryItems = parameters.map { URLQueryItem(name: $0.key, value: $0.value) }
        let encoded = components.percentEncodedQuery ?? ""
        return Data(encoded.utf8)
    }
}

extension KeycloakAuthService: ASWebAuthenticationPresentationContextProviding {
    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            if let presentationAnchor {
                return presentationAnchor
            }
            for scene in UIApplication.shared.connectedScenes {
                guard let windowScene = scene as? UIWindowScene else { continue }
                if let keyWindow = windowScene.windows.first(where: { $0.isKeyWindow }) {
                    return keyWindow
                }
                if let first = windowScene.windows.first {
                    return first
                }
            }
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
                return ASPresentationAnchor(windowScene: windowScene)
            }
            return ASPresentationAnchor()
        }
    }
}

enum KeycloakAuthError: Error, LocalizedError {
    case invalidAuthorizationURL
    case missingCallbackURL
    case failedToStartSession
    case malformedCallback
    case authorizationFailed(String, String?)
    case stateMismatch
    case missingAuthorizationCode
    case tokenExchangeFailed(String)
    case refreshFailed(String)
    case partyHubUserLookupFailed(String)
    case notAuthenticated
    case invalidBackendURL

    var errorDescription: String? {
        switch self {
        case .invalidAuthorizationURL:
            return "The authorization URL was invalid."
        case .missingCallbackURL:
            return "No callback URL was returned by the identity provider."
        case .failedToStartSession:
            return "Could not start the authentication session."
        case .malformedCallback:
            return "The authentication callback was malformed."
        case .authorizationFailed(let error, let description):
            return description ?? "Authorization failed: \(error)"
        case .stateMismatch:
            return "Authentication state did not match. Please try again."
        case .missingAuthorizationCode:
            return "Authorization code was missing from the callback."
        case .tokenExchangeFailed(let message):
            return "Could not exchange the authorization code: \(message)"
        case .refreshFailed(let message):
            return "Could not refresh the session: \(message)"
        case .partyHubUserLookupFailed(let message):
            return "Could not load the PartyHub user: \(message)"
        case .notAuthenticated:
            return "Not signed in."
        case .invalidBackendURL:
            return "Invalid backend URL."
        }
    }
}
