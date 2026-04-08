//
//  PartyNotificationSystem.swift
//  PartyHub
//
//  KOMPLETTES Notification-System inkl. AppDelegate
//

import Foundation
import UserNotifications
import SwiftUI
import Combine
import SwiftData
import UIKit

// MARK: - Notification Names

extension Notification.Name {
    static let partyDidUpdate = Notification.Name("partyDidUpdate")
    static let showPartyDetail = Notification.Name("showPartyDetail")
    static let didLoginMobile = Notification.Name("didLoginMobile")
}

// MARK: - Party Change Types

enum PartyChangeType: String, Codable {
    case nameChanged = "Name wurde geändert"
    case descriptionChanged = "Beschreibung wurde aktualisiert"
    case locationChanged = "Location wurde geändert"
    case timeChanged = "Zeit wurde geändert"
    case imageAdded = "Neues Foto wurde hinzugefügt"
    case imageRemoved = "Foto wurde entfernt"
    case attendeeAdded = "Jemand nimmt teil"
    case attendeeRemoved = "Jemand hat abgesagt"
    case detailsChanged = "Details wurden aktualisiert"
}

// MARK: - Server Models

struct ServerParty: Codable {
    let id: Int
    let name: String
    let location: String
    let latitude: Double
    let longitude: Double
    let description: String?
    let timeStart: Date?
    let timeEnd: Date?
    let updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id = "id"
        case name = "title"
        case location = "location_address"
        case latitude, longitude
        case description
        case timeStart = "time_start"
        case timeEnd = "time_end"
        case updatedAt = "updated_at"
    }
}

struct Attendee: Codable {
    let userId: Int
    let displayName: String?
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case displayName = "display_name"
    }
}

// MARK: - Party Notification Manager

@MainActor
class PartyNotificationManager: ObservableObject {
    static let shared = PartyNotificationManager()
    
    @Published var unreadPartyUpdates: [Int: Int] = [:] // PartyID -> Anzahl ungelesener Updates
    @Published var totalBadgeCount: Int = 0
    
    private let userDefaults = UserDefaults.standard
    private let unreadUpdatesKey = "unreadPartyUpdates"
    
    private init() {
        loadUnreadUpdates()
        updateTotalBadgeCount()
    }
    
    // MARK: - Badge Management
    
    private func loadUnreadUpdates() {
        if let data = userDefaults.data(forKey: unreadUpdatesKey),
           let decoded = try? JSONDecoder().decode([Int: Int].self, from: data) {
            unreadPartyUpdates = decoded
        }
    }
    
    private func saveUnreadUpdates() {
        if let encoded = try? JSONEncoder().encode(unreadPartyUpdates) {
            userDefaults.set(encoded, forKey: unreadUpdatesKey)
        }
    }
    
    private func updateTotalBadgeCount() {
        totalBadgeCount = unreadPartyUpdates.values.reduce(0, +)
        
        Task {
            do {
                try await UNUserNotificationCenter.current()
                    .setBadgeCount(totalBadgeCount)
                print("📛 App Badge gesetzt: \(totalBadgeCount)")
            } catch {
                print("❌ Fehler beim Setzen des Badge-Counts: \(error)")
            }
        }
    }
    
    func incrementBadge(for partyId: Int) {
        unreadPartyUpdates[partyId, default: 0] += 1
        saveUnreadUpdates()
        updateTotalBadgeCount()
    }
    
    func markAsRead(partyId: Int) {
        unreadPartyUpdates[partyId] = nil
        saveUnreadUpdates()
        updateTotalBadgeCount()
    }
    
    func unreadCount(for partyId: Int) -> Int {
        return unreadPartyUpdates[partyId] ?? 0
    }
    
    func clearAllBadges() {
        unreadPartyUpdates.removeAll()
        saveUnreadUpdates()
        updateTotalBadgeCount()
    }
    
    // MARK: - Push Notification Setup
    
    func requestAuthorization() async throws {
        let center = UNUserNotificationCenter.current()
        
        let granted = try await center.requestAuthorization(options: [
            .alert,
            .sound,
            .badge,
            .criticalAlert
        ])
        
        if granted {
            print("✅ Push-Benachrichtigungen ERLAUBT - Notifications erscheinen außerhalb der App!")
            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        } else {
            print("❌ Push-Benachrichtigungen ABGELEHNT")
        }
    }
    
    func checkAuthorizationStatus() async -> UNAuthorizationStatus {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        return settings.authorizationStatus
    }
    
    // MARK: - System Notifications
    
