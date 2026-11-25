package at.htl.user;
import at.htl.validation.TextInput;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
public record UserCreateDto(
    @Size(max=255) @TextInput @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class) String displayName,
    @Size(min=1, max=255) @Pattern(regexp="(?U)[^\\s\\p{Cc}]+") @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class) String distinctName,
    @Email @Size(max=254) @TextInput @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class) String email,
    @Size(max=255) @TextInput @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class) String phoneNumber,
    @Size(max=2000) @TextInput(multiline=true) @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class) String biography,
    Gender gender, @Past(message="Birth date must be in the past") LocalDate birthDate) {
    public UserCreateDto {
        distinctName = at.htl.validation.InputPolicy.optional(distinctName);
        email = at.htl.validation.InputPolicy.optional(email);
    }

    public UserCreateDto(String displayName, String distinctName, String email, String phoneNumber, String biography) {
        this(displayName, distinctName, email, phoneNumber, biography, null, null);
    }
}
