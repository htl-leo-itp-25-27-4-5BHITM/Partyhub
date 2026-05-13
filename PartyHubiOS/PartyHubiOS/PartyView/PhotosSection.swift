import SwiftUI
import PhotosUI
struct PhotosSection: View {
    @Binding var geladeneBilder: [URL]
    @Binding var selectedItems: [PhotosPickerItem]
    @Binding var ausgewaehlteBilderZumLoeschen: Set<URL>
    @Binding var istImBearbeitungsModus: Bool
    
    let onSaveImage: (UIImage) -> Void
    let onDelete: () -> Void
    
    var body: some View {
        Section("Photos") {
            Text("This is where your photos go")
        }
    }
}
