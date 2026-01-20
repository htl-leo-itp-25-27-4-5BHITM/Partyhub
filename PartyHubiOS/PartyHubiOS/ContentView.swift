//
//  ContentView.swift
//  PartyHubiOS
//
//  Created by Carla Dimmler on 20.01.26.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            TabView{
                HomeView()
                    .tabItem {
                        Label("Home", systemImage: "house")
                    }
                ProfileView()
                    .tabItem {
                        Label("Profile", systemImage: "chevron")
                    }
            }
        }
    }
}
/*
#Preview {
    ContentView()
}
*/
