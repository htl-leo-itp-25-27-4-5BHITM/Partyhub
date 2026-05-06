package at.htl.party;

import at.htl.validation.OnCreate;
import at.htl.validation.OnUpdate;
import at.htl.validation.ValidPartyName;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

public record PartyCreateDto(
        @NotBlank(message = "Title is required", groups = {OnCreate.class, OnUpdate.class})
        @Size(min = 2, max = 100, message = "Title must be 2-100 characters")
        @ValidPartyName
        String title,

        @Size(max = 2000, message = "Description must be under 2000 characters")
        String description,

        @DecimalMin(value = "0.0", message = "Fee must be positive")
        @DecimalMax(value = "99999.99", message = "Fee is too high")
        Double fee,

        @NotNull(message = "Start time is required", groups = OnCreate.class)
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime time_start,

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime time_end,

        @Min(value = 1, message = "At least 1 person required")
        @Max(value = 10000, message = "Maximum 10000 people allowed")
        Integer max_people,

        @Min(value = 0, message = "Minimum age is 0")
        @Max(value = 150, message = "Maximum age is 150")
        Integer min_age,

        @Min(value = 0, message = "Minimum age is 0")
        @Max(value = 150, message = "Maximum age is 150")
        Integer max_age,

        @Size(max = 500, message = "Website URL too long")
        String website,

        Double latitude,

        Double longitude,

        @Size(max = 500, message = "Address too long")
        String location_address,

        @Size(max = 50, message = "Theme too long")
        String theme,

        @Size(max = 20, message = "Visibility too long")
        String visibility,

        List<String> selectedUsers
) { }