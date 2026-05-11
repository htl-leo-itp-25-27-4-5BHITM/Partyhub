import Foundation
import CoreLocation
import MapKit

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

class MapClusteringEngine {
    static let defaultThresholdPoints: CGFloat = 60

    func computeClusters<T: Clusterable>(
        items: [T],
        for region: MKCoordinateRegion,
        in viewSize: CGSize,
        thresholdPoints: CGFloat = MapClusteringEngine.defaultThresholdPoints
    ) -> [Cluster<T>] {
        guard !items.isEmpty, viewSize.width > 0, viewSize.height > 0 else {
            return []
        }

        let thresholdMeters = self.thresholdMeters(
            for: region,
            viewSize: viewSize,
            thresholdPoints: thresholdPoints
        )

        return clusterByDistance(items: items, thresholdMeters: thresholdMeters)
    }

    private func clusterByDistance<T: Clusterable>(
        items: [T],
        thresholdMeters: CLLocationDistance
    ) -> [Cluster<T>] {
        guard items.count > 1 else {
            return items.map { Cluster(coordinate: $0.coordinate, items: [$0]) }
        }

        var parent = [Int](0..<items.count)

        func find(_ x: Int) -> Int {
            if parent[x] != x {
                parent[x] = find(parent[x])
            }
            return parent[x]
        }

        func union(_ x: Int, _ y: Int) {
            let rootX = find(x)
            let rootY = find(y)
            if rootX != rootY {
                parent[rootY] = rootX
            }
        }

        for i in 0..<items.count {
            for j in (i + 1)..<items.count {
                let loc1 = CLLocation(latitude: items[i].coordinate.latitude, longitude: items[i].coordinate.longitude)
                let loc2 = CLLocation(latitude: items[j].coordinate.latitude, longitude: items[j].coordinate.longitude)
                let distance = loc1.distance(from: loc2)

                if distance <= thresholdMeters {
                    union(i, j)
                }
            }
        }

        var groups: [Int: [T]] = [:]
        for i in 0..<items.count {
            let root = find(i)
            if groups[root] == nil {
                groups[root] = []
            }
            groups[root]?.append(items[i])
        }

        var clusters: [Cluster<T>] = []
        for (_, groupItems) in groups {
            let centroid = computeCentroid(of: groupItems)
            clusters.append(Cluster(coordinate: centroid, items: groupItems))
        }

        return clusters
    }

    private func computeCentroid<T: Clusterable>(of items: [T]) -> CLLocationCoordinate2D {
        guard !items.isEmpty else {
            return kCLLocationCoordinate2DInvalid
        }

        var sumLat: Double = 0
        var sumLon: Double = 0

        for item in items {
            sumLat += item.coordinate.latitude
            sumLon += item.coordinate.longitude
        }

        let count = Double(items.count)
        return CLLocationCoordinate2D(
            latitude: sumLat / count,
            longitude: sumLon / count
        )
    }

    func thresholdMeters(
        for region: MKCoordinateRegion,
        viewSize: CGSize,
        thresholdPoints: CGFloat
    ) -> CLLocationDistance {
        let latDelta = region.span.latitudeDelta
        let metersPerPointLat = (latDelta * 111000) / viewSize.height

        let centerLat = region.center.latitude
        let lonMultiplier = cos(centerLat * .pi / 180)
        let lonDelta = region.span.longitudeDelta
        let metersPerPointLon = (lonDelta * 111000 * lonMultiplier) / viewSize.width

        let avgMetersPerPoint = (metersPerPointLat + metersPerPointLon) / 2
        return CLLocationDistance(thresholdPoints * avgMetersPerPoint)
    }
}

extension MKCoordinateRegion {
    static func fitting(coordinates: [CLLocationCoordinate2D]) -> MKCoordinateRegion? {
        guard !coordinates.isEmpty else { return nil }

        var minLat = coordinates[0].latitude
        var maxLat = coordinates[0].latitude
        var minLon = coordinates[0].longitude
        var maxLon = coordinates[0].longitude

        for coord in coordinates {
            minLat = min(minLat, coord.latitude)
            maxLat = max(maxLat, coord.latitude)
            minLon = min(minLon, coord.longitude)
            maxLon = max(maxLon, coord.longitude)
        }

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )

        var latDelta = (maxLat - minLat) * 1.5
        var lonDelta = (maxLon - minLon) * 1.5

        latDelta = max(latDelta, 0.005)
        lonDelta = max(lonDelta, 0.005)

        return MKCoordinateRegion(
            center: center,
            span: MKCoordinateSpan(latitudeDelta: latDelta, longitudeDelta: lonDelta)
        )
    }
}

extension Party: Clusterable {}
