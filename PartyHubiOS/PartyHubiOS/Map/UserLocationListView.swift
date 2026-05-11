import Foundation
import CoreLocation
import SwiftUI
import MapKit

struct UserLocation: Codable, Identifiable {
    var id: Int64 { user?.id ?? 0 }
    let latitude: Double
    let longitude: Double
    let user: UserInfo?

    struct UserInfo: Codable {
        let id: Int64
        let displayName: String?
        let distinctName: String?
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    func isInsideParty(_ party: Party) -> Bool {
        let userCoord = CLLocation(latitude: latitude, longitude: longitude)
        let partyCoord = CLLocation(latitude: party.latitude, longitude: party.longitude)
        return userCoord.distance(from: partyCoord) <= party.radiusMeters
    }
}

@Observable
class UserLocationViewModel {
    var locations: [UserLocation] = []
    var isLoading = false
    var errorMessage: String?
    var coordinateProvider: (() -> CLLocationCoordinate2D?)?
    private var pollingTimer: Timer?
    private var uploadTimer: Timer?

    func startPolling(partyId: Int64?) {
        guard let partyId = partyId else {
            print("[LocationVM] startPolling: No partyId provided")
            return
        }
        print("[LocationVM] Starting polling for party: \(partyId)")
        fetchLocations(partyId: partyId)
        pollingTimer = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in
            self?.fetchLocations(partyId: partyId)
        }
    }

    func startUploading(userId: Int64) {
        print("[LocationVM] Starting location upload for user: \(userId)")
        uploadUserLocation(userId: userId)
        uploadTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.uploadUserLocation(userId: userId)
        }
    }

    func stopPolling() {
        print("[LocationVM] Stopping polling")
        pollingTimer?.invalidate()
        pollingTimer = nil
    }

    func stopUploading() {
        print("[LocationVM] Stopping location upload")
        uploadTimer?.invalidate()
        uploadTimer = nil
    }

    func fetchLocations(partyId: Int64?) {
        guard let partyId = partyId else { return }
        guard let url = URL(string: "\(Config.backendURL)/api/parties/\(partyId)/locations") else {
            print("[LocationVM] fetchLocations: Invalid URL for party \(partyId)")
            return 
        }
        
        print("[LocationVM] Fetching locations for party: \(partyId)")
        isLoading = true

        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false

                if let error = error {
                    print("[LocationVM] fetchLocations: Error - \(error.localizedDescription)")
                    self?.errorMessage = error.localizedDescription
                    return
                }

                if let httpResponse = response as? HTTPURLResponse {
                    print("[LocationVM] fetchLocations: Response status \(httpResponse.statusCode)")
                }

                guard let data = data else { 
                    print("[LocationVM] fetchLocations: No data received")
                    return 
                }

                do {
                    let previousCount = self?.locations.count ?? 0
                    self?.locations = try JSONDecoder().decode([UserLocation].self, from: data)
                    print("[LocationVM] fetchLocations: Received \(self?.locations.count ?? 0) locations (was \(previousCount))")
                    
                    for location in self?.locations ?? [] {
                        let name = location.user?.displayName ?? location.user?.distinctName ?? "Unknown"
                        print("[LocationVM]   - \(name): \(location.latitude), \(location.longitude)")
                    }
                } catch {
                    print("[LocationVM] fetchLocations: Decoding error - \(error.localizedDescription)")
                    self?.errorMessage = error.localizedDescription
                }
            }
        }.resume()
    }

    func uploadUserLocation(userId: Int64) {
        guard let url = URL(string: "\(Config.backendURL)/api/users/location") else {
            print("[LocationVM] uploadUserLocation: Invalid URL")
            return 
        }
        
        guard let deviceLocation = getCurrentDeviceLocation() else {
            print("[LocationVM] uploadUserLocation: Could not get device location")
            return
        }

        print("[LocationVM] Uploading location: lat=\(deviceLocation.latitude), lng=\(deviceLocation.longitude) for user \(userId)")

        let body: [String: Any] = [
            "latitude": deviceLocation.latitude,
            "longitude": deviceLocation.longitude
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: body) else { 
            print("[LocationVM] uploadUserLocation: Failed to serialize JSON")
            return 
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.httpBody = jsonData
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(String(userId), forHTTPHeaderField: "X-User-Id")

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                print("[LocationVM] uploadUserLocation: Error - \(error.localizedDescription)")
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse {
                print("[LocationVM] uploadUserLocation: Response status \(httpResponse.statusCode)")
                if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                    print("[LocationVM] uploadUserLocation: Success!")
                } else {
                    if let data = data, let responseText = String(data: data, encoding: .utf8) {
                        print("[LocationVM] uploadUserLocation: Error response - \(responseText)")
                    }
                }
            }
        }.resume()
    }

    private var cachedLocation: CLLocationCoordinate2D?

    private func getCurrentDeviceLocation() -> CLLocationCoordinate2D? {
        if let providedLocation = coordinateProvider?() {
            cachedLocation = providedLocation
            return providedLocation
        }

        if let location = cachedLocation {
            return location
        }

        let manager = CLLocationManager()
        manager.requestWhenInUseAuthorization()
        if let location = manager.location {
            cachedLocation = location.coordinate
            return location.coordinate
        }
        return nil
    }
}

