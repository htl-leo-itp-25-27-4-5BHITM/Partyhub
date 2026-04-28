import SwiftUI

struct AttendanceSection: View {
    let party: Party
    let now: Date

    var body: some View {
        if party.isActive, let entry = party.activeEntry {
            Section("Anwesenheit") {
                LabeledContent("Seit") {
                    Text(entry.startTime, style: .time)
                }
                LabeledContent("Dauer") {
                    Text(formatDuration(now.timeIntervalSince(entry.startTime)))
                }
            }
        }
    }

    // gleiche Logik wie im Parent → einfach kopieren
    private func formatDuration(_ seconds: TimeInterval) -> String {
        let hours = Int(seconds) / 3600
        let minutes = (Int(seconds) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

