package at.htl.user_location;

import at.htl.user.User;

public record UserLocationDto(double latitude, double longitude, LocatedUser user) {

    public record LocatedUser(Long id, String displayName, String distinctName) {
    }

    public static UserLocationDto from(UserLocation location) {
        User user = location.getUser();
        LocatedUser locatedUser = user == null ? null
                : new LocatedUser(user.getId(), user.getDisplayName(), user.getDistinctName());
        return new UserLocationDto(location.getLatitude(), location.getLongitude(), locatedUser);
    }
}
