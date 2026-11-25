package at.htl.bringalong;

import at.htl.validation.NoHtml;
import at.htl.validation.TextInput;
import at.htl.validation.StrictIntDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.*;

public record BringAlongItemRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        @NoHtml(message = "Name must not contain HTML")
        @TextInput
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class)
        String name,

        @Size(max = 30, message = "Unit must be at most 30 characters")
        @NoHtml(message = "Unit must not contain HTML")
        @TextInput
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictTextDeserializer.class)
        String unit,

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 10000, message = "Quantity must be at most 10000")
        @JsonDeserialize(using = StrictIntDeserializer.class)
        Integer quantity
) {}
