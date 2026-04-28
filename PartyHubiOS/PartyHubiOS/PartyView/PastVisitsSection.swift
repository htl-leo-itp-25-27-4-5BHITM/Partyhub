//
//  PastVisitsSection.swift
//  PartyHubiOS
//
//  Created by Carla on 28.04.26.
//

import Foundation
import SwiftUI

struct PastVisitsSection: View {
    let entries: [TimeEntry]

    var body: some View {
        if !entries.isEmpty {
            Section("Vergangene Besuche") {
                ForEach(entries) { entry in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(entry.startTime, style: .date)
                                .font(.caption)
                                .foregroundStyle(.secondary)

                            Text("\(entry.startTime, style: .time) - \(entry.endTime!, style: .time)")
                        }
                        Spacer()
                        Text(String(format: "%.1fh", entry.durationInHours))
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}
