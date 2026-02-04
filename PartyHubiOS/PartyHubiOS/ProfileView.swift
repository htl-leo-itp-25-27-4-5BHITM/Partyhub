import SwiftUI

struct ProfileView: View {
    var body: some View {
        VStack {
            // Header: Hintergrund und Profilbild
            ZStack(alignment: .bottom) {
                
                Image(systemName: "person.circle.fill") // Platzhalter für ein Bild
                    .resizable()
                    .scaledToFill()
                    .frame(width: 120, height: 120)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.white, lineWidth: 4))
                    .shadow(radius: 10)
                    .offset(y: 50)
            }
            .padding(.bottom, 60)

            VStack(spacing: 4) {
                Text("@max_dev_24")
                    .font(.headline)
                    .fontWeight(.medium)
            }
            // Statistiken
            HStack(spacing: 20) {
                StatView(number: "125", label: "Partys")
                StatView(number: "12.5K", label: "Follower")
                StatView(number: "350", label: "Following")
            }
            .padding(.vertical, 25)
            
            // Aktions-Buttons
            HStack(spacing: 20) {
                Button(action: {}) {
                    Text("Folgen")
                        .fontWeight(.semibold)
                        .frame(width: 150, height: 45)
                        .background(.primaryDarkBlue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                
                Button(action: {}) {
                    Text("Nachricht")
                        .fontWeight(.semibold)
                        .frame(width: 150, height: 45)
                        .background(Color(.systemGray5))
                        .foregroundColor(.primaryDarkBlue)
                        .cornerRadius(10)
                }
            }
            
            Spacer()
        }
    }
}

// Hilfs-View für die Statistiken
struct StatView: View {
    let number: String
    let label: String
    
    var body: some View {
        VStack {
            Text(number)
                .font(.headline)
                .fontWeight(.bold)
            Text(label)
                .font(.caption)
                .foregroundColor(.gray)
        }
    }
}

#Preview {
    ProfileView()
}
