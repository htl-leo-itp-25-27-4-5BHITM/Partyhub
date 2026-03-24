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
    
    private var shareURL: URL? {
        URL(string: "https://maps.apple.com/?ll=\(party.latitude),\(party.longitude)&q=\(party.name.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")
    }
    
    private var appDeepLink: URL? {
        URL(string: "partyhub://party?id=\(party.backendId)")
    }
    
    var finished: [TimeEntry] {
        party.timeEntries.filter { $0.endTime != nil }.sorted(by: { $0.startTime > $1.startTime })
    }
    
    var body: some View {
        List {
            
            Section {
                LabeledContent("Status") {
                    Text(party.isActive ? "Du bist gerade hier" : "Nicht anwesend")
                        .foregroundStyle(party.isActive ? .green : .secondary)
                }
                .frame(minHeight: 44)
                
                if party.isActive, let entry = party.activeEntry {
                    LabeledContent("Dauer") {
                        Text(formatDuration(entry.startTime, to: now))
                            .font(.system(.body, design: .monospaced))
                            .foregroundStyle(.green)
                            .monospacedDigit()
                    }
                    .frame(minHeight: 44)
                }
            }
            
            if !finished.isEmpty {
                Section("Vergangene Besuche") {
                    ForEach(finished) { entry in
                        LabeledContent {
                            if let end = entry.endTime {
                                Text(formatDuration(entry.startTime, to: end))
                                    .font(.system(.body, design: .monospaced))
                                    .foregroundStyle(.secondary)
                            }
                        } label: {
                            Text(entry.startTime, style: .date)
                                .font(.body)
                        }
                        .frame(minHeight: 44)
                    }
                    .onDelete(perform: deleteEntries)
                }
            }
            
            // MARK: – Debug
#if DEBUG
            Section("Debug") {
                HStack(spacing: 12) {
                    Button {
                        guard party.activeEntry == nil else { return }
                        let entry = TimeEntry(locationIdentifier: party.name)
                        party.timeEntries.append(entry)
                        modelContext.insert(entry)
                        try? modelContext.save()
                    } label: {
                        Text("Betreten")
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.primaryDarkBlue)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    
                    Button {
                        party.activeEntry?.endTime = .now
                        try? modelContext.save()
                    } label: {
                        Text("Verlassen")
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.primaryPink)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
            }
#endif
            
            // MARK: – Fotos (ganz unten)
            Section("Fotos") {
                if !geladeneBilder.isEmpty {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 8) {
                        ForEach(geladeneBilder, id: \.self) { url in
                            ZStack(alignment: .topTrailing) {
                                if let daten = try? Data(contentsOf: url),
                                   let bild = UIImage(data: daten) {
                                    Image(uiImage: bild)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 100, height: 100)
                                        .clipped()
                                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                        .opacity(ausgewaehlteBilderZumLoeschen.contains(url) ? 0.5 : 1.0)
                                        .onTapGesture {
                                            if istImBearbeitungsModus {
                                                waehleBildAus(url: url)
                                            }
                                        }
                                }
                                if istImBearbeitungsModus {
                                    Image(systemName: ausgewaehlteBilderZumLoeschen.contains(url)
                                          ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(Color.primaryDarkBlue)
                                    .padding(5)
                                }
                            }
                        }
                    }
                    .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
                }
                
                HStack(spacing: 12) {
                    if istImBearbeitungsModus && !ausgewaehlteBilderZumLoeschen.isEmpty {
                        Button(action: loescheAusgewaehlteBilder) {
                            Text("\(ausgewaehlteBilderZumLoeschen.count) löschen")
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.red)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    } else {
                        PhotosPicker(selection: $selectedItems, matching: .images) {
                            Text("Fotos hinzufügen")
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(Color.primaryDarkBlue)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .onChange(of: selectedItems.count) { _, _ in
                            speichereBilder()
                        }
                    }
                    
                    if !geladeneBilder.isEmpty {
                        Button {
                            istImBearbeitungsModus.toggle()
                            ausgewaehlteBilderZumLoeschen.removeAll()
                        } label: {
                            Text(istImBearbeitungsModus ? "Fertig" : "Bearbeiten")
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                        }
                        .buttonStyle(.bordered)
                        .tint(Color.primaryDarkBlue)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
                .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
            }
        }
        .navigationTitle(party.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
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
        .onAppear {
            ladeBilderAusOrdner()
            partyText = "\(party.name)\n \(party.location)\n https://maps.apple.com/?ll=\(party.latitude),\(party.longitude)"
        }
        .onReceive(timer) { now = $0 }
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
        ausgewaehlteBilderZumLoeschen.removeAll()
        istImBearbeitungsModus = false
        ladeBilderAusOrdner()
    }
    
    func speichereBilder() {
        for item in selectedItems {
            item.loadTransferable(type: Data.self) { result in
                if case .success(let data) = result, let imageData = data {
                    let folder = getPartyFolder()
                    let fileURL = folder.appendingPathComponent("Bild_\(UUID().uuidString).jpg")
                    try? imageData.write(to: fileURL)
                    DispatchQueue.main.async {
                        self.ladeBilderAusOrdner()
                    }
                }
            }
        }
        selectedItems = []
    }
    
    func ladeBilderAusOrdner() {
        let pfad = getPartyFolder()
        geladeneBilder = (try? FileManager.default.contentsOfDirectory(at: pfad, includingPropertiesForKeys: nil)) ?? []
    }
    
    func getPartyFolder() -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let folder = docs.appendingPathComponent(party.name)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder
    }
    
    func deleteEntries(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(finished[index])
        }
    }
    
    func formatDuration(_ start: Date, to end: Date) -> String {
        let diff = Int(end.timeIntervalSince(start))
        let h = diff / 3600
        let m = (diff % 3600) / 60
        let s = diff % 60
        return h > 0
        ? String(format: "%dh %02dm %02ds", h, m, s)
        : String(format: "%dm %02ds", m, s)
    }
}
