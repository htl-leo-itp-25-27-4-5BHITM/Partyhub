import SwiftUI
import SwiftData
import Combine

struct PartyDetailView: View {
    @Bindable var party: Party
    @Environment(\.modelContext) private var modelContext
    @State private var now = Date()
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var finished: [TimeEntry] {
        party.timeEntries.filter { $0.endTime != nil }.sorted(by: { $0.startTime > $1.startTime })
    }

    var body: some View {
        List {

            // MARK: – Status Section
            Section {
                LabeledContent("Status") {
                    Text(party.isActive ? "Du bist gerade hier" : "Nicht anwesend")
                        .foregroundStyle(party.isActive ? .green : .secondary)
                }
                .frame(minHeight: 44)

                if party.isActive, let entry = party.activeEntry {
                    LabeledContent("Dauer") {
                        Text(formatDuration(entry.startTime, to: now))
                            .font(.system(.body, design: .monospaced))
                            .foregroundStyle(.green)
                            .monospacedDigit()
                    }
                    .frame(minHeight: 44)
                }
            }

            // MARK: – Vergangene Besuche
            if !finished.isEmpty {
                Section("Vergangene Besuche") {
                    ForEach(finished) { entry in
                        LabeledContent {
                            if let end = entry.endTime {
                                Text(formatDuration(entry.startTime, to: end))
                                    .font(.system(.body, design: .monospaced))
                                    .foregroundStyle(.secondary)
                            }
                        } label: {
                            Text(entry.startTime, style: .date)
                                .font(.body)
                        }
                        .frame(minHeight: 44)
                    }
                    .onDelete(perform: deleteEntries)
                }
            }

            // MARK: – Debug Buttons
            #if DEBUG
            Section("Debug") {
                HStack(spacing: 12) {
                    Button {
                        guard party.activeEntry == nil else { return }
                        let entry = TimeEntry(locationIdentifier: party.name)
                        party.timeEntries.append(entry)
                        modelContext.insert(entry)
                        try? modelContext.save()
                    } label: {
                        Text("Betreten")
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.primaryDarkBlue)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                    Button {
                        party.activeEntry?.endTime = .now
                        try? modelContext.save()
                    } label: {
                        Text("Verlassen")
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.primaryPink)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
            }
            #endif
        }
        .navigationTitle(party.name)
        .navigationBarTitleDisplayMode(.large)
        .onReceive(timer) { now = $0 }
    }

    func deleteEntries(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(finished[index])
        }
    }

    func formatDuration(_ start: Date, to end: Date) -> String {
        let diff = Int(end.timeIntervalSince(start))
        let h = diff / 3600
        let m = (diff % 3600) / 60
        let s = diff % 60
        return h > 0
            ? String(format: "%dh %02dm %02ds", h, m, s)
            : String(format: "%dm %02ds", m, s)
    }
}
