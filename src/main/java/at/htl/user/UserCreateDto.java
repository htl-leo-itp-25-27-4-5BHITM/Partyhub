package at.htl.user;

import jakarta.validation.constraints.Past;

import java.time.LocalDate;

public record UserCreateDto(String displayName, String distinctName, String email, String phoneNumber, String biography,
                            Gender gender,
                            @Past(message = "Birth date must be in the past") LocalDate birthDate) {

    /** Profile without the optional demographic fields. */
    public UserCreateDto(String displayName, String distinctName, String email, String phoneNumber, String biography) {
        this(displayName, distinctName, email, phoneNumber, biography, null, null);
    }
}
