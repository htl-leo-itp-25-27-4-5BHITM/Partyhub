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
        ScrollView {
            VStack(spacing: 24) {
                // Status
                VStack(spacing: 8) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(party.isActive ? Color.green : Color.gray)
                            .frame(width: 10, height: 10)
                        Text(party.isActive ? "Du bist gerade hier" : "Nicht anwesend")
                            .font(.subheadline)
                            .foregroundColor(party.isActive ? .green : .secondary)
                    }
                    HStack(spacing: 4) {
                        Text(party.location)
                    }
                    .foregroundColor(.secondary)
                    Text("\(party.latitude, specifier: "%.4f"), \(party.longitude, specifier: "%.4f") Radius: \(Int(party.radiusMeters))m")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                // Live Timer
                if party.isActive, let entry = party.activeEntry {
                    VStack(spacing: 4) {
                        Text(formatDuration(entry.startTime, to: now))
                            .font(.system(size: 52, weight: .black, design: .monospaced))
                            .foregroundColor(.primaryPink)
                        Text("anwesend seit \(entry.startTime.formatted(.dateTime.hour().minute())) Uhr")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                }
                
                if !finished.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Bisherige Besuche")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        List {
                            ForEach(finished) { entry in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text("\(entry.startTime.formatted(.dateTime.hour().minute())) – \(entry.endTime!.formatted(.dateTime.hour().minute()))")
                                            .font(.subheadline)
                                        Text(entry.startTime.formatted(date: .abbreviated, time: .omitted))
                                            .font(.caption).foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    Text(formatDuration(entry.startTime, to: entry.endTime!))
                                        .fontWeight(.bold).foregroundColor(.primaryDarkBlue)
                                }
                            }
                            .onDelete(perform: deleteEntries)
                        }
                        .listStyle(.plain)
                        .frame(height: CGFloat(finished.count) * 70)
                    }
                }

                #if DEBUG
                VStack(spacing: 8) {
                    Divider()
                    HStack(spacing: 16) {
                        Button("Betreten") {
                            guard party.activeEntry == nil else { return }
                            let entry = TimeEntry(locationIdentifier: party.name)
                            party.timeEntries.append(entry)
                            modelContext.insert(entry)
                            try? modelContext.save()
                        }
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.vertical, 10).padding(.horizontal, 20)
                        .background(Color.primaryDarkBlue)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        
                        Button("Verlassen") {
                            party.activeEntry?.endTime = .now
                            try? modelContext.save()
                        }
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.vertical, 10).padding(.horizontal, 20)
                        .background(Color.primaryPink)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.bottom)
                #endif
            }
            .padding(.top)
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
        let h = diff / 3600; let m = (diff % 3600) / 60; let s = diff % 60
        return h > 0 ? String(format: "%dh %02dm %02ds", h, m, s) : String(format: "%dm %02ds", m, s)
    }
}
