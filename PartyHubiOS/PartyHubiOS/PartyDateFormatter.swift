import Foundation

enum PartyDateFormatter {
    static func parseBackendDate(_ dateString: String?) -> Date? {
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
            let formatter = makeFormatter(format: format)
            if let date = formatter.date(from: dateString) {
                return date
            }
        }

        return nil
    }

    static func stringForBackend(_ date: Date) -> String {
        makeFormatter(format: "yyyy-MM-dd'T'HH:mm:ss").string(from: date)
    }

    static func stringForDisplay(_ date: Date) -> String {
        makeFormatter(format: "dd.MM.yyyy HH:mm").string(from: date)
    }

    private static func makeFormatter(format: String) -> DateFormatter {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = format
        return formatter
    }
}
