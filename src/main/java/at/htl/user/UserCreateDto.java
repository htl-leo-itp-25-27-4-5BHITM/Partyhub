package at.htl.user;

import at.htl.validation.NoHtml;
import at.htl.validation.SafeText;
import at.htl.validation.ValidPartyName;
import jakarta.validation.constraints.*;

public record UserCreateDto(
        @NotBlank(message = "Display name is required")
        @Size(min = 2, max = 50, message = "Display name must be 2-50 characters")
        @SafeText
        @ValidPartyName
        String displayName,

        @NotBlank(message = "Distinct name is required")
        @Size(min = 3, max = 30, message = "Distinct name must be 3-30 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Distinct name can only contain letters, numbers, and underscores")
        @SafeText
        String distinctName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 100, message = "Email too long")
        String email,

        @Size(max = 500, message = "Biography must be under 500 characters")
        @NoHtml
        @SafeText
        String biography
) {};