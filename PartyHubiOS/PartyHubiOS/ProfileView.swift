import SwiftUI
import AVFoundation
import AudioToolbox

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var user: UserProfile? = nil
    @State private var isLoading = false
    @State private var showSignOutAlert = false
    @State private var showCamera = false
    
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
            .alert("Abmelden", isPresented: $showSignOutAlert) {
                Button("Abmelden", role: .destructive) {
                    signOut()
                }
                Button("Abbrechen", role: .cancel) {}
            } message: {
                Text("Möchtest du dich wirklich abmelden?")
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraView()
                    .ignoresSafeArea()
                    .environmentObject(authManager)
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
            
            Button(action: { showCamera = true }) {
                HStack(spacing: 8) {
                    Image(systemName: "qrcode.viewfinder")
                    Text("QR-Code scannen")
                }
                .fontWeight(.semibold)
                .frame(width: 200, height: 45)
                .background(Color("primary dark blue"))
                .foregroundStyle(.white)
                .cornerRadius(10)
                .shadow(color: Color("primary dark blue").opacity(0.5), radius: 10)
            }
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
            
            Button(action: { showSignOutAlert = true }) {
                HStack(spacing: 8) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                    Text("Abmelden")
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
        UserDefaults.standard.removeObject(forKey: "partyhub_user_id")
        authManager.userId = nil
        user = nil
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

// MARK: - QR Scanner

struct CameraView: UIViewControllerRepresentable {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authManager: AuthManager

    func makeCoordinator() -> Coordinator {
        Coordinator(dismiss: dismiss, authManager: authManager)
    }

    func makeUIViewController(context: Context) -> ScannerViewController {
        let vc = ScannerViewController()
        vc.delegate = context.coordinator
        return vc
    }

    func updateUIViewController(_ uiViewController: ScannerViewController, context: Context) {}

    class Coordinator: NSObject, ScannerViewControllerDelegate {
        let dismiss: DismissAction
        let authManager: AuthManager

        init(dismiss: DismissAction, authManager: AuthManager) {
            self.dismiss = dismiss
            self.authManager = authManager
        }

        func didScanCode(_ code: String) {
            guard let url = URL(string: code),
                  url.scheme == "partyhub",
                  url.host == "login",
                  let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
                  let userIdString = components.queryItems?.first(where: { $0.name == "userId" })?.value,
                  let userId = Int(userIdString) else {
                print("Ungültiger QR-Code: \(code)")
                return
            }

            DispatchQueue.main.async {
                self.authManager.userId = userId
                UserDefaults.standard.set(userId, forKey: "partyhub_user_id")
                self.dismiss()
            }
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
        button.setTitle("Schließen", for: .normal)
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
        .environmentObject(AuthManager.shared)
}
