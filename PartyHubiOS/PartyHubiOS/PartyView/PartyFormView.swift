import SwiftUI
import MapKit
import CoreLocation

struct PartyEditData: Sendable {
    let title: String
    let description: String
    let location: String
    let latitude: Double
    let longitude: Double
    let timeStart: Date?
    let timeEnd: Date?
    let maxPeople: Int?
    let minAge: Int?
    let maxAge: Int?
    let website: String?
    let fee: Double?
    let categoryId: Int?
}

struct PartyFormEditSnapshot: Equatable, Sendable {
    let title: String
    let description: String
    let location: String
    let latitude: Double
    let longitude: Double
    let timeStart: Date?
    let timeEnd: Date?
    let maxPeople: Int?
    let minAge: Int?
    let maxAge: Int?
    let website: String?
    let fee: Double?
    let categoryId: Int?

    init(party: Party) {
        title = Self.stableString(party.name)
        description = Self.stableString(party.partyDescription ?? "")
        location = Self.stableString(party.location)
        latitude = party.latitude
        longitude = party.longitude
        timeStart = party.timeStart
        timeEnd = party.timeEnd
        maxPeople = party.maxPeople
        minAge = party.minAge
        maxAge = party.maxAge
        website = party.website.map(Self.stableString)
        fee = party.fee
        categoryId = party.categoryId
    }

    nonisolated private static func stableString(_ value: String) -> String {
        String(decoding: value.utf8, as: UTF8.self)
    }
}

enum PartyFormMode: Equatable, Sendable {
    case create
    case edit(PartyFormEditSnapshot)
}

struct PartyFormView: View {
    let mode: PartyFormMode
    let onSave: @MainActor (PartyEditData) async -> Bool

    @Environment(LocationManager.self) private var locationManager
    @Environment(\.dismiss) private var dismiss

    @State private var title: String
    @State private var description: String
    @State private var location: String
    @State private var timeStart: Date
    @State private var timeEnd: Date
    @State private var maxPeople: String
    @State private var minAge: String
    @State private var maxAge: String
    @State private var website: String
    @State private var fee: String
    @State private var isSaving = false
    @State private var selectedLat = 0.0
    @State private var selectedLng = 0.0
    @State private var showMapPicker = false

    private var defaultLatitude: Double {
        locationManager.currentLocation?.latitude ?? 48.2082
    }

    private var defaultLongitude: Double {
        locationManager.currentLocation?.longitude ?? 16.3738
    }

