import Foundation

enum APIError: Error, LocalizedError {
    case network(Error)
    case http(statusCode: Int, message: String?)
    case decoding(Error)
    case invalidResponse
    case invalidURL
    case unauthorized
    case noAuthToken
    case legacyHeaderUnsupported

    var errorDescription: String? {
        switch self {
        case .network(let error):
            return "Network error: \(error.localizedDescription)"
        case .http(let statusCode, let message):
            if let message = message, !message.isEmpty {
                return "Server error (\(statusCode)): \(message)"
            }
            return "Server error: HTTP \(statusCode)"
        case .decoding(let error):
            return "Failed to parse server response: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid response from server"
        case .invalidURL:
            return "Invalid URL"
        case .unauthorized:
            return "Unauthorized - please log in again"
        case .noAuthToken:
            return "Not signed in"
        case .legacyHeaderUnsupported:
            return "Legacy X-User-Id authentication is no longer supported. Use Keycloak."
        }
    }
}
