import SwiftUI
import CoreLocation

struct HomeView: View {
    @State private var location: CLLocation?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    if let loc = location {
                        LabeledContent("Latitude") {
                            Text(loc.coordinate.latitude, format: .number.precision(.fractionLength(6)))
                                .font(.system(.body, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                        .frame(minHeight: 44)

                        LabeledContent("Longitude") {
                            Text(loc.coordinate.longitude, format: .number.precision(.fractionLength(6)))
                                .font(.system(.body, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                        .frame(minHeight: 44)

                        LabeledContent("Accuracy") {
                            Text("\(Int(loc.horizontalAccuracy)) m")
                                .foregroundStyle(.secondary)
                        }
                        .frame(minHeight: 44)

                    } else {
                        HStack(spacing: 12) {
                            ProgressView()
                            Text("Locating your location …")
                                .foregroundStyle(.secondary)
                        }
                        .frame(minHeight: 44)
                    }
                } header: {
                    Label("My Location", systemImage: "location.fill")
                        .foregroundStyle(Color("primary pink"))
                }
            }
            .navigationTitle("Home")
            .navigationBarTitleDisplayMode(.large)
        }
        .onAppear {
            LocationDisplayHelper.shared.onUpdate = { loc in
                self.location = loc
            }
            LocationDisplayHelper.shared.start()
        }
    }
}

#Preview {
    HomeView()
}
