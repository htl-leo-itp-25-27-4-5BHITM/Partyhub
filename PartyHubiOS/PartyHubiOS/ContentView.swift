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
                        Label("Home", systemImage: "location")
                    }
                PartyView()
                    .tabItem {
                        Label("Party", systemImage: "party.popper")
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
            .tint(.primaryPink)

        }
    }
}
/*
 

 
#Preview {
    ContentView()
}
*/
