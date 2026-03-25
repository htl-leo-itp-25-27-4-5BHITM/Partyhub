package at.htl.user_location;

import java.util.UUID;

public record UserLocationUpdateDto(UUID userId, double latitude, double longitude) {
}
