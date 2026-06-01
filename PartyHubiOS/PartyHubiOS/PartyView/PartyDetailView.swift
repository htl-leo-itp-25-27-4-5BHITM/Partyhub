import SwiftUI
import SwiftData
import PhotosUI
import Combine
import CoreLocation
import EventKit

struct PartyDetailView: View {
    @Bindable var party: Party
    @Environment(LocationManager.self) private var locationManager
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var authManager: AuthManager
    @State private var now = Date()
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var geladeneBilder: [URL] = []
    @State private var ausgewaehlteBilderZumLoeschen = Set<URL>()
    @State private var istImBearbeitungsModus = false
    @State private var partyText: String = ""
    @State private var resolvedAddress: String = ""
    
    // MARK: - Edit Feature
    @State private var showEditSheet = false
    @State private var isUpdating = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    // MARK: - Invite Users
    @State private var showInviteSheet = false

    // MARK: - Notification System
    @StateObject private var notificationManager = PartyNotificationManager.shared
    @State private var hasCheckedUpdates = false
    
    @State private var calendarService = CalendarService()
    @State private var calendarState: CalendarButtonState = .idle
    @State private var showCalendarRemoveSheet = false
    
    enum CalendarButtonState {
        case idle, loading, success, alreadyAdded
    }
}

extension PartyDetailView {

    private var shareURL: URL? {
        URL(string: "https://maps.apple.com/?ll=\(party.latitude),\(party.longitude)&q=\(party.name.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")
    }

    private var appDeepLink: URL? {
        URL(string: "partyhub://party?id=\(party.backendId)")
    }
    
    var finished: [TimeEntry] {
        party.timeEntries.filter { $0.endTime != nil }.sorted(by: { $0.startTime > $1.startTime })
    }
    
    // MARK: - Notification Helpers
    var unreadUpdateCount: Int {
        notificationManager.unreadCount(for: party.backendId)
    }
    
    // MARK: - Owner Check
    private var currentUserId: Int64? {
        authManager.userId.map { Int64($0) }
    }
    
    private var isOwner: Bool {
        party.canEdit(currentUserId: currentUserId)
    }
    
    @ViewBuilder
    private func listContent() -> some View {
        if unreadUpdateCount > 0 {
            Section {
                HStack {
                    Image(systemName: "bell.badge.fill")
                        .foregroundColor(.red)
                    Text("\(unreadUpdateCount) new Update\(unreadUpdateCount == 1 ? "" : "s")")
                        .font(.subheadline)
                        .foregroundColor(.red)
                    Spacer()
                    Text("You can see them right now")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 4)
            }
        }
        
        if isOwner {
            Section {
                HStack {
                    Image(systemName: "crown.fill")
                        .foregroundColor(.yellow)
                    Text("You are the organiser")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 4)
            }
        }
        
        Section {
            LabeledContent("Status") {
                Text(party.isActive ? "You are currently here": "Not present")
                    .foregroundStyle(party.isActive ? .green : .gray)
                    .fontWeight(.semibold)
            }
        }
        
        PartyDetailsSection(party: party)
        
        LocationSection(
            party: party,
            resolvedAddress: $resolvedAddress
        )

        Section("Participants") {
            NavigationLink {
                PartyAttendeeMapView(
                    party: party,
                    locationManager: locationManager
                )
            } label: {
                Label("Show participants on map", systemImage: "person.2.fill")
            }
            
            NavigationLink {
                UserLocationListView(parties: [party])
            } label: {
                Label("List of participants", systemImage: "list.bullet")
            }
        }
        
        AttendanceSection(party: party, now: now)
        PastVisitsSection(entries: finished)
        
        #if DEBUG
        PartyDetailDebugSection(
            party: party,
            currentUserId: currentUserId,
            simulateEnterParty: simulateEnterParty,
            simulateLeaveParty: simulateLeaveParty,
            simulatePartyUpdate: simulatePartyUpdate,
            testLocalNotification: testLocalNotification,
            printDebugInfo: printDebugInfo,
            becomeOwner: becomeOwner,
            isOwner: isOwner
        )
        #endif
        
        PhotosSection(
            geladeneBilder: $geladeneBilder,
            selectedItems: $selectedItems,
            ausgewaehlteBilderZumLoeschen: $ausgewaehlteBilderZumLoeschen,
            istImBearbeitungsModus: $istImBearbeitungsModus,
            onSaveImage: speicherBild,
            onDelete: {
                loescheAusgewaehlteBilder()
                ausgewaehlteBilderZumLoeschen.removeAll()
            }
        )
    }
    
