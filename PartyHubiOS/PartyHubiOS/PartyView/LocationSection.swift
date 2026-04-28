import SwiftUI

struct LocationSection: View {
    let party: Party
    @Binding var resolvedAddress: String

    var body: some View {
        Section("Ort") {

            LabeledContent("Adresse") {
                Button {
                    let url = URL(string: "maps://maps.apple.com/?daddr=\(party.latitude),\(party.longitude)")!
                    UIApplication.shared.open(url)
                } label: {
                    Text(resolvedAddress.isEmpty ? party.location : resolvedAddress)
                        .foregroundStyle(.blue)
                }
            }

            LabeledContent("Koordinaten") {
                Text("\(party.latitude, specifier: "%.6f"), \(party.longitude, specifier: "%.6f")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}


