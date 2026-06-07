import SwiftUI
import AVFoundation
import AudioToolbox
import PhotosUI
import AuthenticationServices

struct ProfileView: View {
    @Environment(KeycloakAuthService.self) private var auth
    @State private var showSignOutAlert = false
    @State private var showCamera = false
    @State private var followerCount: Int = 0
    @State private var followingCount: Int = 0

    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var showUploadError = false
    @State private var uploadErrorMessage = ""
    @State private var profilePictureRefreshTrigger = false

    enum LoadState {
        case loading
        case loaded(UserProfile)
        case error(String)
    }

    @State private var loadState: LoadState = .loading
    @State private var initialLoadComplete = false

    var body: some View {
        contentView
            .task(id: auth.partyhubUserId) {
                if let userId = auth.partyhubUserId {
                    initialLoadComplete = false
                    await loadUserProfile(userId: userId)
                }
            }
            .alert("Log Out", isPresented: $showSignOutAlert) {
                Button("Log Out", role: .destructive) {
                    signOut()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Signing out will clear your local session and open the Keycloak sign-in page again.")
            }
            .alert("Upload Error", isPresented: $showUploadError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(uploadErrorMessage)
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraView(auth: auth)
                    .ignoresSafeArea()
                    .environment(auth)
            }
    }

    @ViewBuilder
    private var contentView: some View {
        if let userId = auth.partyhubUserId {
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

            Text("Not signed in")
                .font(.headline)
                .foregroundStyle(.gray)

            Text("Sign in with your Keycloak account to continue.")
                .font(.subheadline)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            if auth.isLoggingIn {
                ProgressView("Opening Keycloak…")
                    .padding(.top, 12)
            } else {
                Button {
                    startKeycloakLogin()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "person.crop.circle.badge.checkmark")
                        Text("Sign in")
                    }
                    .fontWeight(.semibold)
                    .frame(width: 240, height: 45)
                    .background(Color("primary dark blue"))
                    .foregroundStyle(.white)
                    .cornerRadius(10)
                    .shadow(color: Color("primary dark blue").opacity(0.5), radius: 10)
                }
            }

            if let error = auth.lastError {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder
    private func loggedInView(userId: Int) -> some View {
        Group {
            switch loadState {
            case .loading:
                ProgressView()
            case .loaded(let user):
                profileContent(user: user)
            case .error(let message):
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundStyle(.gray)
                    Text(message)
                        .foregroundStyle(.secondary)
                    Button("Try again") {
                        loadState = .loading
                        Task { await loadUserProfile(userId: userId) }
                    }
                    .buttonStyle(.borderedProminent)
                    Button("Sign out") {
                        signOut()
                    }
                    .foregroundStyle(.red)
                }
            }
        }
    }

    private func profileContent(user: UserProfile) -> some View {
        VStack {
            ZStack(alignment: .bottomTrailing) {
                UserProfileImageView(userId: user.id, size: 120, showBorder: false)
                    .overlay(Circle().stroke(Color.white, lineWidth: 4))
                    .shadow(radius: 10)
                    .id(profilePictureRefreshTrigger)

                PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                    ZStack {
                        Circle()
                            .fill(Color("primary dark blue"))
                            .frame(width: 36, height: 36)
                        Image(systemName: "camera.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(.white)
                    }
                }
                .onChange(of: selectedPhotoItem) { _, newItem in
                    Task { await uploadSelectedPhoto(newItem) }
                }
            }
            .padding(.bottom, 60)

            VStack(spacing: 4) {
                Text("@\(user.username ?? "user_\(user.id)")")
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
                StatView(number: "\(followerCount)", label: "Follower")
                StatView(number: "\(followingCount)", label: "Following")
            }
            .padding(.vertical, 25)

            HStack(spacing: 20) {
                Button(action: {}) {
                    Text("Follow")
                        .fontWeight(.semibold)
                        .frame(width: 150, height: 45)
                        .background(Color("primary dark blue"))
                        .foregroundStyle(.white)
                        .cornerRadius(10)
                        .shadow(color: Color("primary dark blue").opacity(0.5), radius: 10)
                }

                Button(action: {}) {
                    Text("Message")
                        .fontWeight(.semibold)
                        .frame(width: 150, height: 45)
                        .background(Color.secondary.opacity(0.3))
                        .foregroundStyle(Color("primary dark blue"))
                        .cornerRadius(10)
                }
            }

            Spacer()

            Button(action: { showSignOutAlert = true }) {
                HStack(spacing: 8) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                    Text("Log out")
                }
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .frame(height: 45)
                .background(Color.red.opacity(0.1))
                .foregroundStyle(.red)
                .cornerRadius(10)
                .padding(.horizontal, 20)
            }
            .padding(.bottom, 20)
        }
    }

    @MainActor
    private func signOut() {
        Task {
            await auth.logout()
            loadState = .loading
            followerCount = 0
            followingCount = 0
            initialLoadComplete = false
            profilePictureRefreshTrigger.toggle()
        }
    }

