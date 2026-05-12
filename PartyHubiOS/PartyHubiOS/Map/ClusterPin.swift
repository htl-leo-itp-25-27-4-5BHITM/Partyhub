import Foundation
import SwiftUI
import MapKit

// MARK: - Party Cluster Pin

struct PartyClusterPin: View {
    let parties: [Party]

    init(parties: [Party], followingUserIds _: Set<Int64>, invitedPartyIds _: Set<Int>) {
        self.parties = parties
    }

    private var badgePink: Color {
        Color("primary pink")
    }

    private var count: Int {
        parties.count
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(Color(uiColor: .systemGray5))
                .frame(width: 64, height: 64)

            Circle()
                .fill(Color(uiColor: .systemGray))
                .frame(width: 50, height: 50)
                .shadow(color: Color.black.opacity(0.22), radius: 6, y: 2)

            Image(systemName: "party.popper.fill")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.white)

            VStack {
                HStack {
                    Spacer()
                    Text("\(count)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(minWidth: 22)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(badgePink)
                        .clipShape(Capsule())
                        .offset(x: 8, y: -8)
                }
                Spacer()
            }
            .frame(width: 50, height: 50)
        }
        .accessibilityLabel("\(count) Partys")
    }
}
