import SwiftUI
import SwiftData

@main
struct PartyHubiOSApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var updateService = PartyUpdateService.shared
    @State private var notificationManager = PartyNotificationManager.shared
    @State private var authService = KeycloakAuthService.shared
    @State private var didBootstrap = false

    @State private var locationManager = LocationManager()
    @State private var deepLinkPartyId: Int?
    let container: ModelContainer

    init() {
        do {
            let appSupport = URL.applicationSupportDirectory.appendingPathComponent("PartyHub")
            try FileManager.default.createDirectory(at: appSupport, withIntermediateDirectories: true)

            print("SwiftData storage path: \(appSupport)")

            let schema = Schema([Party.self, TimeEntry.self])
            let modelConfiguration = ModelConfiguration(
                schema: schema,
                url: appSupport.appendingPathComponent("PartyHub.sqlite"),
                allowsSave: true
            )

            container = try ModelContainer(for: schema, configurations: [modelConfiguration])

            locationManager.modelContext = container.mainContext

        } catch {
            print("SwiftData Error: \(error)")
            fatalError("ModelContainer error: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            rootView
                .environment(locationManager)
                .modelContainer(container)
                .environment(authService)
                .environmentObject(notificationManager)
                .task {
                    await bootstrap()
                }
                .onAppear {
                    if authService.sessionEstablished {
                        updateService.startPolling(modelContext: container.mainContext)
                    }
                }
                .onDisappear {
                    updateService.stopPolling()
                }
                .onOpenURL { url in
                    handleDeepLink(url)
                }
                .onChange(of: authService.sessionEstablished) { _, established in
                    if established {
                        updateService.startPolling(modelContext: container.mainContext)
                        Task { @MainActor in
                            await fetchAndStoreParties(context: container.mainContext)
                        }
                    } else {
                        updateService.stopPolling()
                        notificationManager.clearAllBadges()
                    }
                }
        }
    }

    @ViewBuilder
    private var rootView: some View {
        if !didBootstrap {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color("primary dark blue").opacity(0.05))
        } else if authService.sessionEstablished {
            ContentView()
        } else {
            LoginView()
        }
    }

    @MainActor
    private func bootstrap() async {
        await authService.bootstrap()
        await setupApp()
        didBootstrap = true
    }

    private func handleDeepLink(_ url: URL) {
        guard url.scheme == "partyhub" else { return }

        if url.host == "party",
           let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let idString = components.queryItems?.first(where: { $0.name == "id" })?.value,
           let partyId = Int(idString) {
            deepLinkPartyId = partyId
            NotificationCenter.default.post(name: .showPartyDetail, object: partyId)
            return
        }

        if url.host == "login",
           let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let userIdString = components.queryItems?.first(where: { $0.name == "userId" })?.value,
           let userId = Int(userIdString) {
            NotificationCenter.default.post(name: .legacyQRLogin, object: userId)
            return
        }
    }

    @MainActor
    func setupApp() async {
        let context = container.mainContext
        locationManager.modelContext = context

        await fetchAndStoreParties(context: context)

        let allParties = (try? context.fetch(FetchDescriptor<Party>())) ?? []
        print("Parties in DB:", allParties.count)

        locationManager.requestPermission()
        locationManager.registerGeofences(for: allParties)
        locationManager.checkIfAlreadyInsideRegions()

        try? await notificationManager.requestAuthorization()
    }

    func fetchAndStoreParties(context: ModelContext) async {
        guard let url = URL(string: "\(Config.backendURL)/api/parties") else { return }
        guard let (data, _) = try? await URLSession.shared.data(from: url) else { return }

        print("Fetching parties…")

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        struct PartyResponse: Codable {
            let id: Int
            let title: String
            let location: LocationResponse
            let hostUser: HostUserResponse?
            let category: CategoryResponse?
            let theme: String?
            let timeStart: String?
            let timeEnd: String?
            let maxPeople: Int?
            let minAge: Int?
            let maxAge: Int?
            let website: String?
            let description: String?
            let fee: Double?
            let createdAt: String?
        }

        struct HostUserResponse: Codable {
            let id: Int?
            let displayName: String?
        }

        struct CategoryResponse: Codable {
            let id: Int?
            let name: String?
        }

        struct LocationResponse: Codable {
            let latitude: Double
            let longitude: Double
            let address: String?
        }

        guard let parties = try? decoder.decode([PartyResponse].self, from: data) else {
            print("Failed to decode /api/parties payload")
            return
        }

        let incomingIds = Set(parties.map { $0.id })
        let existingParties = (try? context.fetch(FetchDescriptor<Party>())) ?? []
        for party in existingParties where !incomingIds.contains(party.backendId) {
            context.delete(party)
        }

        for p in parties {
            let descriptor = FetchDescriptor<Party>(predicate: #Predicate { $0.backendId == p.id })
            if let existing = try? context.fetch(descriptor).first {
                existing.name     = p.title
                existing.location = p.location.address ?? ""
                existing.latitude  = p.location.latitude
                existing.longitude = p.location.longitude
                existing.partyDescription = p.description
                existing.hostUserId = p.hostUser?.id.map { Int64($0) }
                existing.hostDisplayName = p.hostUser?.displayName
                existing.timeStart = parseDate(p.timeStart)
                existing.timeEnd = parseDate(p.timeEnd)
                existing.maxPeople = p.maxPeople
                existing.minAge = p.minAge
                existing.maxAge = p.maxAge
                existing.website = p.website
                existing.fee = p.fee
                existing.categoryId = p.category?.id
                existing.themeName = preferredThemeName(theme: p.theme, categoryName: p.category?.name)
            } else {
                let party = Party(
                    backendId:  p.id,
                    name:       p.title,
                    location:   p.location.address ?? "",
                    latitude:   p.location.latitude,
                    longitude:  p.location.longitude,
                    partyDescription: p.description,
                    hostUserId: p.hostUser?.id.map { Int64($0) },
                    timeStart: parseDate(p.timeStart),
                    timeEnd: parseDate(p.timeEnd),
                    maxPeople: p.maxPeople,
                    minAge: p.minAge,
                    maxAge: p.maxAge,
                    website: p.website,
                    fee: p.fee,
                    categoryId: p.category?.id,
                    themeName: preferredThemeName(theme: p.theme, categoryName: p.category?.name),
                    hostDisplayName: p.hostUser?.displayName)
                context.insert(party)
            }
        }
        try? context.save()
    }

    private func preferredThemeName(theme: String?, categoryName: String?) -> String? {
        let normalizedTheme = theme?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let normalizedTheme, !normalizedTheme.isEmpty {
            return normalizedTheme
        }

        let normalizedCategory = categoryName?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let normalizedCategory, !normalizedCategory.isEmpty {
            return normalizedCategory
        }

        return nil
    }

    private func parseDate(_ dateString: String?) -> Date? {
        guard let dateString = dateString?.trimmingCharacters(in: .whitespacesAndNewlines),
              !dateString.isEmpty else {
            return nil
        }

        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = isoFormatter.date(from: dateString) {
            return date
        }

        isoFormatter.formatOptions = [.withInternetDateTime]
        if let date = isoFormatter.date(from: dateString) {
            return date
        }

        let fallbackFormats = [
            "yyyy-MM-dd'T'HH:mm:ss.SSSSSS",
            "yyyy-MM-dd'T'HH:mm:ss.SSS",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd HH:mm:ss",
            "dd.MM.yyyy HH:mm"
        ]

        for format in fallbackFormats {
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = .current
            formatter.dateFormat = format

            if let date = formatter.date(from: dateString) {
                return date
            }
        }

        return nil
    }

    class AppDelegate: NSObject, UIApplicationDelegate {

        func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
                if granted {
                    DispatchQueue.main.async {
                        application.registerForRemoteNotifications()
                    }
                }
            }
            return true
        }

        func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
            let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
            print("My genuine Apple Device Token: \(tokenString)")

            sendTokenToBackend(token: tokenString)
        }

        func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
            print("Push registration failed: \(error.localizedDescription)")
        }

        private func sendTokenToBackend(token: String) {
            Task { @MainActor in
                guard KeycloakAuthService.shared.isAuthenticated,
                      let partyhubUserId = KeycloakAuthService.shared.partyhubUserId else {
                    print("Token upload cancelled: not signed in.")
                    return
                }

                do {
                    let accessToken = try await KeycloakAuthService.shared.validAccessToken()
                    guard let url = URL(string: "\(Config.backendURL)/api/users/\(partyhubUserId)/device-token") else { return }
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    let body: [String: Any] = [
                        "deviceToken": token,
                        "platform": "ios"
                    ]
                    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
                    let (_, response) = try await URLSession.shared.data(for: request)
                    if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                        print("Device token uploaded for user \(partyhubUserId)")
                    } else {
                        print("Device token upload rejected: \(response)")
                    }
                } catch {
                    print("Device token upload error: \(error.localizedDescription)")
                }
            }
        }
    }
}

extension Notification.Name {
    static let legacyQRLogin = Notification.Name("partyhub.legacyQRLogin")
}
