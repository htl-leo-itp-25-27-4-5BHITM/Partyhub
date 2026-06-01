import SwiftUI
import CoreLocation

struct PartyEditData {
    var title: String
    var description: String
    var location: String
    var latitude: Double
    var longitude: Double
    var timeStart: Date?
    var timeEnd: Date?
    var maxPeople: Int?
    var minAge: Int?
    var maxAge: Int?
    var website: String?
    var fee: Double?
    var categoryId: Int?
}

enum PartyFormMode: Equatable {
    case create
    case edit(Party)

    static func == (lhs: PartyFormMode, rhs: PartyFormMode) -> Bool {
        switch (lhs, rhs) {
        case (.create, .create): return true
        case (.edit(let a), .edit(let b)): return a.backendId == b.backendId
        default: return false
        }
    }
}

struct PartyFormView: View {
    let mode: PartyFormMode
    let onSave: (PartyEditData) async -> Bool

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
    @State private var hasInitializedLocation = false

    private var defaultLatitude: Double {
        locationManager.currentLocation?.latitude ?? 48.2082
    }

    private var defaultLongitude: Double {
        locationManager.currentLocation?.longitude ?? 16.3738
    }

    init(mode: PartyFormMode, onSave: @escaping (PartyEditData) async -> Bool) {
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
        case .edit(let party):
            _title = State(initialValue: party.name)
            _description = State(initialValue: party.partyDescription ?? "")
            _location = State(initialValue: party.location)
            _timeStart = State(initialValue: party.timeStart ?? Date())
            _timeEnd = State(initialValue: party.timeEnd ?? Date())
            _maxPeople = State(initialValue: party.maxPeople.map { "\($0)" } ?? "")
            _minAge = State(initialValue: party.minAge.map { "\($0)" } ?? "18")
            _maxAge = State(initialValue: party.maxAge.map { "\($0)" } ?? "99")
            _website = State(initialValue: party.website ?? "")
            _fee = State(initialValue: party.fee.map { String(format: "%.2f", $0) } ?? "0.00")
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
                    TextField("Address", text: $location)
                }

                Section("Time") {
                    DatePicker("Start", selection: $timeStart)
                    DatePicker("End", selection: $timeEnd)
                }

                Section("Participants") {
                    TextField("Max. Participants", text: $maxPeople)
                        .keyboardType(.numberPad)
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
                    .disabled(title.isEmpty || location.isEmpty || isSaving)
                }
            }
            .overlay {
                if isSaving {
                    Color.black.opacity(0.2)
                        .ignoresSafeArea()
                    ProgressView()
                        .scaleEffect(1.5)
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(10)
                        .shadow(radius: 10)
                }
            }
        }
    }

    private func save() {
        let lat: Double
        let lng: Double

        if case .edit(let party) = mode {
            lat = party.latitude
            lng = party.longitude
        } else {
            lat = defaultLatitude
            lng = defaultLongitude
        }

        let data = PartyEditData(
            title: title,
            description: description,
            location: location,
            latitude: lat,
            longitude: lng,
            timeStart: timeStart,
            timeEnd: timeEnd,
            maxPeople: Int(maxPeople),
            minAge: Int(minAge),
            maxAge: Int(maxAge),
            website: website.isEmpty ? nil : website,
            fee: Double(fee.replacingOccurrences(of: ",", with: ".")),
            categoryId: nil
        )

        isSaving = true
        Task {
            let success = await onSave(data)
            await MainActor.run {
                isSaving = false
                if success {
                    dismiss()
                }
            }
        }
    }
}
