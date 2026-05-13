import SwiftUI

struct AttendanceSection: View {
    let party: Party
    let now: Date

    var body: some View {
        if party.isActive, let entry = party.activeEntry {
            Section("Presence") {
                LabeledContent("Since") {
                    Text(entry.startTime, style: .time)
                }
                LabeledContent("Duration") {
                    Text(formatDuration(now.timeIntervalSince(entry.startTime)))
                }
            }
        }
    }

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

