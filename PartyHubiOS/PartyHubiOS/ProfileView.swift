import SwiftUI

struct ProfileView: View {
    @State private var user: APIUser?
    @State private var profileImage: UIImage?
    @State private var followerCount: Int = 0
    @State private var followingCount: Int = 0
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    private let userId: Int64 = 1
    
    var body: some View {
        ScrollView {
            VStack {
                ZStack(alignment: .bottom) {
                    if let image = profileImage {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 120, height: 120)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.white, lineWidth: 4))
                            .shadow(radius: 10)
                            .offset(y: 50)
                    } else {
                        Image(systemName: "person.circle.fill")
                            .resizable()
                            .scaledToFill()
                            .frame(width: 120, height: 120)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.white, lineWidth: 4))
                            .shadow(radius: 10)
                            .offset(y: 50)
                            .foregroundColor(.gray)
                    }
                }
                .padding(.bottom, 60)
                
                if isLoading {
                    ProgressView("Lade Profil...")
                        .padding()
                } else if let error = errorMessage {
                    VStack(spacing: 10) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text(error)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Button("Erneut versuchen") {
                            Task { await loadUser() }
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                } else if let user = user {
                    VStack(spacing: 4) {
                        Text("@\(user.distinctName ?? "username")")
                            .font(.headline)
                            .fontWeight(.medium)
                        
                        if let displayName = user.displayName, displayName != user.distinctName {
                            Text(displayName)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        if let biography = user.biography, !biography.isEmpty {
                            Text(biography)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 40)
                                .padding(.top, 8)
                        }
                    }
                    
                    HStack(spacing: 20) {
                        StatView(number: "\(followerCount)", label: "Follower")
                        StatView(number: "\(followingCount)", label: "Following")
                    }
                    .padding(.vertical, 25)
                } else {
                    Text("Kein Benutzer gefunden")
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
        }
        .task {
            await loadUser()
        }
    }
    
    private func loadUser() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let fetchedUser = try await UserAPI.shared.getUser(id: userId)
            let followers = try await UserAPI.shared.getFollowerCount(userId: userId)
            let following = try await UserAPI.shared.getFollowingCount(userId: userId)
            let image = try await UserAPI.shared.getProfilePicture(userId: userId)
            
            self.user = fetchedUser
            self.followerCount = followers
            self.followingCount = following
            self.profileImage = image
        } catch {
            errorMessage = error.localizedDescription
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
                .foregroundColor(.gray)
        }
    }
}

#Preview {
    ProfileView()
}
