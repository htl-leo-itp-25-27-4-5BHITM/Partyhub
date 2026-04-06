import SwiftUI

struct ProfileView: View {
    @State private var user: UserProfile? = nil
    @State private var isLoading = false
    @State private var isLoggedIn = false

    struct UserProfile: Codable {
        let id: Int
        let username: String
        let displayName: String?
        let distinctName: String?
        let email: String?
        let biography: String?
    }

    var body: some View {
        ZStack {
            if isLoggedIn {
                if isLoading {
                    ProgressView()
                        .onAppear { loadUserProfile() }
                } else if let user = user {
                    loggedInView(user: user)
                } else {
                    loggedInViewPlaceholder
                }
            } else {
                notLoggedInView
            }
        }
        .onAppear {
            checkLoginStatus()
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
    private var loggedInViewPlaceholder: some View {
        loggedInView(user: UserProfile(
            id: 0,
            username: "loading",
            displayName: nil,
            distinctName: nil,
            email: nil,
            biography: nil
        ))
    }

    @ViewBuilder
    private func loggedInView(user: UserProfile) -> some View {
        ScrollView {
            VStack(spacing: 0) {
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
                            .foregroundStyle(.secondary)
                    }

                    if let bio = user.biography {
                        Text(bio)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                            .padding(.top, 8)
                    }
                }
                .padding(.bottom, 25)

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
                            .background(Color.primaryDarkBlue)
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .shadow(color: Color.primaryDarkBlue.opacity(0.5), radius: 10)
                    }

                    Button(action: {}) {
                        Text("Nachricht")
                            .fontWeight(.semibold)
                            .frame(width: 150, height: 45)
                            .background(Color(.systemGray5))
                            .foregroundColor(.primaryDarkBlue)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .shadow(color: .primary.opacity(0.3), radius: 10)
                    }
                }
                .padding(.top, 20)

                Spacer()
            }
        }
    }

    private func checkLoginStatus() {
        let storedId = UserDefaults.standard.integer(forKey: "partyhub_user_id")
        isLoggedIn = storedId > 0
        if isLoggedIn {
            loadUserProfile()
        }
    }

    private func loadUserProfile() {
        guard let userId = AuthManager.shared.userId else {
            let storedId = UserDefaults.standard.integer(forKey: "partyhub_user_id")
            guard storedId > 0 else { return }
            AuthManager.shared.userId = storedId
            isLoggedIn = true
            guard let url = URL(string: "\(Config.backendURL)/api/users/\(storedId)") else { return }

            isLoading = true
            Task {
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
            return
        }

        guard let url = URL(string: "\(Config.backendURL)/api/users/\(userId)") else { return }

        isLoading = true
        Task {
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
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    ProfileView()
}
