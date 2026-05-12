import SwiftUI
import SwiftData
import PhotosUI
import Combine
import CoreLocation

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
    
    // MARK: - Notification System
    @StateObject private var notificationManager = PartyNotificationManager.shared
    @State private var hasCheckedUpdates = false
    
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
    
    var body: some View {
        List {
            
            // MARK: - Update Badge Section
            if unreadUpdateCount > 0 {
                Section {
                    HStack {
                        Image(systemName: "bell.badge.fill")
                            .foregroundColor(.red)
                        Text("\(unreadUpdateCount) neue Update\(unreadUpdateCount == 1 ? "" : "s")")
                            .font(.subheadline)
                            .foregroundColor(.red)
                        Spacer()
                        Text("Du siehst sie gerade")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
            
            // MARK: - Owner Status (NEU)
            if isOwner {
                Section {
                    HStack {
                        Image(systemName: "crown.fill")
                            .foregroundColor(.yellow)
                        Text("Du bist der Veranstalter")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
            
            Section {
                LabeledContent("Status") {
                    Text(party.isActive ? "Du bist gerade hier" : "Nicht anwesend")
                        .foregroundStyle(party.isActive ? .green : .gray)
                        .fontWeight(.semibold)
                }
            }
            
            // MARK: - Party Details Section
            PartyDetailsSection(party: party)
            
            // MARK: - Location Section
            LocationSection(
                party: party,
                resolvedAddress: $resolvedAddress
            )

            Section("Teilnehmer") {
                NavigationLink {
                    PartyAttendeeMapView(
                        party: party,
                        locationManager: locationManager
                    )
                } label: {
                    Label("Teilnehmer auf Karte anzeigen", systemImage: "person.2.fill")
                }
                
                NavigationLink {
                    UserLocationListView(parties: [party])
                } label: {
                    Label("Teilnehmerliste", systemImage: "list.bullet")
                }
            }
            
            // MARK: - Time Tracking
            AttendanceSection(party: party, now: now)
            PastVisitsSection(entries: finished)
            
            
            // MARK: - Debug Section#if DEBUG
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
            
            
            // MARK: - Photos Section
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
            .navigationTitle(party.name)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
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
                                Text("Maps-Link teilen")
                            }
                        }
                        ShareLink(item: partyText) {
                            Text("Als Text teilen")
                        }
                        if let deepLink = appDeepLink {
                            ShareLink(item: deepLink) {
                                Label("App-Link teilen", systemImage: "antenna.radiowaves.left.and.right")
                            }
                        }
                    } label: {
                        Text("Teilen")
                    }
                }
            }
            .sheet(isPresented: $showEditSheet) {
                PartyEditView(party: party) { updatedParty in
                    Task {
                        await updatePartyOnBackend(updatedParty)
                    }
                }
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
            .alert("Fehler", isPresented: $showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
            .onAppear {
                print("🔍 === PARTY DETAIL DEBUG ===")
                print("🔍 Party Name: \(party.name)")
                print("🔍 Party Backend ID: \(party.backendId)")
                print("🔍 Party Host User ID: \(String(describing: party.hostUserId))")
                print("🔍 Current User ID (UserDefaults): \(String(describing: currentUserId))")
                print("🔍 Is Owner: \(isOwner)")
                print("🔍 === END DEBUG ===\n")
                
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
            }
            .onReceive(timer) { now = $0 }
        }
        
        // MARK: - Debug Functions
#if DEBUG
        func simulateEnterParty() {
            print("🟢 Simuliere: Party betreten")
            
            // Erstelle neuen TimeEntry mit locationIdentifier
            let entry = TimeEntry(
                locationIdentifier: party.name,
                startTime: Date(),
            )
            party.timeEntries.append(entry)
            
            try? modelContext.save()
            print("✅ TimeEntry erstellt: \(entry.startTime)")
        }
        
        func simulateLeaveParty() {
            print("🔴 Simuliere: Party verlassen")
            
            guard let activeEntry = party.activeEntry else {
                print("❌ Keine aktive Session vorhanden")
                return
            }
            
            activeEntry.endTime = Date()
            try? modelContext.save()
            print("✅ TimeEntry beendet: \(activeEntry.durationInHours)h")
        }
        
        func simulatePartyUpdate() {
            print("📢 Simuliere: Party-Update (Beschreibung ändern)")
            
            Task {
                do {
                    let baseURL = "https://it220274.cloud.htl-leonding.ac.at"
                    guard let currentUserId = currentUserId else {
                        print("❌ Kein User eingeloggt")
                        return
                    }
                    
                    guard let url = URL(string: "\(baseURL)/api/party/\(party.backendId)?user=\(currentUserId)") else {
                        print("❌ Ungültige URL")
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
                        print("✅ Party erfolgreich aktualisiert - Push sollte gesendet werden!")
                    } else {
                        print("❌ Update fehlgeschlagen")
                    }
                } catch {
                    print("❌ Fehler: \(error)")
                }
            }
        }
        
        func testLocalNotification() {
            print("🔔 Sende Test-Notification")
            
            let content = UNMutableNotificationContent()
            content.title = "Test Notification"
            content.body = "Party '\(party.name)' wurde aktualisiert!"
            content.sound = .default
            
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 2, repeats: false)
            let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("❌ Notification Fehler: \(error)")
                } else {
                    print("✅ Notification geplant (in 2 Sekunden)")
                }
            }
        }
        
        func printDebugInfo() {
            print("\n🐛 === MANUAL DEBUG INFO ===")
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
            print("ℹ️ becomeOwner() is deprecated - user authentication is handled by AuthManager")
        }
#endif
        
        // MARK: - Update Party on Backend (FIXED)
        func updatePartyOnBackend(_ updatedParty: PartyEditData) async {
            guard let currentUserId = currentUserId else {
                errorMessage = "Du bist nicht angemeldet"
                showError = true
                return
            }
            
            // Berechtigungsprüfung
            guard isOwner else {
                errorMessage = "Du hast keine Berechtigung (Owner-Check fehlgeschlagen)"
                showError = true
                return
            }
            
            isUpdating = true
            
            do {
                let baseURL = "https://it220274.cloud.htl-leonding.ac.at"
                guard let url = URL(string: "\(baseURL)/api/parties/\(party.backendId)?user=\(currentUserId)") else {
                    throw URLError(.badURL)
                }
                
                // 1. Der Formatter muss exakt dem @JsonFormat entsprechen
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
                
                let payload: [String: Any] = [
                    "title": updatedParty.title,
                    "description": updatedParty.description,
                    "fee": Double(updatedParty.fee ?? 0.0),
                    "time_start": dateFormatter.string(from: updatedParty.timeStart ?? Date()),
                    "time_end": dateFormatter.string(from: updatedParty.timeEnd ?? Date()),
                    "max_people": Int(updatedParty.maxPeople ?? 0),
                    "min_age": Int(updatedParty.minAge ?? 16),
                    "max_age": Int(updatedParty.maxAge ?? 99),
                    "website": updatedParty.website ?? "",
                    "latitude": updatedParty.latitude,
                    "longitude": updatedParty.longitude,
                    "location_address": updatedParty.location, // WICHTIG: Java Feldname ist location_address
                    "theme": "Standard", // Pflichtfeld im Dto
                    "visibility": "public", // Pflichtfeld im Dto
                    "selectedUsers": [] // Pflichtfeld im Dto (leere Liste reicht)
                ]
                var request = URLRequest(url: url)
                request.httpMethod = "PUT"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.setValue("application/json", forHTTPHeaderField: "Accept")
                
                request.httpBody = try JSONSerialization.data(withJSONObject: payload)
                
                let (data, response) = try await URLSession.shared.data(for: request)
                
                if let httpResponse = response as? HTTPURLResponse {
                    print("📡 Status Code: \(httpResponse.statusCode)")
                    
                    if !(200...299).contains(httpResponse.statusCode) {
                        // DEBUG: Was sagt der Server genau?
                        if let errorString = String(data: data, encoding: .utf8) {
                            print("❌ SERVER FEHLERMELDUNG: \(errorString)")
                            errorMessage = "Server sagt: \(errorString)"
                        } else {
                            errorMessage = "Fehler: Status \(httpResponse.statusCode)"
                        }
                        showError = true
                        isUpdating = false
                        return
                    }
                }
                
                // Lokale Daten aktualisieren auf dem Main-Thread
                await MainActor.run {
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
                    
                    // SwiftData speichern
                    try? modelContext.save()
                }
                
                print("✅ Party erfolgreich aktualisiert")
                
            } catch {
                print("❌ Request Fehler: \(error)")
                errorMessage = "Verbindungsfehler: \(error.localizedDescription)"
                showError = true
            }
            
            isUpdating = false
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
    }
    
    // MARK: - Party Edit Data Model (NEU)
    struct PartyEditData {
        var title: String
        var description: String
        var location: String
        var latitude: Double
        var longitude: Double
        var timeStart: Date?
        var timeEnd: Date?
        var maxPeople: Int?
        var minAge: Int?
        var maxAge: Int?
        var website: String?
        var fee: Double?
        var categoryId: Int?
    }
    
    // MARK: - Party Edit View (NEU)
    struct PartyEditView: View {
        @Environment(\.dismiss) private var dismiss
        let party: Party
        let onSave: (PartyEditData) -> Void
        
        @State private var title: String
        @State private var description: String
        @State private var location: String
        @State private var timeStart: Date
        @State private var timeEnd: Date
        @State private var maxPeople: String
        @State private var minAge: String
        @State private var maxAge: String
        @State private var website: String
        @State private var fee: String
        
        init(party: Party, onSave: @escaping (PartyEditData) -> Void) {
            self.party = party
            self.onSave = onSave
            
            _title = State(initialValue: party.name)
            _description = State(initialValue: party.partyDescription ?? "")
            _location = State(initialValue: party.location)
            _timeStart = State(initialValue: party.timeStart ?? Date())
            _timeEnd = State(initialValue: party.timeEnd ?? Date())
            _maxPeople = State(initialValue: party.maxPeople.map { "\($0)" } ?? "")
            _minAge = State(initialValue: party.minAge.map { "\($0)" } ?? "18")
            _maxAge = State(initialValue: party.maxAge.map { "\($0)" } ?? "99")
            _website = State(initialValue: party.website ?? "")
            _fee = State(initialValue: party.fee.map { String(format: "%.2f", $0) } ?? "0.00")
        }
        
        var body: some View {
            NavigationView {
                Form {
                    Section("Allgemein") {
                        TextField("Titel", text: $title)
                        TextField("Beschreibung", text: $description, axis: .vertical)
                            .lineLimit(3...6)
                    }
                    
                    Section("Ort") {
                        TextField("Adresse", text: $location)
                    }
                    
                    Section("Zeit") {
                        DatePicker("Beginn", selection: $timeStart)
                        DatePicker("Ende", selection: $timeEnd)
                    }
                    
                    Section("Teilnehmer") {
                        TextField("Max. Teilnehmer", text: $maxPeople)
                            .keyboardType(.numberPad)
                        HStack {
                            TextField("Min. Alter", text: $minAge)
                                .keyboardType(.numberPad)
                            Text("-")
                            TextField("Max. Alter", text: $maxAge)
                                .keyboardType(.numberPad)
                        }
                    }
                    
                    Section("Zusatzinfos") {
                        TextField("Website", text: $website)
                            .keyboardType(.URL)
                            .textInputAutocapitalization(.never)
                        TextField("Eintritt (€)", text: $fee)
                            .keyboardType(.decimalPad)
                    }
                }
                .navigationTitle("Party bearbeiten")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Abbrechen") {
                            dismiss()
                        }
                    }
                    
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Speichern") {
                            let editData = PartyEditData(
                                title: title,
                                description: description,
                                location: location,
                                latitude: party.latitude,
                                longitude: party.longitude,
                                timeStart: timeStart,
                                timeEnd: timeEnd,
                                maxPeople: Int(maxPeople),
                                minAge: Int(minAge),
                                maxAge: Int(maxAge),
                                website: website.isEmpty ? nil : website,
                                fee: Double(fee.replacingOccurrences(of: ",", with: ".")),
                                categoryId: party.categoryId
                            )
                            onSave(editData)
                            dismiss()
                        }
                        .fontWeight(.semibold)
                        .disabled(title.isEmpty || location.isEmpty)
                    }
                }
            }
        }
    }
