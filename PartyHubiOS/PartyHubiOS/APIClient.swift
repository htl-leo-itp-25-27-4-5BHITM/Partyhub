import Foundation

@MainActor
class APIClient {
    static let shared = APIClient()
    
    private let session: URLSession
    private let jsonDecoder: JSONDecoder
    private let jsonEncoder: JSONEncoder
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
        
        self.jsonDecoder = JSONDecoder()
        self.jsonDecoder.keyDecodingStrategy = .convertFromSnakeCase
        self.jsonDecoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            let isoFormatter = ISO8601DateFormatter()
            if let date = isoFormatter.date(from: dateString) {
                return date
            }
            
            let fallbackFormatter = DateFormatter()
            fallbackFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
            fallbackFormatter.locale = Locale(identifier: "en_US_POSIX")
            fallbackFormatter.timeZone = .current
            
            if let date = fallbackFormatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date string: \(dateString)"
            )
        }
        
        self.jsonEncoder = JSONEncoder()
        self.jsonEncoder.keyEncodingStrategy = .convertToSnakeCase
        self.jsonEncoder.outputFormatting = .sortedKeys
    }
    
    func request<T: Decodable>(
        method: HTTPMethod,
        path: String,
        body: Encodable? = nil,
        queryItems: [URLQueryItem] = [],
        authType: AuthType = .none
    ) async throws -> T {
        guard var components = URLComponents(string: Config.backendURL) else {
            throw APIError.invalidURL
        }
        components.path = path
        
        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        
        guard let url = components.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        try await addAuthHeaders(to: &request, type: authType)
        
        if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            do {
                request.httpBody = try jsonEncoder.encode(body)
            } catch {
                throw APIError.decoding(error)
            }
        }
        
        print("\(method.rawValue) \(url.absoluteString)")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            print("HTTP Status: \(httpResponse.statusCode)")
            
            switch httpResponse.statusCode {
            case 200...299:
                break
            case 401:
                throw APIError.unauthorized
            default:
                let message = String(data: data, encoding: .utf8)
                throw APIError.http(statusCode: httpResponse.statusCode, message: message)
            }
            
            if T.self == Data.self {
                guard let dataAsT = data as? T else {
                    throw APIError.invalidResponse
                }
                return dataAsT
            }
            
            do {
                return try jsonDecoder.decode(T.self, from: data)
            } catch {
                print("Decoding error: \(error)")
                if let jsonString = String(data: data, encoding: .utf8) {
                    print("Raw response: \(jsonString)")
                }
                throw APIError.decoding(error)
            }
            
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.network(error)
        }
    }
    
    func requestData(
        method: HTTPMethod = .GET,
        path: String,
        queryItems: [URLQueryItem] = [],
        authType: AuthType = .none
    ) async throws -> Data {
        guard var components = URLComponents(string: Config.backendURL) else {
            throw APIError.invalidURL
        }
        components.path = path
        
        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        
        guard let url = components.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("image/*, */*", forHTTPHeaderField: "Accept")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        
        try await addAuthHeaders(to: &request, type: authType)
        
        print("\(method.rawValue) \(url.absoluteString) [data]")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            print("HTTP Status: \(httpResponse.statusCode), Data: \(data.count) bytes")
            
            switch httpResponse.statusCode {
            case 200...299:
                return data
            case 401:
                throw APIError.unauthorized
            case 404:
                throw APIError.http(statusCode: 404, message: "Resource not found")
            default:
                let message = String(data: data, encoding: .utf8)
                throw APIError.http(statusCode: httpResponse.statusCode, message: message)
            }
            
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.network(error)
        }
    }
    
    func upload<T: Decodable>(
        path: String,
        data: Data,
        fileName: String,
        mimeType: String = "image/jpeg",
        fieldName: String = "file",
        queryItems: [URLQueryItem] = [],
        authType: AuthType = .bearerToken
    ) async throws -> T {
        guard var components = URLComponents(string: Config.backendURL) else {
            throw APIError.invalidURL
        }
        components.path = path
        
        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        
        guard let url = components.url else {
            throw APIError.invalidURL
        }
        
        let boundary = UUID().uuidString
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        try await addAuthHeaders(to: &request, type: authType)
        
        var body = Data()
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        print("UPLOAD POST \(url.absoluteString) (\(data.count) bytes)")
        
        do {
            let (responseData, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            print("HTTP Status: \(httpResponse.statusCode)")
            
            switch httpResponse.statusCode {
            case 200...299:
                break
            case 401:
                throw APIError.unauthorized
            default:
                let message = String(data: responseData, encoding: .utf8)
                throw APIError.http(statusCode: httpResponse.statusCode, message: message)
            }
            
            if T.self == Data.self {
                guard let dataAsT = responseData as? T else {
                    throw APIError.invalidResponse
                }
                return dataAsT
            }
            
            if responseData.isEmpty {
                guard let empty = EmptyResponse() as? T else {
                    throw APIError.invalidResponse
                }
                return empty
            }
            
            do {
                return try jsonDecoder.decode(T.self, from: responseData)
            } catch {
                print("Decoding error: \(error)")
                if let jsonString = String(data: responseData, encoding: .utf8) {
                    print("Raw response: \(jsonString)")
                }
                throw APIError.decoding(error)
            }
            
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.network(error)
        }
    }
    
    private func addAuthHeaders(to request: inout URLRequest, type: AuthType) async throws {
        let auth = KeycloakAuthService.shared

        switch type {
        case .none:
            break

        case .bearerToken:
            let token = try await auth.validAccessToken()
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        case .bearerOrAnonymous:
            if let token = try? await auth.validAccessToken() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

        }
    }
}

enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
}

enum AuthType {
    case none
    case bearerToken
    case bearerOrAnonymous
}

struct EmptyResponse: Decodable {}

struct CountResponse: Decodable {
    let count: Int
}

struct FilenameResponse: Decodable {
    let filename: String?
}

struct UserProfile: Codable, Identifiable {
    let id: Int
    let username: String?
    let displayName: String?
    let distinctName: String?
    let email: String?
    let biography: String?
    let phoneNumber: String?

    enum CodingKeys: String, CodingKey {
        case id, username, email, biography
        case displayName
        case distinctName
        case phoneNumber
    }
}
