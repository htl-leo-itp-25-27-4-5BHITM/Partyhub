import SwiftUI

struct PhotoView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Photos for Birthady upload") {
                    PartyBilderView(partyName: "Birthday_2026")
                }
                .frame(minHeight: 44)
            }
            .navigationTitle("My Partys")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

#Preview {
    PhotoView()
}
