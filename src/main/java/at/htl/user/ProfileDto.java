package at.htl.user;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProfileDto(Long id, String displayName, String distinctName, String biography,
                         String username, String email, String phoneNumber) {
    public static ProfileDto from(User user, boolean self) {
        return new ProfileDto(user.getId(), user.getDisplayName(), user.getDistinctName(), user.getBiography(),
                self ? user.getUsername() : null, self ? user.getEmail() : null,
                self ? user.getPhoneNumber() : null);
    }
}
