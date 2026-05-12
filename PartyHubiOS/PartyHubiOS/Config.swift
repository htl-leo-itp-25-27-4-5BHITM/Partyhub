import Foundation

enum Config {
    static let backendURL: String = {
        if let override = ProcessInfo.processInfo.environment["PARTYHUB_BACKEND_URL"]?.trimmingCharacters(in: .whitespacesAndNewlines), !override.isEmpty {
            return override
        }

        return "https://it220274.cloud.htl-leonding.ac.at"
    }()
}
//http://localhost:8080
//https://it220274.cloud.htl-leonding.ac.at
 
