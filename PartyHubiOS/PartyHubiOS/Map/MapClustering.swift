import Foundation
import CoreLocation
import MapKit

// MARK: - Extensions for Map Compatibility
extension CLLocationCoordinate2D: @retroactive Equatable {
    public static func == (lhs: CLLocationCoordinate2D, rhs: CLLocationCoordinate2D) -> Bool {
        lhs.latitude == rhs.latitude && lhs.longitude == rhs.longitude
    }
}

extension MKCoordinateSpan: @retroactive Equatable {
    public static func == (lhs: MKCoordinateSpan, rhs: MKCoordinateSpan) -> Bool {
        lhs.latitudeDelta == rhs.latitudeDelta && lhs.longitudeDelta == rhs.longitudeDelta
    }
}

extension MKCoordinateRegion: @retroactive Equatable {
    public static func == (lhs: MKCoordinateRegion, rhs: MKCoordinateRegion) -> Bool {
        lhs.center == rhs.center && lhs.span == rhs.span
    }
}

// MARK: - Clustering Protocols & Models
protocol Clusterable {
    var coordinate: CLLocationCoordinate2D { get }
}

struct Cluster<T: Clusterable>: Identifiable {
    let id: UUID
    let coordinate: CLLocationCoordinate2D
    let items: [T]

    init(id: UUID = UUID(), coordinate: CLLocationCoordinate2D, items: [T]) {
        self.id = id
        self.coordinate = coordinate
        self.items = items
    }
}

// MARK: - Clustering Engine
class MapClusteringEngine {
    static let defaultThresholdPoints: CGFloat = 60

    func computeClusters<T: Clusterable>(
        items: [T],
        for region: MKCoordinateRegion,
        in viewSize: CGSize,
        thresholdPoints: CGFloat = MapClusteringEngine.defaultThresholdPoints
    ) -> [Cluster<T>] {
        guard !items.isEmpty, viewSize.width > 0, viewSize.height > 0 else { return [] }

        let thresholdMeters = self.thresholdMeters(for: region, viewSize: viewSize, thresholdPoints: thresholdPoints)
        return clusterByDistance(items: items, thresholdMeters: thresholdMeters)
    }

    private func clusterByDistance<T: Clusterable>(items: [T], thresholdMeters: CLLocationDistance) -> [Cluster<T>] {
        guard items.count > 1 else {
            return items.map { Cluster(coordinate: $0.coordinate, items: [$0]) }
        }

        var parent = [Int](0..<items.count)
        func find(_ x: Int) -> Int {
            if parent[x] != x { parent[x] = find(parent[x]) }
            return parent[x]
        }
        func union(_ x: Int, _ y: Int) {
            let rootX = find(x); let rootY = find(y)
            if rootX != rootY { parent[rootY] = rootX }
        }

        for i in 0..<items.count {
            for j in (i + 1)..<items.count {
                let loc1 = CLLocation(latitude: items[i].coordinate.latitude, longitude: items[i].coordinate.longitude)
                let loc2 = CLLocation(latitude: items[j].coordinate.latitude, longitude: items[j].coordinate.longitude)
                if loc1.distance(from: loc2) <= thresholdMeters { union(i, j) }
            }
        }

        var groups: [Int: [T]] = [:]
        for i in 0..<items.count {
            let root = find(i)
            groups[root, default: []].append(items[i])
        }

        return groups.map { Cluster(coordinate: computeCentroid(of: $1), items: $1) }
    }

    private func computeCentroid<T: Clusterable>(of items: [T]) -> CLLocationCoordinate2D {
        guard !items.isEmpty else { return kCLLocationCoordinate2DInvalid }
        let lat = items.map { $0.coordinate.latitude }.reduce(0, +) / Double(items.count)
        let lon = items.map { $0.coordinate.longitude }.reduce(0, +) / Double(items.count)
        return CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }

    func thresholdMeters(for region: MKCoordinateRegion, viewSize: CGSize, thresholdPoints: CGFloat) -> CLLocationDistance {
        let latDelta = region.span.latitudeDelta
        let metersPerPointLat = (latDelta * 111000) / viewSize.height
        return CLLocationDistance(thresholdPoints * metersPerPointLat)
    }
}

extension MKCoordinateRegion {
    static func fitting(coordinates: [CLLocationCoordinate2D]) -> MKCoordinateRegion? {
        guard !coordinates.isEmpty else { return nil }
        let lats = coordinates.map { $0.latitude }; let lons = coordinates.map { $0.longitude }
        let center = CLLocationCoordinate2D(latitude: (lats.min()! + lats.max()!) / 2, longitude: (lons.min()! + lons.max()!) / 2)
        let span = MKCoordinateSpan(latitudeDelta: (lats.max()! - lats.min()!) * 1.5, longitudeDelta: (lons.max()! - lons.min()!) * 1.5)
        return MKCoordinateRegion(center: center, span: span)
    }
}

// MARK: - Model Conformance
extension Party: Clusterable {}
