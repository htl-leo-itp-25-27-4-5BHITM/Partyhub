import EventKit
import CoreLocation
import MapKit

enum CalendarError: Error {
    case accessDenied
    case saveFailed
    case eventNotFound
}

@MainActor
@Observable
final class CalendarService {
    static let shared = CalendarService()

    private let store = EKEventStore()

    var isAuthorized: Bool {
        EKEventStore.authorizationStatus(for: .event) == .fullAccess
    }

    func requestAccess() async -> Bool {
        do {
            return try await store.requestFullAccessToEvents()
        } catch {
            return false
        }
    }

    func addParty(_ party: Party) async -> Result<String, CalendarError> {
        guard EKEventStore.authorizationStatus(for: .event) == .fullAccess else {
            return .failure(.accessDenied)
        }

        let event = EKEvent(eventStore: store)
        event.title = party.name
        event.location = party.location

        if let start = party.timeStart {
            event.startDate = start
            event.endDate = party.timeEnd ?? start.addingTimeInterval(3 * 60 * 60)
        } else {
            event.startDate = Date()
            event.endDate = Date().addingTimeInterval(3 * 60 * 60)
        }

        if let description = party.partyDescription, !description.isEmpty {
            event.notes = description
        }

        let structuredLocation = EKStructuredLocation(title: party.location)
        structuredLocation.geoLocation = CLLocation(latitude: party.latitude, longitude: party.longitude)
        event.structuredLocation = structuredLocation

        event.calendar = store.defaultCalendarForNewEvents
        event.url = URL(string: "partyhub://party?id=\(party.backendId)")

        do {
            try store.save(event, span: .thisEvent)
            guard let eventId = event.eventIdentifier else {
                return .failure(.saveFailed)
            }
            storeCalendarEventId(party.backendId, eventId)
            return .success(eventId)
        } catch {
            return .failure(.saveFailed)
        }
    }

    func removeParty(_ party: Party) async -> Result<Void, CalendarError> {
        guard EKEventStore.authorizationStatus(for: .event) == .fullAccess else {
            return .failure(.accessDenied)
        }

        guard let eventId = getCalendarEventId(party.backendId) else {
            return .failure(.eventNotFound)
        }

        guard let event = store.event(withIdentifier: eventId) else {
            removeCalendarEventId(party.backendId)
            return .failure(.eventNotFound)
        }

        do {
            try store.remove(event, span: .thisEvent)
            removeCalendarEventId(party.backendId)
            return .success(())
        } catch {
            return .failure(.saveFailed)
        }
    }

    func hasEvent(for party: Party) -> Bool {
        guard EKEventStore.authorizationStatus(for: .event) == .fullAccess else {
            return false
        }

        guard let eventId = getCalendarEventId(party.backendId) else {
            return false
        }
        return store.event(withIdentifier: eventId) != nil
    }

    private func storeCalendarEventId(_ partyId: Int, _ eventId: String) {
        var map = UserDefaults.standard.dictionary(forKey: "PartyHubCalendarEvents") as? [String: String] ?? [:]
        map[String(partyId)] = eventId
        UserDefaults.standard.set(map, forKey: "PartyHubCalendarEvents")
    }

    private func getCalendarEventId(_ partyId: Int) -> String? {
        let map = UserDefaults.standard.dictionary(forKey: "PartyHubCalendarEvents") as? [String: String] ?? [:]
        return map[String(partyId)]
    }

    private func removeCalendarEventId(_ partyId: Int) {
        var map = UserDefaults.standard.dictionary(forKey: "PartyHubCalendarEvents") as? [String: String] ?? [:]
        map.removeValue(forKey: String(partyId))
        UserDefaults.standard.set(map, forKey: "PartyHubCalendarEvents")
    }
}