    init(mode: PartyFormMode, onSave: @escaping @MainActor (PartyEditData) async -> Bool) {
        self.mode = mode
        self.onSave = onSave

        switch mode {
        case .create:
            _title = State(initialValue: "")
            _description = State(initialValue: "")
            _location = State(initialValue: "")
            _timeStart = State(initialValue: Date())
            _timeEnd = State(initialValue: Date().addingTimeInterval(3600 * 4))
            _maxPeople = State(initialValue: "")
            _minAge = State(initialValue: "18")
            _maxAge = State(initialValue: "99")
            _website = State(initialValue: "")
            _fee = State(initialValue: "0.00")
        case .edit(let snapshot):
            _title = State(initialValue: snapshot.title)
            _description = State(initialValue: snapshot.description)
            _location = State(initialValue: snapshot.location)
            _selectedLat = State(initialValue: snapshot.latitude)
            _selectedLng = State(initialValue: snapshot.longitude)
            _timeStart = State(initialValue: snapshot.timeStart ?? Date())
            _timeEnd = State(initialValue: snapshot.timeEnd ?? Date())
            _maxPeople = State(initialValue: snapshot.maxPeople.map { "\($0)" } ?? "")
            _minAge = State(initialValue: snapshot.minAge.map { "\($0)" } ?? "18")
            _maxAge = State(initialValue: snapshot.maxAge.map { "\($0)" } ?? "99")
            _website = State(initialValue: snapshot.website ?? "")
            _fee = State(initialValue: snapshot.fee.map { String(format: "%.2f", $0) } ?? "0.00")
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("General") {
                    TextField("Title", text: $title)
                    TextField("Description", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Place") {
                    HStack {
                        TextField("Address", text: $location)
                        Button { showMapPicker = true } label: {
                            Image(systemName: "map.fill")
                        }
                    }
                    if selectedLat != 0 {
                        Text("\(selectedLat, specifier: "%.5f"), \(selectedLng, specifier: "%.5f")")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("Time") {
                    DatePicker("Start", selection: $timeStart)
                    DatePicker("End", selection: $timeEnd)
                }

                Section("Participants") {
                    TextField("Max. Participants", text: $maxPeople)
                        .keyboardType(.numberPad)
                }
                Section("Age"){
                    HStack {
                        TextField("Min. Age", text: $minAge)
                            .keyboardType(.numberPad)
                        Text("-")
                        TextField("Max. Age", text: $maxAge)
                            .keyboardType(.numberPad)
                    }
                }

                Section("Further Information") {
                    TextField("Website", text: $website)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                    TextField("Admission (€)", text: $fee)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle(mode == .create ? "New Party" : "Edit Party")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        save()
                    }
                    .fontWeight(.semibold)
                    .disabled(isSaving)
                }
            }
            .sheet(isPresented: $showMapPicker) {
                MapLocationPickerView(
                    latitude: Binding(
                        get: { selectedLat != 0 ? selectedLat : defaultLatitude },
                        set: { selectedLat = $0 }
                    ),
                    longitude: Binding(
                        get: { selectedLng != 0 ? selectedLng : defaultLongitude },
                        set: { selectedLng = $0 }
                    ),
                    address: $location
                )
            }
            .overlay {
                if isSaving {
                    Color.black.opacity(0.2)
                        .ignoresSafeArea()
                        .allowsHitTesting(false)
                    ProgressView()
                        .scaleEffect(1.5)
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(10)
                        .shadow(radius: 10)
                        .allowsHitTesting(false)
                }
            }
        }
    }

    private func save() {
        isSaving = true

        if case .create = mode {
            Task { @MainActor in await sendCreateRequest() }
        } else {
            let lat: Double
            let lng: Double

            let categoryId: Int?

            if case .edit(let snapshot) = mode {
                lat = selectedLat != 0 ? selectedLat : snapshot.latitude
                lng = selectedLng != 0 ? selectedLng : snapshot.longitude
                categoryId = snapshot.categoryId
            } else {
                lat = defaultLatitude
                lng = defaultLongitude
                categoryId = nil
            }

            let data = PartyEditData(
                title: stableString(title),
                description: stableString(description),
                location: stableString(location),
                latitude: lat,
                longitude: lng,
                timeStart: timeStart,
                timeEnd: timeEnd,
                maxPeople: Int(maxPeople),
                minAge: Int(minAge),
                maxAge: Int(maxAge),
                website: website.isEmpty ? nil : stableString(website),
                fee: Double(fee.replacingOccurrences(of: ",", with: ".")),
                categoryId: categoryId
            )

            Task { @MainActor in
                let success = await onSave(data)
                isSaving = false
                if success { dismiss() }
            }
        }
    }

    @MainActor
    private func sendCreateRequest() async {
        let lat = selectedLat != 0 ? selectedLat : defaultLatitude
        let lng = selectedLng != 0 ? selectedLng : defaultLongitude

        var body: [String: Any] = [
            "title": title.isEmpty ? "New Party" : stableString(title),
            "description": description.isEmpty ? "Party Description" : stableString(description),
            "fee": Double(fee.replacingOccurrences(of: ",", with: ".")) ?? 0,
            "time_start": PartyDateFormatter.stringForBackend(timeStart),
            "time_end": PartyDateFormatter.stringForBackend(timeEnd),
            "website": stableString(website),
            "latitude": lat,
            "longitude": lng,
            "location_address": location.isEmpty ? "TBD" : stableString(location),
            "theme": "Standard",
            "visibility": "public",
            "selectedUsers": [String](),
        ]

        if let v = Int(maxPeople) { body["max_people"] = v }
        if let v = Int(minAge) { body["min_age"] = v }
        if let v = Int(maxAge) { body["max_age"] = v }

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: body)

            var request = URLRequest(url: URL(string: "\(Config.backendURL)/api/parties")!)
            request.httpMethod = "POST"
            request.timeoutInterval = 15
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("Bearer \(try await KeycloakAuthService.shared.validAccessToken())", forHTTPHeaderField: "Authorization")
            request.httpBody = jsonData

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                isSaving = false
                return
            }

            isSaving = false
            NotificationCenter.default.post(name: .partyDidUpdate, object: nil)
            dismiss()

        } catch {
            print("[FORM] create error: \(error)")
            isSaving = false
        }
    }

    private func stableString(_ value: String) -> String {
        String(decoding: value.utf8, as: UTF8.self)
    }
}
