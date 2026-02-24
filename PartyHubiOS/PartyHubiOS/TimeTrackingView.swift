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
                                        // Hier fügen wir das "bis" und die Endzeit hinzu
                                        Text("\(entry.startTime.formatted(.dateTime.hour().minute())) bis \(endTime.formatted(.dateTime.hour().minute()))")
                                            .font(.caption)
                                            .foregroundColor(.secondary)

                                        Text(formatDuration(from: entry.startTime, to: endTime))
                                            .fontWeight(.bold)
                                            .font(.title3) // Etwas größer, damit es als Ergebnis hervorsticht
                                    }
                                } else {
                                    // AKTIVER TIMER (wenn App geöffnet wird)
                                    VStack(alignment: .trailing) {
                                        Text(formatDuration(from: entry.startTime, to: currentTime))
                                            .fontWeight(.bold)
                                            .foregroundColor(.green)
                                            .monospacedDigit() // Verhindert, dass Zahlen beim Zählen springen
                                        
                                        Text("aktiv")
                                            .font(.caption2)
                                            .foregroundColor(.green)
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
            // Hier wird die lokale Zeit aktualisiert, damit der Timer zählt
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
                    Label("Start", systemImage: "play.fill")
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
                
                Button(action: simulateExit) {
                    Label("Stopp", systemImage: "stop.fill")
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
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
