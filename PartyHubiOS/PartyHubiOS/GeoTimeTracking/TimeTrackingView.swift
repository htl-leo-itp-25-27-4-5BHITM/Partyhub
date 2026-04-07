import SwiftUI
import SwiftData
import Combine

struct TimeTrackingView: View {
    @Query(sort: \TimeEntry.startTime, order: .reverse) var entries: [TimeEntry]
    @Environment(\.modelContext) private var modelContext
    @State private var currentTime = Date()
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            VStack {
                if entries.isEmpty {
                    ContentUnavailableView("Keine Zeiteinträge", systemImage: "clock", description: Text("Deine Zeiten erscheinen hier automatisch."))
                } else {
                    List {
                        ForEach(entries) { entry in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(entry.locationIdentifier)
                                        .font(.headline)
                                    Text("Seit \(entry.startTime.formatted(date: .omitted, time: .shortened)) Uhr")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                if let endTime = entry.endTime {
                                    VStack(alignment: .trailing) {
                                        Text("\(entry.startTime.formatted(.dateTime.hour().minute())) bis \(endTime.formatted(.dateTime.hour().minute()))")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                        Text(formatDuration(from: entry.startTime, to: endTime))
                                            .fontWeight(.bold)
                                            .font(.title3)
                                    }
                                } else {
                                    VStack(alignment: .trailing) {
                                        Text(formatDuration(from: entry.startTime, to: currentTime))
                                            .fontWeight(.bold)
                                            .foregroundStyle(Color("primary pink"))
                                            .monospacedDigit()
                                        Text("aktiv")
                                            .font(.caption2)
                                            .foregroundStyle(Color("primary pink"))
                                    }
                                }
                            }
                        }
                        .onDelete(perform: deleteEntries)
                    }
                }
            }
            .navigationTitle("Time Tracking")
            .onReceive(timer) { input in
                currentTime = input
            }
        }
    }

    private func formatDuration(from start: Date, to end: Date) -> String {
        let diff = end.timeIntervalSince(start)
        let hours = Int(diff) / 3600
        let minutes = (Int(diff) % 3600) / 60
        let seconds = (Int(diff) % 60)
        if hours > 0 {
            return String(format: "%dh %02dm %02ds", hours, minutes, seconds)
        } else {
            return String(format: "%dm %02ds", minutes, seconds)
        }
    }

    private func deleteEntries(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(entries[index])
        }
    }
}

#Preview {
    TimeTrackingView()
        .modelContainer(for: TimeEntry.self, inMemory: true)
}
