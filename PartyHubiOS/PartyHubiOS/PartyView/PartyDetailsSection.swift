import SwiftUI

struct PartyDetailsSection: View {
    let party: Party

    var body: some View {
        Section("Details") {

            if let hostName = party.hostDisplayName {
                LabeledContent("Veranstalter") {
                    Text(hostName)
                        .foregroundStyle(.secondary)
                }
            }

            LabeledContent("Beschreibung") {
                Text(party.partyDescription ?? "Keine Beschreibung")
                    .foregroundStyle(.secondary)
            }

            if let timeStart = party.timeStart {
                LabeledContent("Beginn") {
                    Text(timeStart, style: .date)
                    Text(timeStart, style: .time)
                }
            }

            if let timeEnd = party.timeEnd {
                LabeledContent("Ende") {
                    Text(timeEnd, style: .date)
                    Text(timeEnd, style: .time)
                }
            }

            if let maxPeople = party.maxPeople {
                LabeledContent("Max. Teilnehmer") {
                    Text("\(maxPeople)")
                }
            }

            if let minAge = party.minAge, let maxAge = party.maxAge {
                LabeledContent("Alter") {
                    Text("\(minAge) - \(maxAge) Jahre")
                }
            }

            if let website = party.website {
                LabeledContent("Website") {
                    Link(destination: URL(string: website) ?? URL(string: "https://")!) {
                        Text(website)
                            .lineLimit(1)
                    }
                }
            }

            if let fee = party.fee, fee > 0 {
                LabeledContent("Eintritt") {
                    Text("\(fee, specifier: "%.2f") €")
                }
            }
        }
    }
}
