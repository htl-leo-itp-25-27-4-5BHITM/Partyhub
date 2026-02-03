import SwiftUI
import PhotosUI

struct PartyBilderView: View {
    let partyName: String
    
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var geladeneBilder: [URL] = []
    @State private var ausgewaehlteBilderZumLoeschen = Set<URL>()
    @State private var istImBearbeitungsModus = false
    
    var body: some View {
        VStack {
            HStack {
                Text(partyName).font(.title).bold()
                Spacer()
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
            try? fm.removeItem(at: url) 
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
