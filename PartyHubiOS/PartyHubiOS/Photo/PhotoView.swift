import SwiftUI

struct PhotoView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Bilder für Geburtstag hochladen") {
                    PartyBilderView(partyName: "Geburtstag_2024")
                }
                .frame(minHeight: 44)
            }
            .navigationTitle("Meine Partys")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

#Preview {
    PhotoView()
}
