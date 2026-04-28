import Foundation

class ApiService {
    static let shared = ApiService()
    private init() {}

    func updateParty(partyId: Int, title: String, description: String) async throws {
        // 1. URL bauen (nutzt dein Config-Objekt)
        guard let url = URL(string: "\(Config.backendURL)/api/parties/\(partyId)") else {
            throw URLError(.badURL)
        }

        // 2. Request erstellen
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        
        // 3. Header setzen (DAS IST DER ENTSCHEIDENDE TEIL!)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Hier holen wir die ID vom AuthManager, genau wie in deinem AppDelegate
        if let userId = AuthManager.shared.userId {
            request.setValue("\(userId)", forHTTPHeaderField: "X-User-Id")
        } else {
            // Fallback für Tests, falls kein User eingeloggt ist
            request.setValue("1", forHTTPHeaderField: "X-User-Id")
        }

        // 4. Body erstellen (Passend zu deinem PartyCreateDto in Java)
        let body: [String: Any] = [
            "title": title,
            "description": description
            // Füge hier weitere Felder hinzu, falls dein Dto mehr erwartet
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        // 5. Request abschicken
        let (data, response) = try await URLSession.shared.data(for: request)

        // 6. Fehlerprüfung
        if let httpResponse = response as? HTTPURLResponse {
            if httpResponse.statusCode != 200 {
                print("❌ Server Fehler: \(httpResponse.statusCode)")
                // Das ist der Moment, wo -1011 (400 Bad Request) auftritt
                throw NSError(domain: "NSURLErrorDomain", code: -1011, userInfo: [NSLocalizedDescriptionKey: "Bad Request"])
            } else {
                print("✅ Party erfolgreich aktualisiert!")
            }
        }
    }
}
