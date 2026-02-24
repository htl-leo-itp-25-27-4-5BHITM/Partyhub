import SwiftUI
import SwiftData
import Combine

struct TimeTrackingView: View {
    @Query(sort: \TimeEntry.startTime, order: .reverse) var entries: [TimeEntry]
    @Environment(\.modelContext) private var modelContext
    
    // Dieser Timer sorgt dafür, dass die View sich jede Sekunde aktualisiert,
    // wenn du die App öffnest.
    @State private var currentTime = Date()
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            VStack {
                if entries.isEmpty {
                    ContentUnavailableView("Keine Zeiteinträge", systemImage: "clock", description: Text("Deine Arbeitszeiten erscheinen hier automatisch."))
                } else {
                    List {
                        ForEach(entries) { entry in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(entry.locationIdentifier)
                                        .font(.headline)
                                    
                                    Text("Seit \(entry.startTime.formatted(date: .omitted, time: .shortened)) Uhr")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                if let endTime = entry.endTime {
                                    // Abgeschlossene Zeit
                                    VStack(alignment: .trailing) {
                                        Text("\(entry.startTime.formatted(.dateTime.hour().minute())) bis \(endTime.formatted(.dateTime.hour().minute()))")
                                            .font(.caption)
                                            .foregroundColor(.secondary)

                                        Text(formatDuration(from: entry.startTime, to: endTime))
                                            .fontWeight(.bold)
                                            .font(.title3)
                                    }
                                } else {
                                    VStack(alignment: .trailing) {
                                        Text(formatDuration(from: entry.startTime, to: currentTime))
                                            .fontWeight(.bold)
                                            .foregroundColor(.primaryPink)
                                            .monospacedDigit()
                                        
                                        Text("aktiv")
                                            .font(.caption2)
                                            .foregroundColor(.primaryPink)
                                    }
                                }
                            }
                        }
                        .onDelete(perform: deleteEntries)
                    }
                }
                
                #if DEBUG
                debugPanel
                #endif
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
        
        // Zeigt h, m und s an
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

// MARK: - Debug View & Logic
extension TimeTrackingView {
    #if DEBUG
    private var debugPanel: some View {
        VStack(spacing: 8) {
            Divider()
            Text("Entwickler-Simulation")
                .font(.caption)
                .fontWeight(.bold)
            
            HStack(spacing: 20) {
                Button(action: simulateEntry) {
                    HStack{
                        Text("Start")
                    }.fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 25)
                        .background(Color.primaryDarkBlue)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .shadow(color:.primaryDarkBlue.opacity(0.5), radius: 10)
                    
                }
                
                Button(action: simulateExit) {
                    HStack{
                        Text("Stop")
                    }.fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 25)
                        .background(Color.primaryPink)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .shadow(color:.primaryPink.opacity(0.5), radius: 10)
                }

            }
            .padding(.bottom, 10)
        }
        .background(Color.gray.opacity(0.05))
    }
    
    func simulateEntry() {
        // Falls schon einer läuft, beenden wir ihn optional oder lassen es
        let newEntry = TimeEntry(locationIdentifier: "Schule")
        modelContext.insert(newEntry)
    }
    
    func simulateExit() {
        if let activeEntry = entries.first(where: { $0.endTime == nil }) {
            activeEntry.endTime = Date()
            try? modelContext.save()
        }
    }
    #endif
}

#Preview {
    TimeTrackingView()
        .modelContainer(for: TimeEntry.self, inMemory: true)
}
