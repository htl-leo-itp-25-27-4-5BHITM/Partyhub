package at.htl.invitation;

import jakarta.validation.constraints.*;
import at.htl.validation.SafeText;

public record InvitationDto(
        @NotNull(message = "Recipient ID is required")
        Long recipient,

        @NotNull(message = "Party ID is required")
        @SafeText
        Long partyId
) {
}
