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
                PhotoView()
                    .tabItem{
                        Label("Photo", systemImage: "photo.stack")
                    }
                ProfileView()
                    .tabItem {
                        Label("Profile", systemImage: "person")
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
