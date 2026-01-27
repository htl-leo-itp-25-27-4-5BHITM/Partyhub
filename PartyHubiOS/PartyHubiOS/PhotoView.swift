//
//  PhotoView.swift
//  PartyHubiOS
//
//  Created by Carla Dimmler on 27.01.26.
//

import SwiftUI

struct PhotoView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Bilder für Geburtstag hochladen") {
                    // Hier rufen wir deine neue Datei auf
                    PartyBilderView(partyName: "Geburtstag_2024")
                }
            }
            .navigationTitle("Meine Partys")
        }    }
}

#Preview {
    PhotoView()
}
