import SwiftUI
import PhotosUI

struct PartyBilderView: View {
    let partyName: String

    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var geladeneBilder: [URL] = []
    @State private var ausgewaehlteBilderZumLoeschen = Set<URL>()
    @State private var istImBearbeitungsModus = false
    @State private var bildZumTeilen: UIImage?
    @State private var zeigeShareSheet = false

    var body: some View {
        VStack(spacing: 0) {

            // MARK: – Foto Grid
            ScrollView {
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
                                    .contextMenu {
                                        Button {
                                            bildZumTeilen = bild
                                            zeigeShareSheet = true
                                        } label: {
                                            Label("Teilen", systemImage: "square.and.arrow.up")
                                        }
                                    }
                            }

                            if istImBearbeitungsModus {
                                Image(systemName: ausgewaehlteBilderZumLoeschen.contains(url)
                                      ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(Color("primary dark blue"))
                                    .padding(5)
                            }
                        }
                    }
                }
                .padding(16)
            }
            .sheet(isPresented: $zeigeShareSheet) {
                if let image = bildZumTeilen {
                    ShareSheet(image: image)
                }
            }

            // MARK: – Bottom Buttons
            VStack(spacing: 0) {
                Divider()

                if istImBearbeitungsModus && !ausgewaehlteBilderZumLoeschen.isEmpty {
                    Button(action: loescheAusgewaehlteBilder) {
                        Label("\(ausgewaehlteBilderZumLoeschen.count) Bilder löschen", systemImage: "trash")
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .padding(16)

                } else if !istImBearbeitungsModus {
                    PhotosPicker(selection: $selectedItems, matching: .images) {
                        Label("Fotos hinzufügen", systemImage: "plus")
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color("primary dark blue"))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .padding(16)
                    .onChange(of: selectedItems.count) { _, _ in
                        speichereBilder()
                    }
                }
            }
            .background(Color(.systemGroupedBackground))
        }
        .navigationTitle(partyName)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(istImBearbeitungsModus ? "Fertig" : "Bearbeiten") {
                    istImBearbeitungsModus.toggle()
                    ausgewaehlteBilderZumLoeschen.removeAll()
                }
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
                if case .success(let data) = result,
                   let imageData = data {
                    let folder = getPartyFolder()
                    let fileURL = folder.appendingPathComponent("Bild_\(UUID().uuidString).jpg")
                    try? imageData.write(to: fileURL)
                    DispatchQueue.main.async {
                        ladeBilderAusOrdner()
                    }
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

struct ShareSheet: UIViewControllerRepresentable {
    let image: UIImage

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let activityItems: [Any] = [image]
        let controller = UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
        return controller
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
