import SwiftUI
import CoreLocation

struct HomeView: View {
    @State private var location: CLLocation?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    if let loc = location {
                        LabeledContent("Breitengrad") {
                            Text(loc.coordinate.latitude, format: .number.precision(.fractionLength(6)))
                                .font(.system(.body, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                        .frame(minHeight: 44)

                        LabeledContent("Längengrad") {
                            Text(loc.coordinate.longitude, format: .number.precision(.fractionLength(6)))
                                .font(.system(.body, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                        .frame(minHeight: 44)

                        LabeledContent("Genauigkeit") {
                            Text("\(Int(loc.horizontalAccuracy)) m")
                                .foregroundStyle(.secondary)
                        }
                        .frame(minHeight: 44)

                    } else {
                        HStack(spacing: 12) {
                            ProgressView()
                            Text("Standort wird ermittelt …")
                                .foregroundStyle(.secondary)
                        }
                        .frame(minHeight: 44)
                    }
                } header: {
                    Label("Mein Standort", systemImage: "location.fill")
                        .foregroundColor(Color.primaryPink)
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