    @MainActor
    private func loadUserProfile(userId: Int) async {
        guard !initialLoadComplete else { return }
        loadState = .loading

        do {
            let profile: UserProfile = try await APIClient.shared.request(
                method: .GET,
                path: "/api/users/\(userId)",
                authType: .bearerOrAnonymous
            )
            let followerResp: CountResponse = try await APIClient.shared.request(
                method: .GET,
                path: "/api/users/\(userId)/followers/count",
                authType: .bearerOrAnonymous
            )
            let followingResp: CountResponse = try await APIClient.shared.request(
                method: .GET,
                path: "/api/users/\(userId)/following/count",
                authType: .bearerOrAnonymous
            )
            followerCount = followerResp.count
            followingCount = followingResp.count
            loadState = .loaded(profile)
            initialLoadComplete = true
        } catch {
            print("Failed to load profile: \(error)")
            let fallback = UserProfile(
                id: userId,
                username: "User \(userId)",
                displayName: nil,
                distinctName: nil,
                email: nil,
                biography: nil,
                phoneNumber: nil
            )
            loadState = .loaded(fallback)
            initialLoadComplete = true
        }
    }

    @MainActor
    private func startKeycloakLogin() {
        guard let anchor = windowAnchor() else { return }
        Task {
            do {
                try await auth.login(presentationAnchor: anchor)
            } catch {
                print("Keycloak login failed: \(error)")
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

    private func uploadSelectedPhoto(_ item: PhotosPickerItem?) async {
        guard let item, let userId = auth.partyhubUserId else { return }

        guard let data = try? await item.loadTransferable(type: Data.self) else {
            uploadErrorMessage = "The photo could not be loaded."
            showUploadError = true
            return
        }

        do {
            let _: EmptyResponse = try await APIClient.shared.upload(
                path: "/api/users/\(userId)/upload-profile-picture",
                data: data,
                fileName: "profile.jpg",
                mimeType: "image/jpeg",
                authType: .bearerToken
            )

            ApiService.shared.invalidateProfilePictureCache(for: userId)

            await MainActor.run {
                profilePictureRefreshTrigger.toggle()
            }

            print("Profile picture uploaded successfully")
        } catch {
            uploadErrorMessage = "Error during upload: \(error.localizedDescription)"
            showUploadError = true
        }
    }
}

// MARK: - QR Scanner (kept for legacy partyhub://login?userId= deep links)

struct CameraView: UIViewControllerRepresentable {
    @Environment(\.dismiss) private var dismiss
    let auth: KeycloakAuthService

    func makeCoordinator() -> Coordinator {
        Coordinator(dismiss: dismiss, auth: auth)
    }

    func makeUIViewController(context: Context) -> ScannerViewController {
        let vc = ScannerViewController()
        vc.delegate = context.coordinator
        return vc
    }

    func updateUIViewController(_ uiViewController: ScannerViewController, context: Context) {}

    class Coordinator: NSObject, ScannerViewControllerDelegate {
        let dismiss: DismissAction
        let auth: KeycloakAuthService

        init(dismiss: DismissAction, auth: KeycloakAuthService) {
            self.dismiss = dismiss
            self.auth = auth
        }

        func didScanCode(_ code: String) {
            dismiss()
            _ = code
            print("Legacy QR code detected; please use Keycloak sign-in instead.")
        }
    }
}

protocol ScannerViewControllerDelegate: AnyObject {
    func didScanCode(_ code: String)
}

class ScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    weak var delegate: ScannerViewControllerDelegate?
    var captureSession: AVCaptureSession!
    var previewLayer: AVCaptureVideoPreviewLayer!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupSession()
        addCloseButton()
    }

    private func setupSession() {
        captureSession = AVCaptureSession()

        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video),
              let videoInput = try? AVCaptureDeviceInput(device: videoCaptureDevice),
              captureSession.canAddInput(videoInput) else {
            return
        }

        captureSession.addInput(videoInput)

        let metadataOutput = AVCaptureMetadataOutput()
        guard captureSession.canAddOutput(metadataOutput) else { return }
        captureSession.addOutput(metadataOutput)
        metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        metadataOutput.metadataObjectTypes = [.qr]

        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.frame = view.layer.bounds
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)

        DispatchQueue.global(qos: .background).async {
            self.captureSession.startRunning()
        }
    }

    private func addCloseButton() {
        let button = UIButton(type: .system)
        button.setTitle("Close", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        view.addSubview(button)
        NSLayoutConstraint.activate([
            button.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            button.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
    }

    @objc private func closeTapped() {
        captureSession.stopRunning()
        dismiss(animated: true)
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput,
                        didOutput metadataObjects: [AVMetadataObject],
                        from connection: AVCaptureConnection) {
        guard let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let stringValue = metadataObject.stringValue else { return }

        captureSession.stopRunning()
        AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
        delegate?.didScanCode(stringValue)
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if captureSession.isRunning {
            captureSession.stopRunning()
        }
    }
}

// MARK: - StatView

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
        .environment(KeycloakAuthService.shared)
}
