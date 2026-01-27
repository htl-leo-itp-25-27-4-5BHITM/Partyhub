import SwiftUI
import PhotosUI

struct PartyBilderView: View {
    let partyName: String
    
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var geladeneBilder: [URL] = [] // Wir speichern jetzt URLs, um die Dateien löschen zu können
    @State private var ausgewaehlteBilderZumLoeschen = Set<URL>() // Speichert, welche Bilder markiert sind
    @State private var istImBearbeitungsModus = false
    
    var body: some View {
        VStack {
            HStack {
                Text(partyName).font(.title).bold()
                Spacer()
                // Button um den Lösch-Modus zu starten
                Button(istImBearbeitungsModus ? "Fertig" : "Bearbeiten") {
                    istImBearbeitungsModus.toggle()
                    ausgewaehlteBilderZumLoeschen.removeAll()
                }
            }
            .padding()

            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 10) {
                    ForEach(geladeneBilder, id: \.self) { url in
                        ZStack(alignment: .topTrailing) {
                            // Das Bild anzeigen
                            if let daten = try? Data(contentsOf: url), let bild = UIImage(data: daten) {
                                Image(uiImage: bild)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 100, height: 100)
                                    .clipped()
                                    .cornerRadius(10)
                                    .opacity(ausgewaehlteBilderZumLoeschen.contains(url) ? 0.5 : 1.0)
                                    .onTapGesture {
                                        if istImBearbeitungsModus {
                                            waehleBildAus(url: url)
                                        }
                                    }
                            }

                            // Häkchen anzeigen, wenn im Bearbeitungsmodus
                            if istImBearbeitungsModus {
                                Image(systemName: ausgewaehlteBilderZumLoeschen.contains(url) ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(.blue)
                                    .padding(5)
                            }
                        }
                    }
                }
                .padding()
            }

            if istImBearbeitungsModus && !ausgewaehlteBilderZumLoeschen.isEmpty {
                // Löschen Button
                Button(action: loescheAusgewaehlteBilder) {
                    Label("\(ausgewaehlteBilderZumLoeschen.count) Bilder löschen", systemImage: "trash")
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.red)
                        .cornerRadius(10)
                }
                .padding()
            } else if !istImBearbeitungsModus {
                // Normaler Picker Button
                PhotosPicker(selection: $selectedItems, matching: .images) {
                    Label("Fotos hinzufügen", systemImage: "plus")
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding()
                .onChange(of: selectedItems) { _ in speichereBilder() }
            }
        }
        .onAppear { ladeBilderAusOrdner() }
    }

    // MARK: - Logik

    func waehleBildAus(url: URL) {
        if ausgewaehlteBilderZumLoeschen.contains(url) {
            ausgewaehlteBilderZumLoeschen.remove(url)
        } else {
            ausgewaehlteBilderZumLoeschen.insert(url)
        }
    }

    func loescheAusgewaehlteBilder() {
        let fm = FileManager.default
        for url in ausgewaehlteBilderZumLoeschen {
            try? fm.removeItem(at: url) // Löscht die echte Datei
        }
        ausgewaehlteBilderZumLoeschen.removeAll()
        istImBearbeitungsModus = false
        ladeBilderAusOrdner() // Liste neu laden
    }

    func speichereBilder() {
        for item in selectedItems {
            item.loadTransferable(type: Data.self) { result in
                if case .success(let data) = result, let imageData = data {
                    let folder = getPartyFolder()
                    let fileURL = folder.appendingPathComponent("Bild_\(UUID().uuidString).jpg")
                    try? imageData.write(to: fileURL)
                    DispatchQueue.main.async { ladeBilderAusOrdner() }
                }
            }
        }
        selectedItems = []
    }

    func ladeBilderAusOrdner() {
        let pfad = getPartyFolder()
        let dateien = try? FileManager.default.contentsOfDirectory(at: pfad, includingPropertiesForKeys: nil)
        self.geladeneBilder = dateien ?? []
    }

    func getPartyFolder() -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let folder = docs.appendingPathComponent(partyName)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder
    }
}
