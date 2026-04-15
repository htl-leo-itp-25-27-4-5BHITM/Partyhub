import SwiftUI
import SwiftData
import PhotosUI
import Combine

struct PartyDetailView: View {
    @Bindable var party: Party
    @Environment(\.modelContext) private var modelContext
    @State private var now = Date()
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var geladeneBilder: [URL] = []
    @State private var ausgewaehlteBilderZumLoeschen = Set<URL>()
    @State private var istImBearbeitungsModus = false
    @State private var partyText: String = ""
    
    // MARK: - Edit Feature (NEU)
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
    
    // MARK: - Owner Check (NEU)
    private var currentUserId: Int64? {
        UserDefaults.standard.object(forKey: "currentUserId") as? Int64
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
            Section("Details") {
                LabeledContent("Beschreibung") {
                    Text(party.partyDescription ?? "Keine Beschreibung")
                        .foregroundStyle(.secondary)
                }
                
                if let timeStart = party.timeStart {
                    LabeledContent("Beginn") {
                        Text(timeStart, style: .date)
                        Text(timeStart, style: .time)
                    }
                }
                
                if let timeEnd = party.timeEnd {
                    LabeledContent("Ende") {
                        Text(timeEnd, style: .date)
                        Text(timeEnd, style: .time)
                    }
                }
                
                if let maxPeople = party.maxPeople {
                    LabeledContent("Max. Teilnehmer") {
                        Text("\(maxPeople)")
                    }
                }
                
                if let minAge = party.minAge, let maxAge = party.maxAge {
                    LabeledContent("Alter") {
                        Text("\(minAge) - \(maxAge) Jahre")
                    }
                }
                
                if let website = party.website {
                    LabeledContent("Website") {
                        Link(destination: URL(string: website) ?? URL(string: "https://")!) {
                            Text(website)
                                .lineLimit(1)
                        }
                    }
                }
                
                if let fee = party.fee, fee > 0 {
                    LabeledContent("Eintritt") {
                        Text("\(fee, specifier: "%.2f") €")
                    }
                }
            }
            
            // MARK: - Location Section
            Section("Ort") {
                LabeledContent("Adresse") {
                    Text(party.location)
                }
                
                LabeledContent("Koordinaten") {
                    Text("\(party.latitude, specifier: "%.6f"), \(party.longitude, specifier: "%.6f")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            
            // MARK: - Time Tracking
            if party.isActive, let entry = party.activeEntry {
                Section("Anwesenheit") {
                    LabeledContent("Seit") {
                        Text(entry.startTime, style: .time)
                    }
                    LabeledContent("Dauer") {
                        Text(formatDuration(now.timeIntervalSince(entry.startTime)))
                    }
                }
            }
            
            if !finished.isEmpty {
                Section("Vergangene Besuche") {
                    ForEach(finished) { entry in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(entry.startTime, style: .date)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Text("\(entry.startTime, style: .time) - \(entry.endTime!, style: .time)")
                            }
                            Spacer()
                            Text(String(format: "%.1fh", entry.durationInHours))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            
            #if DEBUG
            // MARK: - Debug Section
            Section("🔧 Debug Tools") {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Party betreten/verlassen:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Button {
                        simulateEnterParty()
                    } label: {
                        Label("Party betreten (simulieren)", systemImage: "arrow.right.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.green)
                    
                    Button {
                        simulateLeaveParty()
                    } label: {
                        Label("Party verlassen (simulieren)", systemImage: "arrow.left.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.orange)
                    
                    Divider()
                    
                    Text("Benachrichtigungen:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Button {
                        simulatePartyUpdate()
                    } label: {
                        Label("Beschreibung ändern (Push)", systemImage: "bell.badge.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.blue)
                    
                    Button {
                        testLocalNotification()
                    } label: {
                        Label("Test Lokale Notification", systemImage: "bell.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.purple)
                    
                    Divider()
                    
                    Text("User-Status:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Button {
                        printDebugInfo()
                    } label: {
                        Label("Debug Info (Konsole)", systemImage: "ladybug.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.gray)
                    
                    if !isOwner {
                        Button {
                            becomeOwner()
                        } label: {
                            Label("Als Owner einloggen", systemImage: "crown.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .tint(.yellow)
                    }
                }
                .padding(.vertical, 4)
            }
            #endif
            
            // MARK: - Photos Section
            Section("Fotos") {
                if geladeneBilder.isEmpty && !istImBearbeitungsModus {
                    Text("Keine Fotos vorhanden")
                        .foregroundStyle(.secondary)
                }
                
                if !geladeneBilder.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        LazyHStack(spacing: 10) {
                            ForEach(geladeneBilder, id: \.self) { url in
                                if let uiImage = UIImage(contentsOfFile: url.path()) {
                                    ZStack(alignment: .topTrailing) {
                                        Image(uiImage: uiImage)
                                            .resizable()
                                            .scaledToFill()
                                            .frame(width: 200, height: 200)
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 10)
                                                    .stroke(ausgewaehlteBilderZumLoeschen.contains(url) ? Color("primary pink") : Color.clear, lineWidth: 3)
                                            )
                                            .onTapGesture {
                                                if istImBearbeitungsModus {
                                                    waehleBildAus(url: url)
                                                }
                                            }
                                        
                                        if istImBearbeitungsModus {
                                            Image(systemName: ausgewaehlteBilderZumLoeschen.contains(url) ? "checkmark.circle.fill" : "circle")
                                                .font(.title2)
                                                .foregroundStyle(Color("primary pink"))
                                                .padding(8)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    .listRowInsets(EdgeInsets())
                }
                
                PhotosPicker(selection: $selectedItems, maxSelectionCount: 10, matching: .images) {
                    Label("Fotos hinzufügen", systemImage: "photo.on.rectangle.angled")
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .buttonStyle(.bordered)
                .tint(Color("primary pink"))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .onChange(of: selectedItems) { _, newValue in
                    Task {
                        for item in newValue {
                            if let data = try? await item.loadTransferable(type: Data.self),
                               let uiImage = UIImage(data: data) {
                                speicherBild(image: uiImage)
                            }
                        }
                        selectedItems.removeAll()
                    }
                }
                
                if !geladeneBilder.isEmpty {
                    Button {
                        withAnimation {
                            istImBearbeitungsModus.toggle()
                        }
                        if !istImBearbeitungsModus {
                            ausgewaehlteBilderZumLoeschen.removeAll()
                        }
                    } label: {
                        Text(istImBearbeitungsModus ? "Fertig" : "Bearbeiten")
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .buttonStyle(.bordered)
                    .tint(Color("primary dark blue"))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    
                    if istImBearbeitungsModus && !ausgewaehlteBilderZumLoeschen.isEmpty {
                        Button(role: .destructive) {
                            loescheAusgewaehlteBilder()
                            ausgewaehlteBilderZumLoeschen.removeAll()
                        } label: {
                            Text("Ausgewählte Löschen (\(ausgewaehlteBilderZumLoeschen.count))")
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                        }
                        .buttonStyle(.bordered)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
            }
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
        guard let hostId = party.hostUserId else {
            print("❌ Party hat keine hostUserId")
            return
        }
        
        UserDefaults.standard.set(hostId, forKey: "currentUserId")
        print("✅ User ID gesetzt auf: \(hostId) (Owner)")
    }
    #endif
    
    // MARK: - Update Party on Backend (NEU)
    func updatePartyOnBackend(_ updatedParty: PartyEditData) async {
        guard let currentUserId = currentUserId else {
            errorMessage = "Du bist nicht angemeldet"
            showError = true
            return
        }
        
        // Berechtigungsprüfung
        guard isOwner else {
            errorMessage = "Du hast keine Berechtigung, diese Party zu bearbeiten"
            showError = true
            return
        }
        
        isUpdating = true
        
        do {
            let baseURL = "https://it220274.cloud.htl-leonding.ac.at"
            guard let url = URL(string: "\(baseURL)/api/party/\(party.backendId)?user=\(currentUserId)") else {
                throw URLError(.badURL)
            }
            
            // Payload vorbereiten
            let payload: [String: Any] = [
                "title": updatedParty.title,
                "description": updatedParty.description,
                "location_address": updatedParty.location,
                "latitude": updatedParty.latitude,
                "longitude": updatedParty.longitude,
                "time_start": ISO8601DateFormatter().string(from: updatedParty.timeStart ?? Date()),
                "time_end": ISO8601DateFormatter().string(from: updatedParty.timeEnd ?? Date()),
                "max_people": updatedParty.maxPeople ?? 0,
                "min_age": updatedParty.minAge ?? 0,
                "max_age": updatedParty.maxAge ?? 99,
                "website": updatedParty.website ?? "",
                "fee": updatedParty.fee ?? 0.0,
                "category_id": updatedParty.categoryId ?? 1
            ]
            
            var request = URLRequest(url: url)
            request.httpMethod = "PUT"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            
            let (_, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                throw URLError(.badServerResponse)
            }
            
            // Lokale Daten aktualisieren
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
            }
            
            print("✅ Party erfolgreich aktualisiert")
            
        } catch {
            errorMessage = "Fehler beim Speichern: \(error.localizedDescription)"
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
