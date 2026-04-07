import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var user: UserProfile? = nil
    @State private var isLoading = false
    
    struct UserProfile: Codable {
        let id: Int
        let username: String
        let displayName: String?
        let distinctName: String?
        let email: String?
        let biography: String?
    }

    var body: some View {
        contentView
            .task {
                await restoreSession()
            }
    }
    
    @ViewBuilder
    private var contentView: some View {
        if let userId = authManager.userId {
            loggedInView(userId: userId)
        } else {
            notLoggedInView
        }
    }
    
    @ViewBuilder
    private var notLoggedInView: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.crop.circle.badge.questionmark")
                .font(.system(size: 80))
                .foregroundStyle(.gray)
            
            Text("Nicht angemeldet")
                .font(.headline)
                .foregroundStyle(.gray)
            
            Text("Scanne einen QR-Code, um dich anzumelden")
                .font(.subheadline)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    @ViewBuilder
    private func loggedInView(userId: Int) -> some View {
        if isLoading {
            ProgressView()
                .task {
                    await loadUserProfile(userId: userId)
                }
        } else if let user = user {
            profileContent(user: user)
        } else {
            ProgressView()
                .task {
                    await loadUserProfile(userId: userId)
                }
        }
    }
    
    private func profileContent(user: UserProfile) -> some View {
        VStack {
            ZStack(alignment: .bottom) {
                Image(systemName: "person.circle.fill")
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
                Text("@\(user.username)")
                    .font(.headline)
                    .fontWeight(.medium)
                
                if let displayName = user.displayName {
                    Text(displayName)
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                }
                
                if let bio = user.biography {
                    Text(bio)
                        .font(.caption)
                        .foregroundStyle(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                        .padding(.top, 8)
                }
            }
            
            HStack(spacing: 20) {
                StatView(number: "0", label: "Partys")
                StatView(number: "0", label: "Follower")
                StatView(number: "0", label: "Following")
            }
            .padding(.vertical, 25)
            
            HStack(spacing: 20) {
                Button(action: {}) {
                    Text("Folgen")
                        .fontWeight(.semibold)
                        .frame(width: 150, height: 45)
                        .background(Color("primary dark blue"))
                        .foregroundStyle(.white)
                        .cornerRadius(10)
                        .shadow(color: Color("primary dark blue").opacity(0.5), radius: 10)
                }
                
                Button(action: {}) {
                    Text("Nachricht")
                        .fontWeight(.semibold)
                        .frame(width: 150, height: 45)
                        .background(Color.secondary.opacity(0.3))
                        .foregroundStyle(Color("primary dark blue"))
                        .cornerRadius(10)
                }
            }
            
            Spacer()
        }
    }
    
    @MainActor
    private func restoreSession() async {
        if authManager.userId == nil {
            let storedId = UserDefaults.standard.integer(forKey: "partyhub_user_id")
            if storedId > 0 {
                authManager.userId = storedId
                await loadUserProfile(userId: storedId)
            }
        }
    }
    
    @MainActor
    private func loadUserProfile(userId: Int) async {
        guard let url = URL(string: "\(Config.backendURL)/api/users/\(userId)") else { return }
        
        isLoading = true
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            user = try decoder.decode(UserProfile.self, from: data)
        } catch {
            print("Failed to load user profile: \(error)")
        }
        isLoading = false
    }
}

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
                .foregroundStyle(.gray)
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthManager.shared)
}
