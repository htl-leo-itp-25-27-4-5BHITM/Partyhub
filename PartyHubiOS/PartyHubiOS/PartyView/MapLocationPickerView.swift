import SwiftUI
import MapKit

struct MapLocationPickerView: View {
    @Binding var latitude: Double
    @Binding var longitude: Double
    @Binding var address: String

    @Environment(\.dismiss) private var dismiss
    @Environment(LocationManager.self) private var locationManager

    @State private var position: MapCameraPosition
    @State private var pinCoordinate: CLLocationCoordinate2D
    @State private var searchQuery = ""
    @State private var resolvedAddress = ""
    @State private var isResolving = false

    init(latitude: Binding<Double>, longitude: Binding<Double>, address: Binding<String>) {
        self._latitude = latitude
        self._longitude = longitude
        self._address = address

        let lat = latitude.wrappedValue != 0 ? latitude.wrappedValue : 48.2082
        let lng = longitude.wrappedValue != 0 ? longitude.wrappedValue : 16.3738
        let coord = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        _pinCoordinate = State(initialValue: coord)
        _position = State(initialValue: .region(MKCoordinateRegion(
            center: coord,
            latitudinalMeters: 1000,
            longitudinalMeters: 1000
        )))
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                searchBar
                mapArea
                addressFooter
            }
            .navigationTitle("Set Location")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Set Location") {
                        latitude = pinCoordinate.latitude
                        longitude = pinCoordinate.longitude
                        address = resolvedAddress
                        dismiss()
                    }
                }
            }
        }
    }

    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
            TextField("Search for a place", text: $searchQuery)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .onSubmit { performSearch() }
            if !searchQuery.isEmpty {
                Button { searchQuery = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(10)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .padding()
    }

    private var mapArea: some View {
        MapReader { reader in
            Map(position: $position) {
                Marker("Selected", coordinate: pinCoordinate)
            }
            .onTapGesture { location in
                if let coord = reader.convert(location, from: .local) {
                    pinCoordinate = coord
                    resolveAddress(for: coord)
                }
            }
        }
    }

    private var addressFooter: some View {
        HStack {
            if isResolving {
                ProgressView()
                    .scaleEffect(0.8)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(resolvedAddress.isEmpty ? "Tap the map to place a pin" : resolvedAddress)
                    .font(.subheadline)
                    .foregroundStyle(resolvedAddress.isEmpty ? .secondary : .primary)
                Text("\(pinCoordinate.latitude, specifier: "%.5f"), \(pinCoordinate.longitude, specifier: "%.5f")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
    }

    private func performSearch() {
        guard !searchQuery.isEmpty else { return }
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = searchQuery
        let search = MKLocalSearch(request: request)
        Task {
            guard let response = try? await search.start(),
                  let item = response.mapItems.first else { return }
            let coord = item.placemark.coordinate
            pinCoordinate = coord
            position = .region(MKCoordinateRegion(
                center: coord,
                latitudinalMeters: 1000,
                longitudinalMeters: 1000
            ))
            resolvedAddress = item.name ?? item.placemark.title ?? ""
            searchQuery = ""
        }
    }

    private func resolveAddress(for coord: CLLocationCoordinate2D) {
        isResolving = true
        let location = CLLocation(latitude: coord.latitude, longitude: coord.longitude)

        if #available(iOS 26, *) {
            Task {
                guard let request = MKReverseGeocodingRequest(location: location) else {
                    await fallbackReverseGeocode(location)
                    return
                }
                let mapItems = try? await request.mapItems
                resolvedAddress = mapItems?.first?.address?.fullAddress
                    ?? mapItems?.first?.name
                    ?? ""
                isResolving = false
            }
        } else {
            Task {
                await fallbackReverseGeocode(location)
            }
        }
    }

    private func fallbackReverseGeocode(_ location: CLLocation) async {
        let placemarks = try? await CLGeocoder().reverseGeocodeLocation(location)
        let parts: [String?] = [
            placemarks?.first?.thoroughfare,
            placemarks?.first?.subThoroughfare,
            placemarks?.first?.postalCode,
            placemarks?.first?.locality,
        ]
        resolvedAddress = parts.compactMap { $0 }.joined(separator: " ")
        isResolving = false
    }
}