    var body: some View {
        List {
            listContent()
        }
            .navigationTitle(party.name)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task { await handleCalendarTap() }
                    } label: {
                        calendarButtonLabel
                    }
                    .disabled(calendarState == .loading)
                }
                
                // MARK: - Edit Button (NEU - nur für Owner)
                if isOwner {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button {
                            showEditSheet = true
                        } label: {
                            Image(systemName: "pencil.circle.fill")
                                .font(.title3)
                        }
                        .disabled(isUpdating)
                    }
                }
                
                ToolbarItem(placement: .primaryAction) {
                    Menu {
                        if let url = shareURL {
                            ShareLink(item: url, subject: Text(party.name), message: Text(partyText)) {
                                Text("Share the Maps link")
                            }
                        }
                        ShareLink(item: partyText) {
                            Text("Share as text")
                        }
                        if let deepLink = appDeepLink {
                            ShareLink(item: deepLink) {
                                Label("Share App Link", systemImage: "antenna.radiowaves.left.and.right")
                            }
                        }
                        Button {
                            showInviteSheet = true
                        } label: {
                            Label("Invite Friends", systemImage: "person.badge.plus")
                        }
                    } label: {
                        Text("Share")
                    }
                }
            }
            .sheet(isPresented: $showEditSheet) {
                PartyFormView(mode: .edit(party)) { updatedParty in
                    await updatePartyOnBackend(updatedParty)
                }
            }
            .sheet(isPresented: $showInviteSheet) {
                InviteUsersView(party: party)
            }
            .overlay {
                if isUpdating {
                    ZStack {
                        Color.black.opacity(0.2)
                            .ignoresSafeArea()
                        
                        ProgressView()
                            .scaleEffect(1.5)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(10)
                            .shadow(radius: 10)
                    }
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
            .confirmationDialog("Remove from Calendar?", isPresented: $showCalendarRemoveSheet) {
                Button("Remove from Calendar", role: .destructive) {
                    Task { await removeFromCalendar() }
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("This will remove the \"\(party.name)\" event from your calendar.")
            }
            .onAppear {
                print(" === PARTY DETAIL DEBUG ===")
                print(" Party Name: \(party.name)")
                print(" Party Backend ID: \(party.backendId)")
                print(" Party Host User ID: \(String(describing: party.hostUserId))")
                print(" Current User ID (UserDefaults): \(String(describing: currentUserId))")
                print(" Is Owner: \(isOwner)")
                print(" === END DEBUG ===\n")
                
                ladeBilderAusOrdner()
                partyText = "\(party.name)\n \(party.location)\n https://maps.apple.com/?ll=\(party.latitude),\(party.longitude)"
                
                if !hasCheckedUpdates {
                    markPartyAsRead()
                    hasCheckedUpdates = true
                }
                setupNotificationObservers()
                Task {
                    let location = CLLocation(latitude: party.latitude, longitude: party.longitude)
                    let placemarks = try? await CLGeocoder().reverseGeocodeLocation(location)
                    if let p = placemarks?.first {
                        let parts: [String?] = [p.thoroughfare, p.subThoroughfare, p.postalCode, p.locality]
                        resolvedAddress = parts.compactMap { $0 }.joined(separator: " ")
                    }
                }
                
                if calendarService.hasEvent(for: party) {
                    calendarState = .alreadyAdded
                }
            }
            .onReceive(timer) { now = $0 }
        }
        
        // MARK: - Debug Functions
#if DEBUG
        func simulateEnterParty() {
            print("Simulate: Party join")
            
            let entry = TimeEntry(
                locationIdentifier: party.name,
                startTime: Date(),
            )
            party.timeEntries.append(entry)
            
            try? modelContext.save()
            print("TimeEntry created: \(entry.startTime)")
        }
        
        func simulateLeaveParty() {
            print("Simulate: Party leave")
            
            guard let activeEntry = party.activeEntry else {
                print("No active Session available")
                return
            }
            
            activeEntry.endTime = Date()
            try? modelContext.save()
            print("TimeEntry completet: \(activeEntry.durationInHours)h")
        }
        
        func simulatePartyUpdate() {
            print("Simulate: Party-Update (Description change)")
            
            Task {
                do {
                    let baseURL = "https://it220274.cloud.htl-leonding.ac.at"
                    guard let currentUserId = currentUserId else {
                        print("No User logedIn")
                        return
                    }
                    
                    guard let url = URL(string: "\(baseURL)/api/party/\(party.backendId)?user=\(currentUserId)") else {
                        print("Invalid URL")
                        return
                    }
                    
                    let newDescription = "GEÄNDERT UM \(Date().formatted(date: .omitted, time: .standard)) - Test Notification"
                    
                    let payload: [String: Any] = [
                        "title": party.name,
                        "description": newDescription,
                        "location_address": party.location,
                        "latitude": party.latitude,
                        "longitude": party.longitude
                    ]
                    
                    var request = URLRequest(url: url)
                    request.httpMethod = "PUT"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.httpBody = try JSONSerialization.data(withJSONObject: payload)
                    
                    let (_, response) = try await URLSession.shared.data(for: request)
                    
                    if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                        await MainActor.run {
                            party.partyDescription = newDescription
                        }
                        print("Party updated successfully – a push notification should be sent!")
                    } else {
                        print("Update failed")
                    }
                } catch {
                    print("Error: \(error)")
                }
            }
        }
        
        func testLocalNotification() {
            print("Send Test-Notification")
            
            let content = UNMutableNotificationContent()
            content.title = "Test Notification"
            content.body = "Party '\(party.name)' has been updated!"
            content.sound = .default
            
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 2, repeats: false)
            let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("Notification Error: \(error)")
                } else {
                    print("Notification scheduled (in 2 seconds)")
                }
            }
        }
        
        func printDebugInfo() {
            print("\n === MANUAL DEBUG INFO ===")
            print("Party ID: \(party.backendId)")
            print("Party Name: \(party.name)")
            print("Host User ID: \(String(describing: party.hostUserId))")
            print("Current User ID: \(String(describing: currentUserId))")
            print("Is Owner: \(isOwner)")
            print("Is Active: \(party.isActive)")
            print("Active Entry: \(String(describing: party.activeEntry))")
            print("Total Time Entries: \(party.timeEntries.count)")
            print("=========================\n")
        }
        
        func becomeOwner() {
            print("becomeOwner() is deprecated - user authentication is handled by AuthManager")
        }
