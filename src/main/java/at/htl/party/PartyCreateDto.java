package at.htl.party;

import at.htl.validation.OnCreate;
import at.htl.validation.TextInput;
import at.htl.validation.Website;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import at.htl.validation.StrictIntDeserializer;
import at.htl.validation.ValidPartyName;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

public record PartyCreateDto(
        @NotBlank(message = "Title is required")
        @Size(min = 2, max = 100, message = "Title must be 2-100 characters")
        @ValidPartyName
        @TextInput
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class)
        String title,

        @Size(max = 2000, message = "Description must be under 2000 characters")
        @TextInput(multiline=true)
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class)
        String description,

        @DecimalMin(value = "0.0", message = "Fee must be positive")
        @DecimalMax(value = "99999.99", message = "Fee is too high")
        @JsonDeserialize(using=at.htl.validation.StrictDoubleDeserializer.class)
        Double fee,

        @NotNull(message = "Start time is required", groups = OnCreate.class)
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime time_start,

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime time_end,

        @Min(value = 1, message = "At least 1 person required")
        @Max(value = 10000, message = "Maximum 10000 people allowed")
        @JsonDeserialize(using=StrictIntDeserializer.class)
        Integer max_people,

        @Min(value = 0, message = "Minimum age is 0")
        @Max(value = 150, message = "Maximum age is 150")
        @JsonDeserialize(using=StrictIntDeserializer.class)
        Integer min_age,

        @Min(value = 0, message = "Minimum age is 0")
        @Max(value = 150, message = "Maximum age is 150")
        @JsonDeserialize(using=StrictIntDeserializer.class)
        Integer max_age,

        @Size(max = 500, message = "Website URL too long")
        @Website
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class)
        String website,

        @DecimalMin("-90") @DecimalMax("90")
        @JsonDeserialize(using=at.htl.validation.StrictDoubleDeserializer.class)
        Double latitude,

        @DecimalMin("-180") @DecimalMax("180")
        @JsonDeserialize(using=at.htl.validation.StrictDoubleDeserializer.class)
        Double longitude,

        @Size(max = 500, message = "Address too long")
        @TextInput
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class)
        String location_address,

        @Size(max = 50, message = "Theme too long")
        @TextInput
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class)
        String theme,

        @Size(max = 20, message = "Visibility too long")
        @Pattern(regexp="(?i)PUBLIC|PRIVATE")
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class)
        String visibility,

        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(contentUsing=at.htl.validation.StrictTextDeserializer.class)
        @Size(max=1000) List<@NotBlank @Size(max=255) @Pattern(regexp="(?U)[^\\s\\p{Cc}]+") @TextInput String> selectedUsers
) {
    public PartyCreateDto {
        website = at.htl.validation.InputPolicy.optional(website);
    }

    @AssertTrue(message="Party coordinates or numeric values are invalid")
    @JsonIgnore
    public boolean isConsistent() {
        return ((latitude == null) == (longitude == null))
            && (latitude == null || Double.isFinite(latitude))
            && (longitude == null || Double.isFinite(longitude))
            && (fee == null || Double.isFinite(fee));
    }
}