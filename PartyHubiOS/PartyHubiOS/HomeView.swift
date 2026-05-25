import SwiftUI
import SwiftData
import CoreLocation

struct HomeView: View {
    @Environment(LocationManager.self) private var locationManager
    @Query private var allParties: [Party]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 24) {
                    brandingHeader
                    nearbySection
                    upcomingSection
                }
                .padding()
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 6) {
                        Image(systemName: "party.popper.fill")
                            .foregroundStyle(Color("primary pink"))
                        Text("PartyHub")
                            .font(.headline)
                            .fontWeight(.bold)
                    }
                }
            }
        }
    }

    private var brandingHeader: some View {
        VStack(spacing: 4) {
            HStack(spacing: 10) {
                Image(systemName: "party.popper.fill")
                    .font(.largeTitle)
                    .foregroundStyle(Color("primary pink"))
                Text("PartyHub")
                    .font(.largeTitle)
                    .fontWeight(.heavy)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color("primary pink"), Color("primary pink").opacity(0.7)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
            }

            Text("Find your next party")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private var userLocation: CLLocationCoordinate2D? {
        locationManager.currentLocation
    }

    private var nearbyParties: [Party] {
        guard let loc = userLocation else { return Array(allParties.prefix(5)) }
        let userLoc = CLLocation(latitude: loc.latitude, longitude: loc.longitude)
        return allParties
            .filter { party in
                let partyLoc = CLLocation(latitude: party.latitude, longitude: party.longitude)
                return partyLoc.distance(from: userLoc) <= 20_000
            }
            .sorted { a, b in
                let aLoc = CLLocation(latitude: a.latitude, longitude: a.longitude)
                let bLoc = CLLocation(latitude: b.latitude, longitude: b.longitude)
                return aLoc.distance(from: userLoc) < bLoc.distance(from: userLoc)
            }
    }

    private var upcomingParties: [Party] {
        allParties
            .filter { party in
                guard let start = party.timeStart else { return false }
                return start > Date()
            }
            .sorted { a, b in
                (a.timeStart ?? .distantFuture) < (b.timeStart ?? .distantFuture)
            }
    }

    private var nearbySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "location.fill")
                    .foregroundStyle(Color("primary pink"))
                Text("Nearby Parties")
                    .font(.title2)
                    .fontWeight(.bold)
            }

            if nearbyParties.isEmpty {
                Text(userLocation == nil ? "Enable location to see nearby parties" : "No parties nearby")
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(nearbyParties) { party in
                            NavigationLink(destination: PartyDetailView(party: party)) {
                                PartyCard(party: party)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    private var upcomingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "calendar")
                    .foregroundStyle(Color("primary pink"))
                Text("Upcoming Parties")
                    .font(.title2)
                    .fontWeight(.bold)
            }

            if upcomingParties.isEmpty {
                Text("No upcoming parties")
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(upcomingParties.prefix(10)) { party in
                        NavigationLink(destination: PartyDetailView(party: party)) {
                            UpcomingPartyRow(party: party)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

private struct PartyCard: View {
    let party: Party

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(party.name)
                .font(.headline)
                .foregroundStyle(.primary)
                .lineLimit(2)

            Text(party.location)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)

            HStack(spacing: 4) {
                Image(systemName: "person.fill")
                    .font(.caption2)
                Text(party.hostDisplayName ?? "Host")
                    .font(.caption2)
            }
            .foregroundStyle(.secondary)

            if party.fee != nil && party.fee! > 0 {
                Text("€\(party.fee!, specifier: "%.2f")")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color("primary pink"))
            } else {
                Text("Free")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.green)
            }
        }
        .padding()
        .frame(width: 180, alignment: .leading)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

private struct UpcomingPartyRow: View {
    let party: Party

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(party.name)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Text(party.location)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                HStack(spacing: 8) {
                    if let start = party.timeStart {
                        Label(start.formatted(date: .abbreviated, time: .shortened), systemImage: "clock")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Text(party.hostDisplayName ?? "Unknown")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    HomeView()
}