import SwiftUI

struct UserLocationListView: View {
    @State private var viewModel = UserLocationViewModel()
    var parties: [Party]
    
    var activeParty: Party? {
        parties.first(where: { $0.isActive }) ?? parties.first
    }

    var body: some View {
        NavigationStack {
            List(viewModel.locations) { location in
                HStack(spacing: 12) {
                    if let userId = location.user?.id {
                        UserProfileImageView(userId: Int(userId), size: 50, showBorder: false)
                    } else {
                        Image(systemName: "person.crop.circle")
                            .font(.system(size: 50))
                            .foregroundStyle(.gray)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(location.user?.displayName ?? location.user?.distinctName ?? "User")
                            .font(.headline)
                        Text("Lat: \(location.latitude, specifier: "%.6f")")
                            .font(.caption)
                        Text("Lon: \(location.longitude, specifier: "%.6f")")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("User Locations")
            .onAppear { 
                if let party = activeParty {
                    viewModel.fetchLocations(partyId: Int64(party.backendId))
                }
            }
            .refreshable { 
                if let party = activeParty {
                    viewModel.fetchLocations(partyId: Int64(party.backendId))
                }
            }
        }
    }
}

private struct AttendeeMapItem: Identifiable, Clusterable {
    let id: UUID
    let coordinate: CLLocationCoordinate2D
    let isSelf: Bool
    let userId: Int64?
    let isAtParty: Bool
    let displayName: String?
    let sourceUserLocation: UserLocation?

    init(id: UUID = UUID(),
         coordinate: CLLocationCoordinate2D,
         isSelf: Bool,
         userId: Int64?,
         isAtParty: Bool,
         displayName: String?,
         sourceUserLocation: UserLocation? = nil) {
        self.id = id
        self.coordinate = coordinate
        self.isSelf = isSelf
        self.userId = userId
        self.isAtParty = isAtParty
        self.displayName = displayName
        self.sourceUserLocation = sourceUserLocation
    }
}

struct PartyAttendeeMapView: View {
    let party: Party
    let locationManager: LocationManager

    @State private var viewModel = UserLocationViewModel()
    @State private var position: MapCameraPosition
    @State private var hasAppliedInitialRegion = false
    @State private var shouldPreserveUserCamera = false
    @State private var currentRegion: MKCoordinateRegion
    @State private var mapViewSize: CGSize = .zero
    @State private var attendeeClusters: [Cluster<AttendeeMapItem>] = []

    private let clusteringEngine = MapClusteringEngine()

    private var currentUserId: Int64? {
        let storedId = UserDefaults.standard.integer(forKey: "partyhub_user_id")
        return storedId > 0 ? Int64(storedId) : nil
    }

    init(party: Party, locationManager: LocationManager) {
        self.party = party
        self.locationManager = locationManager
        let initialRegion = MKCoordinateRegion(
            center: party.coordinate,
            latitudinalMeters: max(party.radiusMeters * 6, 600),
            longitudinalMeters: max(party.radiusMeters * 6, 600)
        )
        _position = State(initialValue: .region(initialRegion))
        _currentRegion = State(initialValue: initialRegion)
    }

    private func buildAttendeeItems() -> [AttendeeMapItem] {
        var items: [AttendeeMapItem] = []
        let excludeUserId = currentUserId

        for userLocation in viewModel.locations {
            if let userId = userLocation.user?.id, let excludeUserId = excludeUserId, userId == excludeUserId {
                continue
            }
            let item = AttendeeMapItem(
                coordinate: userLocation.coordinate,
                isSelf: false,
                userId: userLocation.user?.id,
                isAtParty: userLocation.isInsideParty(party),
                displayName: userLocation.user?.displayName ?? userLocation.user?.distinctName,
                sourceUserLocation: userLocation
            )
            items.append(item)
        }

        if let selfCoord = locationManager.currentLocation {
            let selfItem = AttendeeMapItem(
                coordinate: selfCoord,
                isSelf: true,
                userId: currentUserId,
                isAtParty: locationManager.isAtParty,
                displayName: "Du"
            )
            items.append(selfItem)
        }

        return items
    }

    private func recomputeAttendeeClusters() {
        guard mapViewSize.width > 0, mapViewSize.height > 0 else { return }

        let items = buildAttendeeItems()
        attendeeClusters = clusteringEngine.computeClusters(
            items: items,
            for: currentRegion,
            in: mapViewSize
        )
    }

    private func zoomToFit<T: Clusterable>(cluster: Cluster<T>) {
        let coordinates = cluster.items.map { $0.coordinate }
        if let fitRegion = MKCoordinateRegion.fitting(coordinates: coordinates) {
            withAnimation {
                position = .region(fitRegion)
            }
        }
    }

    var body: some View {
        GeometryReader { geo in
            mapContent
                .ignoresSafeArea()
                .navigationTitle("Teilnehmer-Karte")
                .navigationBarTitleDisplayMode(.inline)
                .onAppear {
                    mapViewSize = geo.size
                    locationManager.requestPermission()
                    viewModel.coordinateProvider = { locationManager.currentLocation }
                    viewModel.startPolling(partyId: Int64(party.backendId))
                    if let userId = UserDefaults.standard.object(forKey: "currentUserId") as? Int64 {
                        viewModel.startUploading(userId: userId)
                    }
                    updateVisibleRegion(force: true)
                }
                .onChange(of: geo.size) { _, newSize in
                    mapViewSize = newSize
                }
                .onMapCameraChange(frequency: .onEnd) { context in
                    currentRegion = context.region
                    if hasAppliedInitialRegion {
                        shouldPreserveUserCamera = true
                    }
                }
                .onChange(of: currentRegion) { _, _ in
                    recomputeAttendeeClusters()
                }
                .onChange(of: locationManager.currentLocation) { _, _ in
                    viewModel.coordinateProvider = { locationManager.currentLocation }
                    if let userId = UserDefaults.standard.object(forKey: "currentUserId") as? Int64 {
                        viewModel.uploadUserLocation(userId: userId)
                    }
                    updateVisibleRegion()
                    recomputeAttendeeClusters()
                }
                .onChange(of: viewModel.locations.count) { _, _ in
                    updateVisibleRegion()
                    recomputeAttendeeClusters()
                }
                .onDisappear {
                    viewModel.stopPolling()
                    viewModel.stopUploading()
                }
                .overlay(alignment: .top) {
                    statusOverlay
                }
        }
    }
    
    private var mapContent: some View {
        Map(position: $position) {
            partyAnnotation
            attendeeClusterAnnotations
        }
    }
    
    private var partyAnnotation: some MapContent {
        Annotation(party.name, coordinate: party.coordinate) {
            PartyPin(isActive: party.isActive)
        }
    }
    
    private var attendeeClusterAnnotations: some MapContent {
        ForEach(attendeeClusters, id: \.id) { cluster in
            if cluster.items.count == 1, let item = cluster.items.first {
                singleAttendeeAnnotation(for: item, at: cluster.coordinate)
            } else {
                attendeeClusterAnnotation(for: cluster)
            }
        }
    }
    
    private func singleAttendeeAnnotation(for item: AttendeeMapItem, at coordinate: CLLocationCoordinate2D) -> some MapContent {
        Annotation(item.displayName ?? "User", coordinate: coordinate) {
            AttendeePin(
                isAtParty: item.isAtParty,
                isSelf: item.isSelf,
                userId: item.userId != nil ? Int(item.userId!) : nil
            )
        }
    }
    
    private func attendeeClusterAnnotation(for cluster: Cluster<AttendeeMapItem>) -> some MapContent {
        Annotation("\(cluster.items.count) Teilnehmer", coordinate: cluster.coordinate) {
            AttendeeClusterPin(count: cluster.items.count)
                .onTapGesture { zoomToFit(cluster: cluster) }
        }
    }
    
    private var statusOverlay: some View {
        Group {
            if let errorMessage = viewModel.errorMessage {
                Text("Fehler beim Laden: \(errorMessage)")
                    .font(.footnote)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(.top, 12)
            } else if viewModel.isLoading {
                ProgressView("Teilnehmer werden geladen …")
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(.top, 12)
            } else if viewModel.locations.isEmpty && locationManager.currentLocation == nil {
                Text("Noch keine Teilnehmer-Standorte vorhanden.")
                    .font(.footnote)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(.top, 12)
            }
        }
    }

    private func updateVisibleRegion(force: Bool = false) {
        if shouldPreserveUserCamera && !force {
            return
        }

        var coordinates = [party.coordinate]
        coordinates.append(contentsOf: viewModel.locations.map {
            CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude)
        })

        if let currentLocation = locationManager.currentLocation {
            coordinates.append(currentLocation)
        }

        guard !coordinates.isEmpty else { return }

        let latitudes = coordinates.map(\.latitude)
        let longitudes = coordinates.map(\.longitude)

        guard let minLatitude = latitudes.min(),
              let maxLatitude = latitudes.max(),
              let minLongitude = longitudes.min(),
              let maxLongitude = longitudes.max() else {
            return
        }

        let center = CLLocationCoordinate2D(
            latitude: (minLatitude + maxLatitude) / 2,
            longitude: (minLongitude + maxLongitude) / 2
        )

        let latitudeSpan = max((maxLatitude - minLatitude) * 1.5, 0.01)
        let longitudeSpan = max((maxLongitude - minLongitude) * 1.5, 0.01)

        position = .region(
            MKCoordinateRegion(
                center: center,
                span: MKCoordinateSpan(
                    latitudeDelta: latitudeSpan,
                    longitudeDelta: longitudeSpan
                )
            )
        )
        hasAppliedInitialRegion = true
    }
}
