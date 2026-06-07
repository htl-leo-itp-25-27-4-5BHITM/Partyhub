import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @Environment(KeycloakAuthService.self) private var auth
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            backgroundGradient
                .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                VStack(spacing: 16) {
                    Image(systemName: "party.popper.fill")
                        .font(.system(size: 80, weight: .bold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color("primary pink"), Color("primary pink").opacity(0.7)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    Text("PartyHub")
                        .font(.system(size: 44, weight: .heavy))
                        .foregroundStyle(.white)

                    Text("Find your next party")
                        .font(.title3)
                        .foregroundStyle(.white.opacity(0.85))
                }

                Spacer()

                VStack(spacing: 14) {
                    signInButton

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.white)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 10)
                            .background(.red.opacity(0.85), in: RoundedRectangle(cornerRadius: 10))
                    }

                    Text("By continuing you agree to PartyHub's terms of service.")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                .padding(.bottom, 40)
            }
        }
    }

    private var signInButton: some View {
        Button {
            errorMessage = nil
            startLogin()
        } label: {
            HStack(spacing: 10) {
                if auth.isLoggingIn {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                } else {
                    Image(systemName: "person.crop.circle.badge.checkmark")
                        .font(.title3)
                }
                Text(auth.isLoggingIn ? "Signing in…" : "Sign in")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity, minHeight: 52)
            .padding(.horizontal, 24)
            .background(
                LinearGradient(
                    colors: [Color("primary dark blue"), Color("primary dark blue").opacity(0.85)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .shadow(color: .black.opacity(0.3), radius: 12, y: 6)
        }
        .disabled(auth.isLoggingIn)
        .padding(.horizontal, 32)
    }

    private var backgroundGradient: some View {
        LinearGradient(
            colors: [
                Color("primary dark blue"),
                Color("primary dark blue").opacity(0.7),
                Color("primary pink").opacity(0.6)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    @MainActor
    private func startLogin() {
        guard let anchor = windowAnchor() else {
            errorMessage = "Could not present the sign-in window."
            return
        }
        Task {
            do {
                try await auth.login(presentationAnchor: anchor)
            } catch let error as ASWebAuthenticationSessionError where error.code == .canceledLogin {
                errorMessage = nil
            } catch let error as KeycloakAuthError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func windowAnchor() -> ASPresentationAnchor? {
        for scene in UIApplication.shared.connectedScenes {
            guard let windowScene = scene as? UIWindowScene else { continue }
            if let keyWindow = windowScene.windows.first(where: { $0.isKeyWindow }) {
                return keyWindow
            }
            if let first = windowScene.windows.first {
                return first
            }
        }
        return nil
    }
}

#Preview {
    LoginView()
        .environment(KeycloakAuthService.shared)
}
