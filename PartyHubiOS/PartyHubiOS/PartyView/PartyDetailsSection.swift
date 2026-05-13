import SwiftUI

struct PartyDetailsSection: View {
    let party: Party

    var body: some View {
        Section("Details") {

            if let hostName = party.hostDisplayName, let hostUserId = party.hostUserId {
                HStack(spacing: 12) {
                    UserProfileImageView(userId: Int(hostUserId), size: 50, showBorder: false)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Organiser")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(hostName)
                            .font(.subheadline)
                            .foregroundStyle(.primary)
                    }
                    Spacer()
                }
                .frame(minHeight: 60)
            } else if let hostName = party.hostDisplayName {
                LabeledContent("Organiser") {
                    Text(hostName)
                        .foregroundStyle(.secondary)
                }
            }

            LabeledContent("Description") {
                Text(party.partyDescription ?? "No Description")
                    .foregroundStyle(.secondary)
            }

            if let timeStart = party.timeStart {
                LabeledContent("Start") {
                    Text(timeStart, style: .date)
                    Text(timeStart, style: .time)
                }
            }

            if let timeEnd = party.timeEnd {
                LabeledContent("End") {
                    Text(timeEnd, style: .date)
                    Text(timeEnd, style: .time)
                }
            }

            if let maxPeople = party.maxPeople {
                LabeledContent("Max. of participants") {
                    Text("\(maxPeople)")
                }
            }

            if let minAge = party.minAge, let maxAge = party.maxAge {
                LabeledContent("Age") {
                    Text("\(minAge) - \(maxAge) years")
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
                LabeledContent("Admission") {
                    Text("\(fee, specifier: "%.2f") €")
                }
            }
        }
    }
}
