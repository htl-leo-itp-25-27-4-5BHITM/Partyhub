package at.htl.invitation;

import jakarta.validation.constraints.*;

public record InvitationDto(
        @NotNull(message = "Recipient ID is required")
        @Positive
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictLongDeserializer.class)
        Long recipient,

        @NotNull(message = "Party ID is required")
        @Positive
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictLongDeserializer.class)
        Long partyId
) {
}