    func sendSystemNotification(
        partyId: Int,
        partyName: String,
        changeDescription: String
    ) async {
        let content = UNMutableNotificationContent()
        content.title = "🎉 Party Update"
        content.body = "\(partyName): \(changeDescription)"
        content.sound = .default
        
        // Badge wird NICHT hier erhöht, sondern beim Empfangen!
        // Zeige aktuellen Badge-Count in der Notification
        content.badge = NSNumber(value: totalBadgeCount + 1)
        
        content.userInfo = [
            "partyId": partyId,
            "type": "partyUpdate",
            "deepLink": "partyhub://party?id=\(partyId)"
        ]
        
        content.categoryIdentifier = "PARTY_UPDATE"
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "partyUpdate_\(partyId)_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        
        do {
            try await UNUserNotificationCenter.current().add(request)
            // Erhöhe Badge SOFORT (für lokale Notifications)
            incrementBadge(for: partyId)
            print("📬 System-Notification gesendet: \(partyName)")
        } catch {
            print("❌ Fehler beim Senden der System-Benachrichtigung: \(error)")
        }
    }
    
    // MARK: - Remote Notification Handling
    
    func handleRemoteNotification(userInfo: [AnyHashable: Any]) {
        guard let partyId = userInfo["partyId"] as? Int else {
            print("⚠️ Keine PartyID in Remote Notification gefunden")
            return
        }
        
        // Erhöhe Badge NUR wenn es eine REMOTE Notification ist
        // (nicht unsere eigene lokale Notification)
        let isLocalNotification = userInfo["type"] as? String == "partyUpdate"
        if !isLocalNotification {
            incrementBadge(for: partyId)
        }
        
        NotificationCenter.default.post(
            name: .partyDidUpdate,
            object: partyId
        )
        
        print("📩 Remote Notification verarbeitet für Party \(partyId)")
    }
    
    func handleNotificationTap(userInfo: [AnyHashable: Any]) {
        guard let partyId = userInfo["partyId"] as? Int else { return }
        
        print("👆 User hat auf Notification getappt: Party \(partyId)")
        
        NotificationCenter.default.post(
            name: .showPartyDetail,
            object: partyId
        )
    }
    
    // MARK: - Notification Categories
    
    func setupNotificationCategories() {
        let openAction = UNNotificationAction(
            identifier: "OPEN_PARTY",
            title: "Öffnen",
            options: .foreground
        )
        
        let dismissAction = UNNotificationAction(
            identifier: "DISMISS",
            title: "Verwerfen",
            options: .destructive
        )
        
        let category = UNNotificationCategory(
            identifier: "PARTY_UPDATE",
            actions: [openAction, dismissAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([category])
        print("✅ Notification-Kategorien registriert")
    }
}

// MARK: - Party Update Service

@MainActor
class PartyUpdateService: ObservableObject {
    static let shared = PartyUpdateService()
    
    @Published var isPolling = false
    private var pollingTask: Task<Void, Never>?
    private let pollingInterval: TimeInterval = 30
    
    private var lastUpdateTimestamps: [Int: Date] = [:]
    private let userDefaults = UserDefaults.standard
    private let timestampKey = "partyUpdateTimestamps"
    
    private init() {
        loadTimestamps()
    }
    
    // MARK: - Timestamp Management
    
    private func loadTimestamps() {
        if let data = userDefaults.data(forKey: timestampKey),
           let decoded = try? JSONDecoder().decode([Int: Date].self, from: data) {
            lastUpdateTimestamps = decoded
        }
    }
    
    private func saveTimestamps() {
        if let encoded = try? JSONEncoder().encode(lastUpdateTimestamps) {
            userDefaults.set(encoded, forKey: timestampKey)
        }
    }
    
    func updateTimestamp(for partyId: Int, date: Date = Date()) {
        lastUpdateTimestamps[partyId] = date
        saveTimestamps()
    }
    
    // MARK: - Polling
    
    func startPolling(modelContext: ModelContext) {
        guard !isPolling else { return }
        
        isPolling = true
        pollingTask = Task {
            while !Task.isCancelled {
                await checkForPartyUpdates(modelContext: modelContext)
                try? await Task.sleep(nanoseconds: UInt64(pollingInterval * 1_000_000_000))
            }
        }
        
        print("Party-Update-Polling gestartet")
    }
    
    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
        isPolling = false
        print("Party-Update-Polling gestoppt")
    }
    
    // MARK: - Update Checking
    
    private func checkForPartyUpdates(modelContext: ModelContext) async {
        do {
            let descriptor = FetchDescriptor<Party>()
            let localParties = try modelContext.fetch(descriptor)
            
            for localParty in localParties {
                await checkSingleParty(
                    partyId: localParty.backendId,
                    localParty: localParty,
                    modelContext: modelContext
                )
            }
        } catch {
            print("Fehler beim Fetchen der lokalen Partys: \(error)")
        }
    }
    
    private func checkSingleParty(
        partyId: Int,
        localParty: Party,
        modelContext: ModelContext
    ) async {
        guard let token = AuthManager.shared.mobileToken,
              let userId = AuthManager.shared.userId else {
            return
        }
        
        let isInvited = await checkIfUserIsInvited(partyId: partyId, userId: userId, token: token)
        guard isInvited else {
            return
        }
        
        guard let serverParty = await fetchPartyFromServer(partyId: partyId, token: token) else {
            return
        }
        
        let changes = detectChanges(local: localParty, server: serverParty)
        
        if !changes.isEmpty {
            updateLocalParty(localParty, with: serverParty, modelContext: modelContext)
            
            for change in changes {
                await sendNotificationForChange(
                    partyId: partyId,
                    partyName: serverParty.name,
                    change: change
                )
            }
            
            updateTimestamp(for: partyId)
        }
    }
    
    // MARK: - Server Communication
    
    private func checkIfUserIsInvited(partyId: Int, userId: Int, token: String) async -> Bool {
        guard let url = URL(string: "\(Config.backendURL)/api/party/\(partyId)/attendees") else {
            return false
        }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let attendees = try JSONDecoder().decode([Attendee].self, from: data)
            return attendees.contains { $0.userId == userId }
        } catch {
            print("Fehler beim Prüfen der Einladung: \(error)")
            return false
        }
    }
    
