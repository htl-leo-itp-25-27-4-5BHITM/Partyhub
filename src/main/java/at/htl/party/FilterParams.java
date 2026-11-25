package at.htl.party;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public record FilterParams(
    String query,
    String theme,
    Integer userAge,
    Boolean free,
    Double userLatitude,
    Double userLongitude,
    Integer distanceKm,
    Integer limit,
    Integer offset
) {
    public FilterParams {
        if (query != null && query.length() > 200 || theme != null && theme.length() > 50)
            throw new IllegalArgumentException("Search text too long");
        if (userLatitude != null && (!Double.isFinite(userLatitude) || userLatitude < -90 || userLatitude > 90)
                || userLongitude != null && (!Double.isFinite(userLongitude) || userLongitude < -180 || userLongitude > 180))
            throw new IllegalArgumentException("Invalid coordinates");
        if (limit != null && (limit <= 0 || limit > 100)) {
            throw new IllegalArgumentException("limit must be positive");
        }
        if (offset != null && (offset < 0 || offset > 1000000)) {
            throw new IllegalArgumentException("offset must be non-negative");
        }
        if (userAge != null && (userAge < 0 || userAge > 150)) {
            throw new IllegalArgumentException("userAge must be between 0 and 150");
        }
        if (distanceKm != null && (distanceKm <= 0 || distanceKm > 20000)) {
            throw new IllegalArgumentException("distanceKm must be positive");
        }
        if ((userLatitude == null) != (userLongitude == null)) {
            throw new IllegalArgumentException("both userLatitude and userLongitude must be provided together");
        }
    }

    public boolean hasLocationFilter() {
        return userLatitude != null && userLongitude != null && distanceKm != null;
    }

    public boolean hasTextSearch() {
        return query != null && !query.isBlank();
    }

    public boolean hasThemeFilter() {
        return theme != null && !theme.isBlank();
    }

    public boolean hasAgeFilter() {
        return userAge != null;
    }

    public boolean hasFeeFilter() {
        return free != null;
    }

    public boolean isFreeOnly() {
        return free != null && free;
    }

    public boolean isPaidOnly() {
        return free != null && !free;
    }
}
