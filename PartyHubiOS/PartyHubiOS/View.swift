//
//  View.swift
//  PartyHubiOS
//
//  Created by Carla Dimmler on 24.02.26.
//

import Foundation
import SwiftUI

extension View {
    func applyPrimaryStyle() -> some View {
        self
            .font(.headline)
            .foregroundColor(.white)
            .padding(.vertical, 12)
            .padding(.horizontal, 24)
            .frame(maxWidth: .infinity)
            .background(Color.primaryDarkBlue)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}