#endif
        
        // MARK: - Update Party on Backend
        @MainActor
        func updatePartyOnBackend(_ updatedParty: PartyEditData) async -> Bool {
            guard let currentUserId = currentUserId else {
                errorMessage = "You are not logged in"
                showError = true
                return false
            }
            
            guard isOwner else {
                errorMessage = "You do not have permission (owner check failed)"
                showError = true
                return false
            }
            
            isUpdating = true
            
            do {
                let df = DateFormatter()
                df.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
                df.locale = Locale(identifier: "en_US_POSIX")

                let body = UpdatePartyBody(
                    title: updatedParty.title,
                    desc: updatedParty.description,
                    fee: updatedParty.fee ?? 0,
                    timeStart: df.string(from: updatedParty.timeStart ?? Date()),
                    timeEnd: df.string(from: updatedParty.timeEnd ?? Date()),
                    maxPeople: updatedParty.maxPeople,
                    minAge: updatedParty.minAge ?? 0,
                    maxAge: updatedParty.maxAge ?? 150,
                    website: updatedParty.website ?? "",
                    latitude: updatedParty.latitude,
                    longitude: updatedParty.longitude,
                    locationAddress: updatedParty.location,
                    theme: "Standard",
                    visibility: "public",
                    selectedUsers: []
                )

                let encoder = JSONEncoder()
                let jsonData = try encoder.encode(body)

                guard let url = URL(string: "\(Config.backendURL)/api/parties/\(party.backendId)?user=\(currentUserId)") else {
                    throw URLError(.badURL)
                }

                var request = URLRequest(url: url)
                request.httpMethod = "PUT"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")

                let (data, response) = try await URLSession.shared.upload(for: request, from: jsonData)

                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }

                guard (200...299).contains(httpResponse.statusCode) else {
                    let message = String(data: data, encoding: .utf8)
                    throw APIError.http(statusCode: httpResponse.statusCode, message: message)
                }
                
                party.name = updatedParty.title
                party.partyDescription = updatedParty.description
                party.location = updatedParty.location
                party.latitude = updatedParty.latitude
                party.longitude = updatedParty.longitude
                party.timeStart = updatedParty.timeStart
                party.timeEnd = updatedParty.timeEnd
                party.maxPeople = updatedParty.maxPeople
                party.minAge = updatedParty.minAge
                party.maxAge = updatedParty.maxAge
                party.website = updatedParty.website
                party.fee = updatedParty.fee
                party.categoryId = updatedParty.categoryId
                
                try? modelContext.save()
                print("Party successfully updated")
                isUpdating = false
                return true
                
            } catch {
                print("Request Error: \(error)")
                errorMessage = "Error: \(error)"
                showError = true
                isUpdating = false
                return false
            }
        }
        
        // MARK: - Notification Functions
        func markPartyAsRead() {
            notificationManager.markAsRead(partyId: party.backendId)
        }
        
        func setupNotificationObservers() {
            NotificationCenter.default.addObserver(
                forName: .partyDidUpdate,
                object: nil,
                queue: .main
            ) { notification in
                guard let updatedPartyId = notification.object as? Int,
                      updatedPartyId == self.party.backendId else {
                    return
                }
            }
        }
        
        // MARK: – Foto Funktionen
        func waehleBildAus(url: URL) {
            if ausgewaehlteBilderZumLoeschen.contains(url) {
                ausgewaehlteBilderZumLoeschen.remove(url)
            } else {
                ausgewaehlteBilderZumLoeschen.insert(url)
            }
        }
        
        func loescheAusgewaehlteBilder() {
            for url in ausgewaehlteBilderZumLoeschen {
                try? FileManager.default.removeItem(at: url)
            }
            ladeBilderAusOrdner()
        }
        
        func speicherBild(image: UIImage) {
            guard let data = image.jpegData(compressionQuality: 0.8) else { return }
            let ordner = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(party.name)
            
            if !FileManager.default.fileExists(atPath: ordner.path()) {
                try? FileManager.default.createDirectory(at: ordner, withIntermediateDirectories: true)
            }
            
            let dateiname = UUID().uuidString + ".jpg"
            let dateiURL = ordner.appendingPathComponent(dateiname)
            
            try? data.write(to: dateiURL)
            ladeBilderAusOrdner()
        }
        
        func ladeBilderAusOrdner() {
            let ordner = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(party.name)
            
            guard let dateien = try? FileManager.default.contentsOfDirectory(at: ordner, includingPropertiesForKeys: nil) else {
                geladeneBilder = []
                return
            }
            
            geladeneBilder = dateien.filter { $0.pathExtension == "jpg" || $0.pathExtension == "png" }
        }
        
        // MARK: - Helper Functions
        func formatDuration(_ seconds: TimeInterval) -> String {
            let hours = Int(seconds) / 3600
            let minutes = (Int(seconds) % 3600) / 60
            
            if hours > 0 {
                return "\(hours)h \(minutes)m"
            } else {
                return "\(minutes)m"
            }
        }
        
        // MARK: - Calendar Functions
        @ViewBuilder
        private var calendarButtonLabel: some View {
            switch calendarState {
            case .idle:
                Image(systemName: "calendar.badge.plus")
            case .loading:
                ProgressView()
                    .scaleEffect(0.8)
            case .success, .alreadyAdded:
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            }
        }
        
        private func handleCalendarTap() async {
            if calendarState == .alreadyAdded {
                showCalendarRemoveSheet = true
                return
            }
            
            if !calendarService.isAuthorized {
                let granted = await calendarService.requestAccess()
                if !granted { return }
            }
            
            calendarState = .loading
            let result = await calendarService.addParty(party)
            
            switch result {
            case .success:
                calendarState = .alreadyAdded
            case .failure:
                calendarState = .idle
            }
        }
        
        private func removeFromCalendar() async {
            let result = await calendarService.removeParty(party)
            if case .success = result {
                calendarState = .idle
            }
        }
}

private struct UpdatePartyBody: Encodable {
    let title: String
    let desc: String
    let fee: Double
    let timeStart: String
    let timeEnd: String
    let maxPeople: Int?
    let minAge: Int
    let maxAge: Int
    let website: String
    let latitude: Double
    let longitude: Double
    let locationAddress: String
    let theme: String
    let visibility: String
    let selectedUsers: [String]

    enum CodingKeys: String, CodingKey {
        case title, fee, website, theme, visibility, latitude, longitude
        case desc = "description"
        case timeStart = "time_start"
        case timeEnd = "time_end"
        case maxPeople = "max_people"
        case minAge = "min_age"
        case maxAge = "max_age"
        case locationAddress = "location_address"
        case selectedUsers
    }
}
