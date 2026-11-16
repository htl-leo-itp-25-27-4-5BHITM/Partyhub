package at.htl.bringalong;

import at.htl.validation.StrictIntDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BringAlongPledgeRequest(
        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 10000, message = "Quantity must be at most 10000")
        @JsonDeserialize(using = StrictIntDeserializer.class)
        Integer quantity
) {}