    private func fetchPartyFromServer(partyId: Int, token: String) async -> ServerParty? {
        guard let url = URL(string: "\(Config.backendURL)/api/party/\(partyId)") else {
            return nil
        }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            return try JSONDecoder().decode(ServerParty.self, from: data)
        } catch {
            print("Fehler beim Laden der Party vom Server: \(error)")
            return nil
        }
    }
    
    // MARK: - Change Detection
    
    private func detectChanges(local: Party, server: ServerParty) -> [PartyChangeType] {
        var changes: [PartyChangeType] = []
        
        if local.name != server.name {
            changes.append(.nameChanged)
        }
        
        if local.location != server.location ||
           abs(local.latitude - server.latitude) > 0.0001 ||
           abs(local.longitude - server.longitude) > 0.0001 {
            changes.append(.locationChanged)
        }
        
        return changes
    }
    
    private func updateLocalParty(_ local: Party, with server: ServerParty, modelContext: ModelContext) {
        local.name = server.name
        local.location = server.location
        local.latitude = server.latitude
        local.longitude = server.longitude
        
        do {
            try modelContext.save()
            print("Lokale Party \(local.backendId) aktualisiert")
        } catch {
            print("Fehler beim Speichern der Party-Updates: \(error)")
        }
    }
    
    private func sendNotificationForChange(
        partyId: Int,
        partyName: String,
        change: PartyChangeType
    ) async {
        await PartyNotificationManager.shared.sendSystemNotification(
            partyId: partyId,
            partyName: partyName,
            changeDescription: change.rawValue
        )
    }
}

// MARK: - App Delegate

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {
        
        UNUserNotificationCenter.current().delegate = self
        
        Task {
            try? await PartyNotificationManager.shared.requestAuthorization()
            await PartyNotificationManager.shared.setupNotificationCategories()
        }
        
        return true
    }
    
    // MARK: - Remote Notifications Registration
    
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("📱 Device Token: \(tokenString)")
        
        Task {
            await sendDeviceTokenToServer(token: tokenString)
        }
    }
    
    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("❌ Fehler bei Remote Notification Registration: \(error.localizedDescription)")
    }
    
    // MARK: - Notification Handling
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        
        Task { @MainActor in
            PartyNotificationManager.shared.handleRemoteNotification(userInfo: userInfo)
        }
        
        completionHandler([.banner, .sound, .badge])
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        
        Task { @MainActor in
            PartyNotificationManager.shared.handleNotificationTap(userInfo: userInfo)
        }
        
        completionHandler()
    }
    
    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable : Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        print("📩 Remote Notification empfangen: \(userInfo)")
        
        Task { @MainActor in
            PartyNotificationManager.shared.handleRemoteNotification(userInfo: userInfo)
            completionHandler(.newData)
        }
    }
    
    // MARK: - Server Communication
    
    private func sendDeviceTokenToServer(token: String) async {
        guard let userId = AuthManager.shared.userId,
              let accessToken = AuthManager.shared.mobileToken,
              let url = URL(string: "\(Config.backendURL)/api/users/\(userId)/device-token") else {
            print("⚠️ Kann Device Token nicht senden: Fehlende Authentifizierung")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "deviceToken": token,
            "platform": "ios"
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                print("✅ Device Token erfolgreich an Server gesendet")
            } else {
                print("⚠️ Server hat Device Token abgelehnt")
            }
        } catch {
            print("❌ Fehler beim Senden des Device Tokens: \(error)")
        }
    }
}
